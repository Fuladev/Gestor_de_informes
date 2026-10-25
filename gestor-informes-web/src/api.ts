import { EVIDENCE_BUCKET, supabase } from './lib/supabase'
import { sortEvidences } from './lib/sort'
import type { ProcessedImage } from './lib/images'
import type { Evidence, EvidenceWithBlob, FullReport, Report, ReportData, Service } from './types'

// La fecha de modificación de cada informe la actualizan triggers de la base de datos
// cuando cambian sus servicios o evidencias.

// ---------- Mapeo filas (snake_case) <-> modelos (camelCase) ----------

interface InformeRow {
  id: number
  acta_numero: number
  orden_obra: string
  actividades: string
  justificacion: string
  ubicacion: string
  responsable_nombre: string
  responsable_telefono: string
  responsable_cargo: string
  fecha_inicio: string
  fecha_fin: string
  tipo_validacion: Report['tipoValidacion']
  created_at: string
  updated_at: string
}

interface ServicioRow {
  id: number
  informe_id: number
  nombre: string
  posicion: number
  created_at: string
}

interface EvidenciaRow {
  id: number
  servicio_id: number
  nombre: string
  storage_path: string
  width: number
  height: number
  original_name: string
  created_at: string
}

const toReport = (r: InformeRow): Report => ({
  id: r.id,
  actaNumero: r.acta_numero,
  ordenObra: r.orden_obra,
  actividades: r.actividades,
  justificacion: r.justificacion,
  ubicacion: r.ubicacion,
  responsableNombre: r.responsable_nombre,
  responsableTelefono: r.responsable_telefono,
  responsableCargo: r.responsable_cargo,
  fechaInicio: r.fecha_inicio,
  fechaFin: r.fecha_fin,
  tipoValidacion: r.tipo_validacion,
  createdAt: Date.parse(r.created_at),
  updatedAt: Date.parse(r.updated_at),
})

const fromReportData = (d: ReportData) => ({
  orden_obra: d.ordenObra.trim(),
  actividades: d.actividades.trim(),
  justificacion: d.justificacion.trim(),
  ubicacion: d.ubicacion.trim(),
  responsable_nombre: d.responsableNombre.trim(),
  responsable_telefono: d.responsableTelefono.trim(),
  responsable_cargo: d.responsableCargo.trim(),
  fecha_inicio: d.fechaInicio,
  fecha_fin: d.fechaFin,
  tipo_validacion: d.tipoValidacion,
})

const toService = (r: ServicioRow): Service => ({
  id: r.id,
  reportId: r.informe_id,
  nombre: r.nombre,
  posicion: r.posicion,
  createdAt: Date.parse(r.created_at),
})

const toEvidence = (r: EvidenciaRow): Evidence => ({
  id: r.id,
  serviceId: r.servicio_id,
  nombre: r.nombre,
  storagePath: r.storage_path,
  width: r.width,
  height: r.height,
  originalName: r.original_name,
  createdAt: Date.parse(r.created_at),
})

/** Lanza el error de Supabase como Error normal para que la interfaz lo muestre. */
function check<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message)
  return data
}

async function removeFiles(paths: string[]) {
  if (paths.length === 0) return
  check(await supabase.storage.from(EVIDENCE_BUCKET).remove(paths))
}

async function uploadImage(reportId: number, serviceId: number, image: ProcessedImage): Promise<string> {
  const path = `${reportId}/${serviceId}/${crypto.randomUUID()}.jpg`
  check(
    await supabase.storage.from(EVIDENCE_BUCKET).upload(path, image.blob, { contentType: 'image/jpeg', upsert: false }),
  )
  return path
}

// ---------- Informes ----------

export interface ReportSummary {
  report: Report
  services: number
  evidences: number
}

export async function listReports(): Promise<ReportSummary[]> {
  const [informes, servicios, evidencias] = await Promise.all([
    supabase.from('informes').select('*').order('updated_at', { ascending: false }),
    supabase.from('servicios').select('id, informe_id'),
    supabase.from('evidencias').select('servicio_id'),
  ])
  const reports = ((check(informes) ?? []) as InformeRow[]).map(toReport)
  const services = check(servicios) as Pick<ServicioRow, 'id' | 'informe_id'>[]
  const perService = new Map<number, number>()
  for (const e of check(evidencias) as Pick<EvidenciaRow, 'servicio_id'>[]) {
    perService.set(e.servicio_id, (perService.get(e.servicio_id) ?? 0) + 1)
  }
  return reports.map((report) => {
    const own = services.filter((s) => s.informe_id === report.id)
    return { report, services: own.length, evidences: own.reduce((sum, s) => sum + (perService.get(s.id) ?? 0), 0) }
  })
}

export async function getReport(id: number): Promise<Report | null> {
  const row = check(await supabase.from('informes').select('*').eq('id', id).maybeSingle())
  return row ? toReport(row as InformeRow) : null
}

export async function createReport(data: ReportData): Promise<Report> {
  const row = check(await supabase.from('informes').insert(fromReportData(data)).select('*').single())
  return toReport(row as InformeRow)
}

export async function updateReport(id: number, data: ReportData): Promise<void> {
  check(await supabase.from('informes').update(fromReportData(data)).eq('id', id).select('id'))
}

async function evidencePathsOfServices(serviceIds: number[]): Promise<string[]> {
  if (serviceIds.length === 0) return []
  const rows = check(await supabase.from('evidencias').select('storage_path').in('servicio_id', serviceIds))
  return (rows as Pick<EvidenciaRow, 'storage_path'>[]).map((r) => r.storage_path)
}

export async function deleteReport(id: number): Promise<void> {
  const services = check(await supabase.from('servicios').select('id').eq('informe_id', id)) as { id: number }[]
  const paths = await evidencePathsOfServices(services.map((s) => s.id))
  await removeFiles(paths)
  // Servicios y evidencias se borran en cascada.
  check(await supabase.from('informes').delete().eq('id', id))
}

// ---------- Servicios ----------

export async function listServices(reportId: number): Promise<Service[]> {
  const rows = check(await supabase.from('servicios').select('*').eq('informe_id', reportId).order('posicion'))
  return (rows as ServicioRow[]).map(toService)
}

export async function createService(reportId: number, nombre: string): Promise<Service> {
  const existing = await listServices(reportId)
  const posicion = existing.length ? existing[existing.length - 1].posicion + 1 : 1
  const row = check(
    await supabase.from('servicios').insert({ informe_id: reportId, nombre: nombre.trim(), posicion }).select('*').single(),
  )
  return toService(row as ServicioRow)
}

export async function renameService(service: Service, nombre: string): Promise<void> {
  check(await supabase.from('servicios').update({ nombre: nombre.trim() }).eq('id', service.id).select('id'))
}

async function renumber(services: Service[]) {
  await Promise.all(
    services.map((s, i) =>
      s.posicion === i + 1
        ? null
        : supabase.from('servicios').update({ posicion: i + 1 }).eq('id', s.id).select('id').then(check),
    ),
  )
}

export async function deleteService(service: Service): Promise<void> {
  await removeFiles(await evidencePathsOfServices([service.id]))
  check(await supabase.from('servicios').delete().eq('id', service.id))
  // Renumerar para que no queden huecos (1, 2, 3...).
  await renumber(await listServices(service.reportId))
}

export async function moveService(service: Service, direction: -1 | 1): Promise<void> {
  const list = await listServices(service.reportId)
  const index = list.findIndex((s) => s.id === service.id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= list.length) return
  ;[list[index], list[target]] = [list[target], list[index]]
  await renumber(list)
}

// ---------- Evidencias ----------

export async function listEvidences(serviceId: number): Promise<Evidence[]> {
  const rows = check(await supabase.from('evidencias').select('*').eq('servicio_id', serviceId))
  return sortEvidences((rows as EvidenciaRow[]).map(toEvidence))
}

/** URLs firmadas (válidas 1 hora) para mostrar las miniaturas del bucket privado. */
export async function signedUrls(paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>()
  if (paths.length === 0) return urls
  const data = check(await supabase.storage.from(EVIDENCE_BUCKET).createSignedUrls(paths, 3600))
  for (const item of data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl)
  return urls
}

export async function downloadEvidence(path: string): Promise<Blob | null> {
  const { data, error } = await supabase.storage.from(EVIDENCE_BUCKET).download(path)
  return error ? null : data
}

export async function addEvidence(service: Service, image: ProcessedImage): Promise<void> {
  const path = await uploadImage(service.reportId, service.id, image)
  const { error } = await supabase.from('evidencias').insert({
    servicio_id: service.id,
    nombre: image.nombre,
    storage_path: path,
    width: image.width,
    height: image.height,
    original_name: image.originalName,
  })
  if (error) {
    await removeFiles([path]).catch(() => {})
    throw new Error(error.message)
  }
}

export async function renameEvidence(evidence: Evidence, nombre: string): Promise<void> {
  check(await supabase.from('evidencias').update({ nombre: nombre.trim() }).eq('id', evidence.id).select('id'))
}

export async function replaceEvidence(evidence: Evidence, reportId: number, image: ProcessedImage): Promise<void> {
  const path = await uploadImage(reportId, evidence.serviceId, image)
  const { error } = await supabase
    .from('evidencias')
    .update({ storage_path: path, width: image.width, height: image.height, original_name: image.originalName })
    .eq('id', evidence.id)
  if (error) {
    await removeFiles([path]).catch(() => {})
    throw new Error(error.message)
  }
  await removeFiles([evidence.storagePath]).catch(() => {})
}

export async function deleteEvidence(evidence: Evidence): Promise<void> {
  check(await supabase.from('evidencias').delete().eq('id', evidence.id))
  await removeFiles([evidence.storagePath]).catch(() => {})
}

// ---------- Informe completo (para PDF y revisión) ----------

export async function getFullReport(id: number): Promise<FullReport | null> {
  const report = await getReport(id)
  if (!report) return null
  const services = await listServices(id)
  const withEvidences = await Promise.all(
    services.map(async (s) => {
      const evidences = await listEvidences(s.id)
      const withBlobs: EvidenceWithBlob[] = await Promise.all(
        evidences.map(async (ev) => ({ ...ev, blob: await downloadEvidence(ev.storagePath) })),
      )
      return { ...s, evidences: withBlobs }
    }),
  )
  return { report, services: withEvidences }
}
