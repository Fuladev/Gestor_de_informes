import type { FullReport, ReportData } from '../types'
import { isDecodable } from './images'

export type FieldErrors = Partial<Record<keyof ReportData, string>>

export function validateReportData(data: ReportData): FieldErrors {
  const errors: FieldErrors = {}
  const required: [keyof ReportData, string][] = [
    ['ordenObra', 'La orden de obra es obligatoria'],
    ['actividades', 'Las actividades son obligatorias'],
    ['ubicacion', 'La ubicación es obligatoria'],
    ['responsableNombre', 'El nombre del responsable es obligatorio'],
    ['responsableTelefono', 'El número del responsable es obligatorio'],
    ['fechaInicio', 'La fecha de inicio es obligatoria'],
    ['fechaFin', 'La fecha de finalización es obligatoria'],
  ]
  for (const [field, message] of required) {
    if (!String(data[field]).trim()) errors[field] = message
  }
  if (data.responsableTelefono.trim() && !/^[\d\s+()-]{7,}$/.test(data.responsableTelefono.trim())) {
    errors.responsableTelefono = 'Número no válido'
  }
  if (data.fechaInicio && data.fechaFin && data.fechaFin < data.fechaInicio) {
    errors.fechaFin = 'La fecha de finalización no puede ser anterior a la de inicio'
  }
  return errors
}

export type IssueLevel = 'error' | 'warning'

export interface Issue {
  level: IssueLevel
  message: string
  /** Evidencia afectada, para resaltarla en la previsualización. */
  evidenceId?: number
}

/** Pixeles mínimos del lado menor para considerar que una foto se verá bien en el PDF. */
const MIN_SIDE = 300

/** Revisión previa a la descarga: detecta datos faltantes y evidencias mal cargadas. */
export async function reviewReport({ report, services }: FullReport): Promise<Issue[]> {
  const issues: Issue[] = Object.values(validateReportData(report)).map((message) => ({
    level: 'error' as const,
    message,
  }))

  if (services.length === 0) {
    issues.push({ level: 'error', message: 'El informe no tiene servicios con evidencias' })
  }

  for (const service of services) {
    const label = `${service.posicion}. ${service.nombre}`
    if (!service.nombre.trim()) issues.push({ level: 'error', message: `El servicio ${service.posicion} no tiene nombre` })
    if (service.evidences.length === 0) {
      issues.push({ level: 'error', message: `"${label}" no tiene evidencias cargadas` })
    }
    const seen = new Map<string, number>()
    for (const ev of service.evidences) {
      const key = ev.nombre.trim().toLowerCase()
      seen.set(key, (seen.get(key) ?? 0) + 1)
      if (!ev.nombre.trim()) {
        issues.push({ level: 'warning', message: `"${label}": hay una evidencia sin nombre`, evidenceId: ev.id })
      }
      if (!ev.blob || !(await isDecodable(ev.blob))) {
        issues.push({ level: 'error', message: `"${label}": la evidencia "${ev.nombre}" está dañada, vuelva a subirla`, evidenceId: ev.id })
      } else if (Math.min(ev.width, ev.height) < MIN_SIDE) {
        issues.push({
          level: 'warning',
          message: `"${label}": la evidencia "${ev.nombre}" tiene baja resolución (${ev.width}×${ev.height})`,
          evidenceId: ev.id,
        })
      }
    }
    for (const [name, count] of seen) {
      if (count > 1 && name) {
        issues.push({ level: 'warning', message: `"${label}": el nombre "${name}" está repetido ${count} veces` })
      }
    }
  }
  return issues
}
