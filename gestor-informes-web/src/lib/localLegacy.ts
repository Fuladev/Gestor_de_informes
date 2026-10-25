import Dexie, { type EntityTable } from 'dexie'
import type { Evidence, FullReport, Report, ReportData, Service } from './types'
import { sortEvidences } from './lib/sort'
import type { ProcessedImage } from './lib/images'

const db = new Dexie('gestor-informes') as Dexie & {
  reports: EntityTable<Report, 'id'>
  services: EntityTable<Service, 'id'>
  evidences: EntityTable<Evidence, 'id'>
}

db.version(1).stores({
  reports: '++id, ordenObra, updatedAt',
  services: '++id, reportId, posicion',
  evidences: '++id, serviceId, nombre',
})

export { db }

async function touchReport(reportId: number) {
  await db.reports.update(reportId, { updatedAt: Date.now() })
}

async function reportIdOfService(serviceId: number): Promise<number> {
  const service = await db.services.get(serviceId)
  if (!service) throw new Error('El servicio no existe')
  return service.reportId
}

// ---------- Informes ----------

export async function createReport(data: ReportData): Promise<number> {
  const now = Date.now()
  return (await db.reports.add({ ...data, createdAt: now, updatedAt: now })) as number
}

export async function updateReport(id: number, data: ReportData): Promise<void> {
  await db.reports.update(id, { ...data, updatedAt: Date.now() })
}

export async function deleteReport(id: number): Promise<void> {
  await db.transaction('rw', db.reports, db.services, db.evidences, async () => {
    const serviceIds = (await db.services.where('reportId').equals(id).primaryKeys()) as number[]
    await db.evidences.where('serviceId').anyOf(serviceIds).delete()
    await db.services.bulkDelete(serviceIds)
    await db.reports.delete(id)
  })
}

export async function getFullReport(id: number): Promise<FullReport | undefined> {
  const report = await db.reports.get(id)
  if (!report) return undefined
  const services = await db.services.where('reportId').equals(id).sortBy('posicion')
  const withEvidences = await Promise.all(
    services.map(async (s) => ({
      ...s,
      evidences: sortEvidences(await db.evidences.where('serviceId').equals(s.id!).toArray()),
    })),
  )
  return { report, services: withEvidences }
}

// ---------- Servicios ----------

export async function createService(reportId: number, nombre: string): Promise<number> {
  const last = await db.services.where('reportId').equals(reportId).sortBy('posicion')
  const posicion = last.length ? last[last.length - 1].posicion + 1 : 1
  const id = (await db.services.add({ reportId, nombre: nombre.trim(), posicion, createdAt: Date.now() })) as number
  await touchReport(reportId)
  return id
}

export async function renameService(id: number, nombre: string): Promise<void> {
  await db.services.update(id, { nombre: nombre.trim() })
  await touchReport(await reportIdOfService(id))
}

export async function deleteService(id: number): Promise<void> {
  const reportId = await reportIdOfService(id)
  await db.transaction('rw', db.services, db.evidences, async () => {
    await db.evidences.where('serviceId').equals(id).delete()
    await db.services.delete(id)
    // Renumerar para que no queden huecos (1, 2, 3...).
    const rest = await db.services.where('reportId').equals(reportId).sortBy('posicion')
    await Promise.all(rest.map((s, i) => db.services.update(s.id!, { posicion: i + 1 })))
  })
  await touchReport(reportId)
}

export async function moveService(id: number, direction: -1 | 1): Promise<void> {
  const reportId = await reportIdOfService(id)
  await db.transaction('rw', db.services, async () => {
    const list = await db.services.where('reportId').equals(reportId).sortBy('posicion')
    const index = list.findIndex((s) => s.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    await Promise.all(list.map((s, i) => db.services.update(s.id!, { posicion: i + 1 })))
  })
  await touchReport(reportId)
}

// ---------- Evidencias ----------

export async function addEvidences(serviceId: number, images: ProcessedImage[]): Promise<void> {
  const now = Date.now()
  await db.evidences.bulkAdd(
    images.map((img, i) => ({
      serviceId,
      nombre: img.nombre,
      blob: img.blob,
      width: img.width,
      height: img.height,
      originalName: img.originalName,
      createdAt: now + i,
    })),
  )
  await touchReport(await reportIdOfService(serviceId))
}

export async function renameEvidence(id: number, nombre: string): Promise<void> {
  const ev = await db.evidences.get(id)
  if (!ev) return
  await db.evidences.update(id, { nombre: nombre.trim() })
  await touchReport(await reportIdOfService(ev.serviceId))
}

export async function replaceEvidence(id: number, image: ProcessedImage): Promise<void> {
  const ev = await db.evidences.get(id)
  if (!ev) return
  await db.evidences.update(id, {
    blob: image.blob,
    width: image.width,
    height: image.height,
    originalName: image.originalName,
  })
  await touchReport(await reportIdOfService(ev.serviceId))
}

export async function deleteEvidence(id: number): Promise<void> {
  const ev = await db.evidences.get(id)
  if (!ev) return
  await db.evidences.delete(id)
  await touchReport(await reportIdOfService(ev.serviceId))
}
