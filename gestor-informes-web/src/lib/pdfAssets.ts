/** Utilidades compartidas por los generadores de PDF (informe y acta de entrega). */

export interface LoadedImage {
  data: Uint8Array
  width: number
  height: number
}

export async function loadUrl(url: string): Promise<LoadedImage> {
  const blob = await (await fetch(url)).blob()
  const bitmap = await createImageBitmap(blob)
  const image = { data: new Uint8Array(await blob.arrayBuffer()), width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return image
}

/** Tamaño que conserva la proporción de la imagen dentro de un recuadro. */
export function fit(width: number, height: number, maxW: number, maxH: number) {
  const scale = Math.min(maxW / width, maxH / height)
  return { w: width * scale, h: height * scale }
}
