import { jsPDF } from 'jspdf'
import logoUrl from '../assets/logo.png'
import firmaUrl from '../assets/firma.png'
import { COMPANY, DOCUMENTACION_ENTREGADA } from '../config'
import type { Evidence, FullReport, Report, ServiceWithEvidences } from '../types'
import { formatDate, pdfFileName, todayFormatted } from './format'
import { fit, loadUrl, type LoadedImage } from './pdfAssets'

// Medidas en puntos: A4 con márgenes de 36pt, igual que el Document por defecto de iText.
const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 36
const WIDTH = PAGE_W - MARGIN * 2
const BOTTOM = PAGE_H - MARGIN

const GRAY: [number, number, number] = [192, 192, 192] // BaseColor.LIGHT_GRAY
const TEXT: [number, number, number] = [64, 64, 64] // BaseColor.DARK_GRAY
const PAD = 3
const LINE_FACTOR = 1.15
const SECTION_GAP = 12
/** Alto máximo de una foto en la grilla de evidencias (dos filas de fotos verticales por página). */
const MAX_IMAGE_H = 260
const IMAGE_PAD = 5

type Align = 'left' | 'center' | 'right'

interface TextStyle {
  bold?: boolean
  size?: number
  align?: Align
}

interface CellStyle extends TextStyle {
  fill?: boolean
  border?: boolean
}

class ReportPdfBuilder {
  private doc = new jsPDF({ unit: 'pt', format: 'a4' })
  private y = MARGIN
  private firstPage = true
  private readonly fechaInforme = todayFormatted()
  private readonly report: Report
  private readonly logo: LoadedImage
  private readonly firma: LoadedImage
  private readonly evidenceData: Map<number, Uint8Array>

  constructor(report: Report, logo: LoadedImage, firma: LoadedImage, evidenceData: Map<number, Uint8Array>) {
    this.report = report
    this.logo = logo
    this.firma = firma
    this.evidenceData = evidenceData
    this.doc.setLineWidth(0.5)
    this.doc.setDrawColor(0, 0, 0)
    this.doc.setLineHeightFactor(LINE_FACTOR)
    this.doc.setProperties({ title: `Informe ${report.ordenObra}`, author: COMPANY.nombre })
  }

  // ---------- Primitivas ----------

  private setFont({ bold, size = 10 }: TextStyle) {
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal')
    this.doc.setFontSize(size)
    this.doc.setTextColor(...TEXT)
  }

  private lines(text: string, width: number, style: TextStyle): string[] {
    this.setFont(style)
    return this.doc.splitTextToSize(text || ' ', width - PAD * 2) as string[]
  }

  private textHeight(text: string, width: number, style: TextStyle = {}): number {
    return this.lines(text, width, style).length * (style.size ?? 10) * LINE_FACTOR + PAD * 2
  }

  private cell(x: number, y: number, w: number, h: number, text: string, style: CellStyle = {}) {
    const { fill = false, border = true, align = 'left', size = 10 } = style
    if (fill) {
      this.doc.setFillColor(...GRAY)
      this.doc.rect(x, y, w, h, border ? 'FD' : 'F')
    } else if (border) {
      this.doc.rect(x, y, w, h, 'S')
    }
    if (!text) return
    const lines = this.lines(text, w, style)
    const blockH = lines.length * size * LINE_FACTOR
    const ty = y + (h - blockH) / 2
    const tx = align === 'center' ? x + w / 2 : align === 'right' ? x + w - PAD : x + PAD
    this.doc.text(lines, tx, ty, { align, baseline: 'top' })
  }

  private image(img: Uint8Array, format: 'JPEG' | 'PNG', x: number, y: number, w: number, h: number) {
    this.doc.addImage(img, format, x, y, w, h, undefined, 'FAST')
  }

  private newPage() {
    if (!this.firstPage) this.doc.addPage()
    this.firstPage = false
    this.y = MARGIN
    this.header()
    this.y += SECTION_GAP
  }

  // ---------- Encabezado (se repite en cada página) ----------

  private header() {
    const r = this.report
    const col = WIDTH / 3
    const half = col / 2
    const x0 = MARGIN
    let y = this.y

    // Logo | Título | Fecha / Versión
    const topH = 54
    const sub = topH / 3
    this.cell(x0, y, col, topH, '', { fill: true })
    const logo = fit(this.logo.width, this.logo.height, Math.min(100, col - 8), Math.min(50, topH - 4))
    this.image(this.logo.data, 'PNG', x0 + (col - logo.w) / 2, y + (topH - logo.h) / 2, logo.w, logo.h)
    this.cell(x0 + col, y, col, topH, COMPANY.tituloInforme, { fill: true, bold: true, size: 12, align: 'center' })
    this.cell(x0 + col * 2, y, col, sub, this.fechaInforme, { fill: true, bold: true, align: 'center' })
    this.cell(x0 + col * 2, y + sub, col, sub, 'VERSIÓN', { fill: true, bold: true, align: 'center' })
    this.cell(x0 + col * 2, y + sub * 2, col, sub, COMPANY.version, { fill: true, bold: true, align: 'center' })
    y += topH

    // Orden de obra / Ubicación | valores | Fechas
    const rows: [string, string, boolean, string, string][] = [
      ['ORDEN DE OBRA No', r.ordenObra, true, 'FECHA INICIO:', formatDate(r.fechaInicio)],
      ['UBICACIÓN', r.ubicacion, false, 'FECHA FINAL:', formatDate(r.fechaFin)],
    ]
    for (const [label, value, boldValue, dateLabel, date] of rows) {
      const h = Math.max(
        this.textHeight(label, col, { bold: true }),
        this.textHeight(value, col, { bold: boldValue }),
        this.textHeight(dateLabel, half, { bold: true }),
        this.textHeight(date, half),
      )
      this.cell(x0, y, col, h, label, { fill: true, bold: true })
      this.cell(x0 + col, y, col, h, value, { bold: boldValue, align: 'center' })
      this.cell(x0 + col * 2, y, half, h, dateLabel, { fill: true, bold: true })
      this.cell(x0 + col * 2 + half, y, half, h, date, { align: 'center' })
      y += h
    }

    // Justificación / Actividades (columnas 1:2)
    const labelW = WIDTH / 3
    const valueW = WIDTH - labelW
    const rows2: [string, string, boolean][] = [
      ['JUSTIFICACIÓN DEL TRABAJO', r.justificacion, false],
      ['ACTIVIDADES', r.actividades, true],
    ]
    for (const [label, value, boldValue] of rows2) {
      const h = Math.max(this.textHeight(label, labelW, { bold: true }), this.textHeight(value, valueW, { bold: boldValue }))
      this.cell(x0, y, labelW, h, label, { fill: true, bold: true })
      this.cell(x0 + labelW, y, valueW, h, value, { bold: boldValue, align: 'center' })
      y += h
    }
    this.y = y
  }

  // ---------- Servicios y evidencias ----------

  private serviceTitle(text: string) {
    const h = this.textHeight(text, WIDTH, { bold: true })
    this.cell(MARGIN, this.y, WIDTH, h, text, { fill: true, bold: true, align: 'center' })
    this.y += h
  }

  service(service: ServiceWithEvidences, number: number) {
    this.newPage()
    const title = `${number}. ${service.nombre}`
    this.serviceTitle(title)

    const evidences = service.evidences
    // Misma regla que la versión de escritorio: 4 columnas y una más por cada 10 imágenes.
    const cols = Math.floor(evidences.length / 10) + 4
    const cw = WIDTH / cols
    const rows: Evidence[][] = []
    for (let i = 0; i < evidences.length; i += cols) rows.push(evidences.slice(i, i + cols))
    if (rows.length === 0) rows.push([])

    for (const row of rows) {
      const sizes = row.map((ev) => fit(ev.width, ev.height, cw - IMAGE_PAD * 2, MAX_IMAGE_H))
      const rowH = Math.max(40, ...sizes.map((s) => s.h + IMAGE_PAD * 2))
      if (this.y + rowH > BOTTOM) {
        this.newPage()
        this.serviceTitle(`${title} (continuación)`)
      }
      for (let c = 0; c < cols; c++) {
        const x = MARGIN + c * cw
        this.cell(x, this.y, cw, rowH, '')
        const ev = row[c]
        const data = ev?.id !== undefined ? this.evidenceData.get(ev.id) : undefined
        if (ev && data) {
          const { w, h } = sizes[c]
          this.image(data, 'JPEG', x + (cw - w) / 2, this.y + (rowH - h) / 2, w, h)
        }
      }
      this.y += rowH
    }
  }

  // ---------- Cierre: documentación y validación ----------

  closing() {
    const r = this.report
    this.newPage()
    const row = (text: string, bold = false) => {
      const h = this.textHeight(text, WIDTH, { bold })
      this.cell(MARGIN, this.y, WIDTH, h, text, { bold })
      this.y += h
    }
    row('DE MANERA ADICIONAL A LA ENTREGA:', true)
    row(' ')
    row('DOCUMENTACIÓN ENTREGADA', true)
    DOCUMENTACION_ENTREGADA.forEach((item) => row(item))
    row('VALIDACIÓN DE VISITA', true)

    const paragraphs =
      r.tipoValidacion === 'recibido'
        ? [
            `Recibí a satisfacción los bienes, obras y/o servicios relacionados en la orden de servicio N° ${r.ordenObra} de fecha ${formatDate(r.fechaInicio)}, del proveedor o contratista ${COMPANY.nombre}`,
          ]
        : [
            `Válido la visita correspondiente, del proveedor o contratista ${COMPANY.nombre}, visita que fue bajo mi supervisión, para dar claridad de lo necesitado.`,
          ]
    const lines = [' ', ...paragraphs, ' ', 'Atentamente:', `Nombre: ${r.responsableNombre}`, `Telefono: ${r.responsableTelefono}`]
    if (r.responsableCargo.trim()) lines.push(`Cargo: ${r.responsableCargo}`)
    if (r.tipoValidacion === 'recibido') lines.push(`Fecha de recibido: ${formatDate(r.fechaFin)}`)
    lines.push(' ')

    const half = WIDTH / 2
    const gerente = `${COMPANY.gerente}\n${COMPANY.cargoGerente}`
    const signH = 56
    const namesH = Math.max(this.textHeight(gerente, half), this.textHeight('FIRMA RECIBIDO', half))
    const textH = lines.reduce((sum, l) => sum + this.textHeight(l, WIDTH), 0)
    const total = textH + signH + namesH
    if (this.y + total > BOTTOM) this.newPage()

    this.cell(MARGIN, this.y, WIDTH, total, '')
    let y = this.y
    for (const l of lines) {
      const h = this.textHeight(l, WIDTH)
      this.cell(MARGIN, y, WIDTH, h, l, { border: false })
      y += h
    }
    this.cell(MARGIN, y, half, signH, '')
    this.cell(MARGIN + half, y, half, signH, '')
    const firma = fit(this.firma.width, this.firma.height, 100, 50)
    this.image(this.firma.data, 'PNG', MARGIN + half + (half - firma.w) / 2, y + (signH - firma.h) / 2, firma.w, firma.h)
    y += signH
    this.cell(MARGIN, y, half, namesH, 'FIRMA RECIBIDO', { align: 'center' })
    this.cell(MARGIN + half, y, half, namesH, gerente, { align: 'center' })
    this.y = y + namesH
  }

  build(services: ServiceWithEvidences[]): jsPDF {
    services.forEach((s, i) => this.service(s, i + 1))
    this.closing()
    return this.doc
  }
}

export async function buildReportPdf({ report, services }: FullReport): Promise<jsPDF> {
  const [logo, firma] = await Promise.all([loadUrl(logoUrl), loadUrl(firmaUrl)])
  const evidenceData = new Map<number, Uint8Array>()
  await Promise.all(
    services.flatMap((s) =>
      s.evidences.map(async (ev) => {
        if (ev.blob) evidenceData.set(ev.id, new Uint8Array(await ev.blob.arrayBuffer()))
      }),
    ),
  )
  return new ReportPdfBuilder(report, logo, firma, evidenceData).build(services)
}

export async function downloadReportPdf(full: FullReport): Promise<void> {
  const doc = await buildReportPdf(full)
  doc.save(pdfFileName(full.report.ordenObra, full.report.responsableNombre))
}

export async function reportPdfBlob(full: FullReport): Promise<Blob> {
  const doc = await buildReportPdf(full)
  return doc.output('blob')
}
