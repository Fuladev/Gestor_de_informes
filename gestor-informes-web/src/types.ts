export type TipoValidacion = 'visita' | 'recibido'

export interface ReportData {
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
}

export interface Report extends ReportData {
  id: number
  /** Consecutivo del acta de entrega; lo asigna la base de datos al crear el informe. */
  actaNumero: number
  createdAt: number
  updatedAt: number
}

export interface Service {
  id: number
  reportId: number
  nombre: string
  /** Posición del servicio dentro del informe (1. , 2. , ...). */
  posicion: number
  createdAt: number
}

export interface Evidence {
  id: number
  serviceId: number
  /** Nombre con el que se ordena la evidencia (por defecto el nombre del archivo sin extensión). */
  nombre: string
  /** Ruta de la imagen (JPEG) en el bucket "evidencias" de Supabase Storage. */
  storagePath: string
  width: number
  height: number
  originalName: string
  createdAt: number
}

/** Evidencia con la imagen descargada, necesaria para generar el PDF y revisarla. */
export interface EvidenceWithBlob extends Evidence {
  /** `null` si la imagen no se pudo descargar del almacenamiento. */
  blob: Blob | null
}

export interface ServiceWithEvidences extends Service {
  evidences: EvidenceWithBlob[]
}

export interface FullReport {
  report: Report
  services: ServiceWithEvidences[]
}
