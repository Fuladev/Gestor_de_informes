const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' })

/** Orden natural: img1, img1 2, img2, img10 (y no img1, img10, img2). */
export function compareNatural(a: string, b: string): number {
  return collator.compare(a.trim(), b.trim())
}

export function sortEvidences<T extends { nombre: string; createdAt: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => compareNatural(a.nombre, b.nombre) || a.createdAt - b.createdAt)
}
