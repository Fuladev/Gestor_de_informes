import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Alert, Box, Button, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createReport, db, deleteReport, updateReport } from '../db'
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
  const id = params.id ? Number(params.id) : undefined
  const report = useLiveQuery(() => (id ? db.reports.get(id).then((r) => r ?? null) : null), [id])
  const initial = useMemo(() => (report ? toData(report) : EMPTY_REPORT), [report])
  const pdf = useReportPdf()
  const [confirmDelete, setConfirmDelete] = useState(false)

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
    if (id === undefined) {
      const newId = await createReport(data)
      notify('Informe creado. Ahora agregue los servicios y sus evidencias.')
      navigate(`/informes/${newId}`, { replace: true })
    } else {
      await updateReport(id, data)
      notify('Cambios guardados')
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/')} aria-label="Volver">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1, minWidth: 200 }}>
          {id === undefined ? 'Nuevo informe' : `Informe · Orden ${report?.ordenObra}`}
        </Typography>
        {id !== undefined && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => pdf.openPreview(id)}>
              Previsualizar
            </Button>
            <Button
              variant="contained"
              startIcon={pdf.busyId === id ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfOutlinedIcon />}
              onClick={() => pdf.download(id)}
              disabled={pdf.busyId === id}
            >
              Descargar PDF
            </Button>
            <ReportActionsMenu
              onPreview={() => pdf.openPreview(id)}
              onDownload={() => pdf.download(id)}
              onDelete={() => setConfirmDelete(true)}
            />
          </Stack>
        )}
      </Stack>

      {/* Se compara por contenido: el informe se re-emite cada vez que cambian sus evidencias
          y no queremos descartar lo que el usuario está escribiendo. */}
      <ReportForm
        key={JSON.stringify(initial)}
        initial={initial} submitLabel={id === undefined ? 'Crear informe' : 'Guardar cambios'} onSubmit={save} />

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
          await deleteReport(id!)
          notify('Informe eliminado')
          navigate('/', { replace: true })
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </Stack>
  )
}
