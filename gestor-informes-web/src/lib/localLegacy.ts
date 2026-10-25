import Dexie, { type EntityTable } from 'dexie'
import { addEvidence, createReport, createService } from '../api'
import type { ReportData } from '../types'

/*
 * Versión anterior de la app: guardaba los informes solo en el navegador (IndexedDB).
 * Este módulo únicamente lee esos datos para subirlos a Supabase y luego los borra.
 */

interface LocalReport extends ReportData {
  id: number
  createdAt: number
}

interface LocalService {
  id: number
  reportId: number
  nombre: string
  posicion: number
}

interface LocalEvidence {
  id: number
  serviceId: number
  nombre: string
  blob: Blob
  width: number
  height: number
  originalName: string
  createdAt: number
}

const db = new Dexie('gestor-informes') as Dexie & {
  reports: EntityTable<LocalReport, 'id'>
  services: EntityTable<LocalService, 'id'>
  evidences: EntityTable<LocalEvidence, 'id'>
}

db.version(1).stores({
  reports: '++id, ordenObra, updatedAt',
  services: '++id, reportId, posicion',
  evidences: '++id, serviceId, nombre',
})

export async function countLocalReports(): Promise<number> {
  try {
    return await db.reports.count()
  } catch {
    return 0
  }
}

/**
 * Sube a Supabase los informes guardados en este navegador, del más antiguo al más reciente
 * (así reciben el consecutivo de acta en ese orden). Cada informe se borra localmente apenas se sube.
 */
export async function importLocalReports(onProgress: (done: number, total: number) => void): Promise<number> {
  const reports = await db.reports.orderBy('id').toArray()
  let done = 0
  onProgress(done, reports.length)
  for (const local of reports) {
    const report = await createReport({
      ordenObra: local.ordenObra,
      actividades: local.actividades,
      justificacion: local.justificacion ?? '',
      ubicacion: local.ubicacion,
      responsableNombre: local.responsableNombre,
      responsableTelefono: local.responsableTelefono,
      responsableCargo: local.responsableCargo ?? '',
      fechaInicio: local.fechaInicio,
      fechaFin: local.fechaFin,
      tipoValidacion: local.tipoValidacion ?? 'visita',
    })
    const services = await db.services.where('reportId').equals(local.id).sortBy('posicion')
    for (const localService of services) {
      const service = await createService(report.id, localService.nombre)
      const evidences = await db.evidences.where('serviceId').equals(localService.id).sortBy('createdAt')
      for (const ev of evidences) {
        await addEvidence(service, ev)
      }
    }
    await db.transaction('rw', db.reports, db.services, db.evidences, async () => {
      const serviceIds = services.map((s) => s.id)
      await db.evidences.where('serviceId').anyOf(serviceIds).delete()
      await db.services.bulkDelete(serviceIds)
      await db.reports.delete(local.id)
    })
    onProgress(++done, reports.length)
  }
  return done
}
