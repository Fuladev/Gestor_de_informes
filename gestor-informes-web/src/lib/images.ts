export interface ProcessedImage {
  nombre: string
  originalName: string
  blob: Blob
  width: number
  height: number
}

/** Lado máximo de la imagen guardada; suficiente para el PDF y mantiene liviana la base de datos. */
const MAX_SIDE = 1600
const JPEG_QUALITY = 0.85

export function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(0, dot) : fileName
}

async function decode(source: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try {
    // Respeta la orientación EXIF de las fotos de celular.
    return await createImageBitmap(source, { imageOrientation: 'from-image' })
  } catch {
    const url = URL.createObjectURL(source)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return img
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

/**
 * Decodifica la imagen, la reduce si es muy grande y la normaliza a JPEG.
 * Lanza un error con un mensaje legible si el archivo no es una imagen válida.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)) {
    throw new Error(`"${file.name}" no es una imagen`)
  }
  let image: ImageBitmap | HTMLImageElement
  try {
    image = await decode(file)
  } catch {
    throw new Error(`"${file.name}" está dañada o tiene un formato no soportado por el navegador (p. ej. HEIC)`)
  }
  const srcW = image.width
  const srcH = image.height
  if (!srcW || !srcH) throw new Error(`"${file.name}" no tiene dimensiones válidas`)

  const scale = Math.min(1, MAX_SIDE / Math.max(srcW, srcH))
  const width = Math.round(srcW * scale)
  const height = Math.round(srcH * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  // Fondo blanco para PNG con transparencia (JPEG no tiene canal alfa).
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)
  if ('close' in image) image.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  if (!blob) throw new Error(`No se pudo procesar "${file.name}"`)
  return { nombre: baseName(file.name), originalName: file.name, blob, width: srcW, height: srcH }
}

/** Comprueba que una evidencia guardada se puede seguir decodificando. */
export async function isDecodable(blob: Blob): Promise<boolean> {
  try {
    const img = await decode(blob)
    if ('close' in img) img.close()
    return true
  } catch {
    return false
  }
}
