import { jsPDF } from 'jspdf'
import logoUrl from '../assets/logo.png'
import firmaUrl from '../assets/firma.png'
import { ACTA } from '../config'
import type { Report, Service } from '../types'
import { actaFileName, actaNumber, formatDate } from './format'
import { fit, loadUrl, type LoadedImage } from './pdfAssets'

// Carta (612 × 792 pt), igual que la plantilla ACTA_DE_ENTREGA.pdf hecha en Word.
const PAGE_W = 612
const LEFT = 53
const RIGHT = 552
const TEXT_W = RIGHT - LEFT
const SIGN_RIGHT_X = 367
const FOOTER_Y = 717
const SIZE = 9
const LINE = 12
const TEXT: [number, number, number] = [0, 0, 0]
const TITLE: [number, number, number] = [64, 64, 64]

interface Segment {
  text: string
  bold?: boolean
}

class ActaPdfBuilder {
  private doc = new jsPDF({ unit: 'pt', format: 'letter' })
  private readonly report: Report
  private readonly items: string[]
  private readonly logo: LoadedImage
  private readonly firma: LoadedImage

  constructor(report: Report, items: string[], logo: LoadedImage, firma: LoadedImage) {
    this.report = report
    this.items = items
    this.logo = logo
    this.firma = firma
    this.doc.setProperties({ title: `Acta de entrega N° ${actaNumber(report.actaNumero)}`, author: ACTA.empresa })
  }

  private font(bold = false, size = SIZE, color = TEXT, family = 'helvetica') {
    this.doc.setFont(family, bold ? 'bold' : 'normal')
    this.doc.setFontSize(size)
    this.doc.setTextColor(...color)
  }

  private text(text: string, x: number, y: number, options: { bold?: boolean; size?: number; align?: 'left' | 'center' } = {}) {
    this.font(options.bold, options.size)
    this.doc.text(text, x, y, { baseline: 'top', align: options.align ?? 'left' })
  }

  /** Párrafo con partes en negrita, ajustado al ancho de la página. Devuelve la `y` al terminar. */
  private richParagraph(segments: Segment[], y: number): number {
    const words = segments.flatMap((s) =>
      s.text.split(/(\s+)/).filter(Boolean).map((w) => ({ text: w, bold: !!s.bold })),
    )
    const width = (w: { text: string; bold: boolean }) => {
      this.font(w.bold)
      return this.doc.getTextWidth(w.text)
    }
    let line: typeof words = []
    let lineW = 0
    const flush = () => {
      while (line.length && !line[line.length - 1].text.trim()) line.pop()
      let x = LEFT
      for (const w of line) {
        this.font(w.bold)
        this.doc.text(w.text, x, y, { baseline: 'top' })
        x += width(w)
      }
      y += LINE
      line = []
      lineW = 0
    }
    for (const w of words) {
      const isSpace = !w.text.trim()
      if (isSpace && line.length === 0) continue
      const ww = width(w)
      if (!isSpace && lineW + ww > TEXT_W && line.length) flush()
      line.push(w)
      lineW += ww
    }
    if (line.length) flush()
    return y
  }

  private header() {
    const logo = fit(this.logo.width, this.logo.height, 92, 56)
    this.doc.addImage(this.logo.data, 'PNG', LEFT - 9, 28, logo.w, logo.h)
    this.font(true, 9.5, TITLE)
    ACTA.titulo.forEach((line, i) => this.doc.text(line, 212, 37 + i * 12.6, { baseline: 'top' }))
  }

  private footer() {
    const cx = PAGE_W / 2
    this.font(false, 10, TEXT, 'times')
    this.doc.text(ACTA.direccion, cx, FOOTER_Y, { baseline: 'top', align: 'center' })
    this.doc.text(ACTA.telefono, cx, FOOTER_Y + 13.5, { baseline: 'top', align: 'center' })
    this.doc.setTextColor(5, 99, 193)
    const y = FOOTER_Y + 27
    const w = this.doc.getTextWidth(ACTA.correo)
    this.doc.textWithLink(ACTA.correo, cx - w / 2, y, { url: `mailto:${ACTA.correo}`, baseline: 'top' })
    this.doc.setDrawColor(5, 99, 193)
    this.doc.setLineWidth(0.5)
    this.doc.line(cx - w / 2, y + 10, cx + w / 2, y + 10)
  }

  private newPage() {
    this.footer()
    this.doc.addPage()
    this.header()
    return 120
  }

  build(): jsPDF {
    const r = this.report
    const numero = actaNumber(r.actaNumero)
    this.header()

    this.text(`${ACTA.ciudad} ${formatDate(r.fechaFin)}`, LEFT, 113)
    this.text(`Inmueble: ${r.ubicacion}`, LEFT, 125)
    this.text(`ACTA N° ${numero}`, PAGE_W / 2, 222, { bold: true, align: 'center' })

    let y = this.richParagraph(
      [
        { text: 'Yo ' },
        { text: ACTA.representante, bold: true },
        { text: `, mayor de edad y vecino de ${ACTA.ciudad}, actuando como representante legal de la empresa ` },
        { text: ACTA.empresa, bold: true },
        { text: ' con ' },
        { text: `Nit. ${ACTA.nit}`, bold: true },
        { text: ', identificado con cédula de ciudadanía ' },
        { text: `N° ${ACTA.cedula}`, bold: true },
        { text: ` de ${ACTA.ciudad}, doy informe acta de entrega ` },
        { text: `N° ${numero}`, bold: true },
        { text: ` del trabajo realizado en la ${r.ubicacion}.` },
      ],
      257,
    )

    y += 62
    this.text(ACTA.tituloTrabajos, LEFT, y, { bold: true, size: 11 })
    y += 38
    this.items.forEach((item, i) => {
      if (y > 640) y = this.newPage()
      const marker = i < 26 ? `${String.fromCharCode(97 + i)}.` : `${i + 1}.`
      this.text(marker, 72, y)
      this.font()
      const lines = this.doc.splitTextToSize(item, RIGHT - 90) as string[]
      this.doc.text(lines, 90, y, { baseline: 'top' })
      y += LINE * lines.length
    })

    y += 37
    y = this.richParagraph(
      [{ text: `El trabajo fue recibido por el señor(a), ${r.responsableNombre}, encargado(a) de ${r.ubicacion}.` }],
      y,
    )

    // Bloque de firmas: si no cabe antes del pie de página pasa a la siguiente.
    y += 60
    if (y + 125 > FOOTER_Y - 10) y = this.newPage()
    this.text('firma quien recibe', LEFT, y, { bold: true })
    this.text('firma quien entrega', SIGN_RIGHT_X + 6, y, { bold: true })
    const lineY = y + 76
    const firma = fit(this.firma.width, this.firma.height, 80, 56)
    this.doc.addImage(this.firma.data, 'PNG', 448 - firma.w / 2, lineY - firma.h + 6, firma.w, firma.h)
    this.doc.setDrawColor(0, 0, 0)
    this.doc.setLineWidth(0.6)
    this.doc.line(LEFT, lineY, 154, lineY)
    this.doc.line(SIGN_RIGHT_X, lineY, 526, lineY)

    const left = [r.responsableNombre.toUpperCase(), 'C.C.', r.responsableCargo]
    const right = [ACTA.representante.toUpperCase(), `C.C. ${ACTA.cedulaFirma}`, ACTA.cargoRepresentante]
    left.forEach((t, i) => t && this.text(t, LEFT, lineY + 5 + i * LINE))
    right.forEach((t, i) => this.text(t, SIGN_RIGHT_X + 6, lineY + 5 + i * LINE))

    this.footer()
    return this.doc
  }
}

/** Trabajos que se listan en el acta: los servicios del informe o, si no hay, sus actividades. */
function actaItems(report: Report, services: Pick<Service, 'nombre'>[]): string[] {
  const names = services.map((s) => s.nombre.trim()).filter(Boolean)
  return names.length ? names : [report.actividades.trim()].filter(Boolean)
}

export async function buildActaPdf(report: Report, services: Pick<Service, 'nombre'>[]): Promise<jsPDF> {
  const [logo, firma] = await Promise.all([loadUrl(logoUrl), loadUrl(firmaUrl)])
  return new ActaPdfBuilder(report, actaItems(report, services), logo, firma).build()
}

export async function actaPdfBlob(report: Report, services: Pick<Service, 'nombre'>[]): Promise<Blob> {
  return (await buildActaPdf(report, services)).output('blob')
}

export async function downloadActaPdf(report: Report, services: Pick<Service, 'nombre'>[]): Promise<void> {
  ;(await buildActaPdf(report, services)).save(actaFileName(report.actaNumero, report.ordenObra))
}
