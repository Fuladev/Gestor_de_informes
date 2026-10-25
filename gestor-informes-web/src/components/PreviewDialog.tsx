import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { getFullReport } from '../db'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { useNotify } from '../hooks/useNotify'
import { pdfFileName } from '../lib/format'
import { reviewReport, type Issue } from '../lib/validation'
import type { FullReport } from '../types'
import { EvidenceThumb } from './EvidenceThumb'

/** Se monta solo mientras está abierto, así cada apertura arranca con el estado inicial. */
interface PreviewDialogProps {
  reportId: number
  initialTab?: 'review' | 'pdf'
  onClose: () => void
}

interface PreviewState {
  full: FullReport
  issues: Issue[]
  pdf: Blob
}

export function PreviewDialog({ reportId, initialTab = 'pdf', onClose }: PreviewDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const notify = useNotify()
  const [tab, setTab] = useState(initialTab)
  const [state, setState] = useState<PreviewState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const pdfUrl = useObjectUrl(state?.pdf)

  const load = useCallback(async () => {
    try {
      const full = await getFullReport(reportId)
      if (!full) throw new Error('El informe ya no existe')
      // El generador de PDF (jsPDF) se carga bajo demanda para aligerar la carga inicial.
      const { reportPdfBlob } = await import('../lib/pdf')
      const [issues, pdf] = await Promise.all([reviewReport(full), reportPdfBlob(full)])
      setState({ full, issues, pdf })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    // Carga de datos asíncrona: el estado se actualiza después del await, no durante el efecto.
    // oxlint-disable-next-line react/set-state-in-effect
    load()
  }, [load])

  const refresh = () => {
    setLoading(true)
    setError(undefined)
    load()
  }

  const errors = state?.issues.filter((i) => i.level === 'error') ?? []
  const warnings = state?.issues.filter((i) => i.level === 'warning') ?? []
  const flagged = new Map(state?.issues.filter((i) => i.evidenceId !== undefined).map((i) => [i.evidenceId!, i.level]))

  const download = () => {
    if (!state || !pdfUrl) return
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = pdfFileName(state.full.report.ordenObra, state.full.report.responsableNombre)
    a.click()
    notify('PDF descargado')
  }

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap>
            Previsualización {state ? `· Orden ${state.full.report.ordenObra}` : ''}
          </Typography>
        </Box>
        <IconButton aria-label="Actualizar" onClick={refresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
        <IconButton aria-label="Cerrar" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="pdf" label="PDF" />
        <Tab
          value="review"
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <span>Revisión de evidencias</span>
              {state && errors.length > 0 && <Chip size="small" color="error" label={errors.length} />}
              {state && errors.length === 0 && warnings.length > 0 && <Chip size="small" color="warning" label={warnings.length} />}
            </Stack>
          }
        />
      </Tabs>
      <DialogContent sx={{ p: 0, minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
        {loading && (
          <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 4 }}>
            <Stack spacing={2} sx={{ alignItems: 'center' }}>
              <CircularProgress />
              <Typography color="text.secondary">Generando informe…</Typography>
            </Stack>
          </Box>
        )}
        {!loading && error && (
          <Alert severity="error" sx={{ m: 3 }}>
            {error}
          </Alert>
        )}
        {!loading && state && tab === 'pdf' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {errors.length > 0 && (
              <Alert severity="error" sx={{ borderRadius: 0 }} action={<Button color="inherit" size="small" onClick={() => setTab('review')}>Ver detalles</Button>}>
                Se encontraron {errors.length} problema(s) en el informe.
              </Alert>
            )}
            <Box component="iframe" title="Vista previa del PDF" src={pdfUrl} sx={{ flex: 1, border: 0, minHeight: '70vh', width: '100%' }} />
            <Box sx={{ p: 1, textAlign: 'center', display: { md: 'none' } }}>
              <Button size="small" startIcon={<OpenInNewIcon />} href={pdfUrl ?? ''} target="_blank" rel="noopener">
                Si no ve el PDF, ábralo en una pestaña nueva
              </Button>
            </Box>
          </Box>
        )}
        {!loading && state && tab === 'review' && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {state.issues.length === 0 ? (
              <Alert icon={<CheckCircleOutlineIcon />} severity="success">
                Todo en orden: todos los servicios tienen evidencias válidas.
              </Alert>
            ) : (
              <List dense disablePadding sx={{ mb: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                {[...errors, ...warnings].map((issue, i) => (
                  <ListItem key={i} divider={i < state.issues.length - 1}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {issue.level === 'error' ? <ErrorOutlineIcon color="error" /> : <WarningAmberIcon color="warning" />}
                    </ListItemIcon>
                    <ListItemText primary={issue.message} />
                  </ListItem>
                ))}
              </List>
            )}
            {state.full.services.map((service) => (
              <Box key={service.id} sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {service.posicion}. {service.nombre}{' '}
                  <Typography component="span" color="text.secondary" variant="body2">
                    ({service.evidences.length} evidencia{service.evidences.length === 1 ? '' : 's'})
                  </Typography>
                </Typography>
                {service.evidences.length === 0 ? (
                  <Typography color="error" variant="body2">
                    Sin evidencias
                  </Typography>
                ) : (
                  <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                    {service.evidences.map((ev, i) => (
                      <EvidenceThumb key={ev.id} blob={ev.blob} nombre={ev.nombre} index={i + 1} highlight={flagged.get(ev.id!)} />
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={download} disabled={!state || loading}>
          {errors.length > 0 ? 'Descargar de todas formas' : 'Descargar PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
