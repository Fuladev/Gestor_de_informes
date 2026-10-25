import { useState } from 'react'
import { getFullReport } from '../db'
import { reviewReport } from '../lib/validation'
import { PreviewDialog } from '../components/PreviewDialog'
import { useNotify } from './useNotify'

/**
 * Acciones de PDF compartidas por el listado y el editor.
 * Si el informe tiene errores, en lugar de descargar abre la revisión para corregirlos.
 */
export function useReportPdf() {
  const notify = useNotify()
  const [preview, setPreview] = useState<{ id: number; tab: 'review' | 'pdf' } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const openPreview = (id: number) => setPreview({ id, tab: 'pdf' })

  const download = async (id: number) => {
    setBusyId(id)
    try {
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
      notify('PDF descargado')
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
