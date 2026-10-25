import { useState } from 'react'
import { getFullReport, getReport, listServices } from '../api'
import { reviewReport, validateReportData } from '../lib/validation'
import { PreviewDialog, type PreviewTab } from '../components/PreviewDialog'
import { useNotify } from './useNotify'

export type DocumentKind = 'informe' | 'acta'

/**
 * Acciones de PDF compartidas por el listado y el editor.
 * Si el documento tiene errores, en lugar de descargar abre la revisión para corregirlos.
 */
export function useReportPdf() {
  const notify = useNotify()
  const [preview, setPreview] = useState<{ id: number; tab: PreviewTab } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const openPreview = (id: number, tab: PreviewTab = 'pdf') => setPreview({ id, tab })

  const downloadInforme = async (id: number) => {
    const full = await getFullReport(id)
    if (!full) throw new Error('El informe no existe')
    const errors = (await reviewReport(full)).filter((i) => i.level === 'error')
    if (errors.length > 0) {
      notify(`El informe tiene ${errors.length} problema(s). Revíselos antes de descargar.`, 'warning')
      setPreview({ id, tab: 'review' })
      return
    }
    const { downloadReportPdf } = await import('../lib/pdf')
    await downloadReportPdf(full)
    notify('Informe descargado')
  }

  const downloadActa = async (id: number) => {
    // El acta no lleva fotos: basta con los datos del informe y los nombres de los servicios.
    const [report, services] = await Promise.all([getReport(id), listServices(id)])
    if (!report) throw new Error('El informe no existe')
    const errors = Object.values(validateReportData(report))
    if (errors.length > 0) {
      notify(`Complete los datos del informe antes de generar el acta:\n${errors.join('\n')}`, 'warning')
      return
    }
    const { downloadActaPdf } = await import('../lib/acta')
    await downloadActaPdf(report, services)
    notify('Acta de entrega descargada')
  }

  const download = async (id: number, kind: DocumentKind = 'informe') => {
    setBusyId(id)
    try {
      await (kind === 'acta' ? downloadActa(id) : downloadInforme(id))
    } catch (e) {
      notify(`No se pudo generar el PDF: ${e instanceof Error ? e.message : e}`, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const dialog = preview && (
    <PreviewDialog key={`${preview.id}-${preview.tab}`} reportId={preview.id} initialTab={preview.tab} onClose={() => setPreview(null)} />
  )

  return { openPreview, download, busyId, dialog }
}
