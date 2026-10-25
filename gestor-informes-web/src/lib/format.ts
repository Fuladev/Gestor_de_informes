/** yyyy-mm-dd -> dd/mm/yyyy (formato del informe). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

export function todayFormatted(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`
}

export function pdfFileName(ordenObra: string, responsable: string): string {
  const clean = (s: string) => s.trim().replace(/[\\/:*?"<>|]+/g, '-')
  return `informe_${clean(ordenObra) || 'sin-orden'}_${clean(responsable) || 'sin-responsable'}.pdf`
}
