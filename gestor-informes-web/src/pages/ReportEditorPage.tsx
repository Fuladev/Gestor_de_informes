import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Alert, Box, Button, Chip, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createReport, deleteReport, updateReport } from '../api'
import { useAction, useReport } from '../hooks/queries'
import { actaNumber } from '../lib/format'
import { ConfirmDialog } from '../components/Dialogs'
import { ReportForm } from '../components/ReportForm'
import { EMPTY_REPORT } from '../lib/emptyReport'
import { ReportActionsMenu } from '../components/ReportActionsMenu'
import { ServicesEditor } from '../components/ServicesEditor'
import { useNotify } from '../hooks/useNotify'
import { useReportPdf } from '../hooks/useReportPdf'
import type { Report, ReportData } from '../types'

function toData(report: Report): ReportData {
  const data = { ...EMPTY_REPORT }
  for (const key of Object.keys(EMPTY_REPORT) as (keyof ReportData)[]) {
    ;(data as Record<string, string>)[key] = (report[key] as string) ?? EMPTY_REPORT[key]
  }
  return data
}

export default function ReportEditorPage() {
  const params = useParams()
  const navigate = useNavigate()
  const notify = useNotify()
  const run = useAction()
  const queryClient = useQueryClient()
  const id = params.id ? Number(params.id) : undefined
  const { data: report, error } = useReport(id)
  const initial = useMemo(() => (report ? toData(report) : EMPTY_REPORT), [report])
  const pdf = useReportPdf()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (error) return <Alert severity="error">No se pudo cargar el informe: {error.message}</Alert>
  if (id !== undefined && report === undefined) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (id !== undefined && report === null) {
    return <Alert severity="warning">El informe no existe o fue eliminado.</Alert>
  }

  const save = async (data: ReportData) => {
    try {
      if (id === undefined) {
        const created = await createReport(data)
        notify(`Informe creado con el acta N° ${actaNumber(created.actaNumero)}. Ahora agregue los servicios y sus evidencias.`)
        navigate(`/informes/${created.id}`, { replace: true })
      } else {
        await updateReport(id, data)
        notify('Cambios guardados')
      }
    } catch (e) {
      notify(`No se pudo guardar: ${e instanceof Error ? e.message : e}`, 'error')
    } finally {
      await queryClient.invalidateQueries()
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/')} aria-label="Volver">
          <ArrowBackIcon />
        </IconButton>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flex: 1, minWidth: 200, flexWrap: 'wrap' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {id === undefined ? 'Nuevo informe' : `Informe · Orden ${report?.ordenObra}`}
          </Typography>
          {report && <Chip color="primary" variant="outlined" label={`Acta N° ${actaNumber(report.actaNumero)}`} />}
        </Stack>
        {id !== undefined && (
          <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => pdf.openPreview(id)}>
              Previsualizar
            </Button>
            <Button
              variant="contained"
              startIcon={pdf.busyId === id ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfOutlinedIcon />}
              onClick={() => pdf.download(id, 'informe')}
              disabled={pdf.busyId === id}
            >
              Informe PDF
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AssignmentTurnedInOutlinedIcon />}
              onClick={() => pdf.download(id, 'acta')}
              disabled={pdf.busyId === id}
            >
              Acta de entrega
            </Button>
            <ReportActionsMenu
              onPreview={() => pdf.openPreview(id)}
              onDownload={(kind) => pdf.download(id, kind)}
              onDelete={() => setConfirmDelete(true)}
            />
          </Stack>
        )}
      </Stack>

      {/* Se compara por contenido: el informe se re-emite cada vez que cambian sus evidencias
          y no queremos descartar lo que el usuario está escribiendo. */}
      <ReportForm
        key={JSON.stringify(initial)}
        initial={initial}
        submitLabel={id === undefined ? 'Crear informe' : 'Guardar cambios'} onSubmit={save} />

      {id !== undefined ? (
        <ServicesEditor reportId={id} />
      ) : (
        <Alert severity="info">Guarde los datos de la obra para poder agregar servicios y subir evidencias.</Alert>
      )}

      {pdf.dialog}
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar informe"
        message="Se eliminará el informe con todos sus servicios y evidencias. Esta acción no se puede deshacer."
        onConfirm={async () => {
          if (await run(() => deleteReport(id!), 'Informe eliminado')) navigate('/', { replace: true })
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </Stack>
  )
}
