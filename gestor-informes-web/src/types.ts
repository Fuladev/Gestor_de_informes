export type TipoValidacion = 'visita' | 'recibido'

export interface Report {
  id?: number
  ordenObra: string
  actividades: string
  justificacion: string
  ubicacion: string
  responsableNombre: string
  responsableTelefono: string
  responsableCargo: string
  /** Fechas en formato ISO (yyyy-mm-dd), tal como las entrega <input type="date">. */
  fechaInicio: string
  fechaFin: string
  tipoValidacion: TipoValidacion
  createdAt: number
  updatedAt: number
}

export type ReportData = Omit<Report, 'id' | 'createdAt' | 'updatedAt'>

export interface Service {
  id?: number
  reportId: number
  nombre: string
  /** Posición del servicio dentro del informe (1. , 2. , ...). */
  posicion: number
  createdAt: number
}

export interface Evidence {
  id?: number
  serviceId: number
  /** Nombre con el que se ordena la evidencia (por defecto el nombre del archivo sin extensión). */
  nombre: string
  /** Imagen normalizada a JPEG para que siempre pueda incrustarse en el PDF. */
  blob: Blob
  width: number
  height: number
  originalName: string
  createdAt: number
}

export interface ServiceWithEvidences extends Service {
  evidences: Evidence[]
}

export interface FullReport {
  report: Report
  services: ServiceWithEvidences[]
}
