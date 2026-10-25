import AddIcon from '@mui/icons-material/Add'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteReport } from '../api'
import { LocalImportBanner } from '../components/LocalImportBanner'
import { useAction, useReports } from '../hooks/queries'
import { ConfirmDialog } from '../components/Dialogs'
import { ReportActionsMenu } from '../components/ReportActionsMenu'
import { useReportPdf } from '../hooks/useReportPdf'
import { actaNumber, formatDate } from '../lib/format'
import type { Report } from '../types'

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary', minWidth: 0 }}>
      {icon}
      <Typography variant="body2" noWrap>
        {children}
      </Typography>
    </Stack>
  )
}

export default function ReportsPage() {
  const navigate = useNavigate()
  const run = useAction()
  const { data: rows, error } = useReports()
  const pdf = useReportPdf()
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState<Report | null>(null)

  const term = search.trim().toLowerCase()
  const filtered = rows?.filter(({ report: r }) =>
    [r.ordenObra, r.ubicacion, r.responsableNombre, r.actividades, actaNumber(r.actaNumero)].some((v) =>
      v.toLowerCase().includes(term),
    ),
  )

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, alignItems: { sm: 'center' } }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Informes de visita técnica
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Cree, edite, previsualice y descargue los informes en PDF.
          </Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => navigate('/informes/nuevo')}>
          Nuevo informe
        </Button>
      </Stack>

      <LocalImportBanner />

      {error && <Alert severity="error">No se pudieron cargar los informes: {error.message}</Alert>}

      {rows && rows.length > 0 && (
        <TextField
          placeholder="Buscar por orden de obra, N° de acta, ubicación, responsable o actividad"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
          sx={{ bgcolor: 'background.paper' }}
        />
      )}

      {!rows && !error && (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {rows?.length === 0 && (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Todavía no hay informes
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Registre la orden de obra, el responsable y luego cargue las evidencias de cada servicio.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/informes/nuevo')}>
            Crear el primer informe
          </Button>
        </Paper>
      )}

      {filtered && filtered.length === 0 && rows!.length > 0 && (
        <Typography color="text.secondary">No hay informes que coincidan con “{search}”.</Typography>
      )}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' } }}>
        {filtered?.map(({ report: r, services, evidences }) => (
          <Card key={r.id} variant="outlined" sx={{ position: 'relative' }}>
            <CardActionArea onClick={() => navigate(`/informes/${r.id}`)} sx={{ p: 2, pr: 6, height: '100%', alignItems: 'flex-start' }}>
              <Typography variant="overline" color="text.secondary">
                Orden de obra · Acta N° {actaNumber(r.actaNumero)}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 1 }} noWrap>
                {r.ordenObra}
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                <Meta icon={<PlaceOutlinedIcon fontSize="small" />}>{r.ubicacion}</Meta>
                <Meta icon={<PersonOutlineIcon fontSize="small" />}>
                  {r.responsableNombre} · {r.responsableTelefono}
                </Meta>
                <Meta icon={<CalendarMonthOutlinedIcon fontSize="small" />}>
                  {formatDate(r.fechaInicio)} – {formatDate(r.fechaFin)}
                </Meta>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Chip size="small" label={`${services} servicio${services === 1 ? '' : 's'}`} />
                <Chip
                  size="small"
                  label={`${evidences} evidencia${evidences === 1 ? '' : 's'}`}
                  color={evidences === 0 ? 'warning' : 'default'}
                />
              </Stack>
            </CardActionArea>
            <Box sx={{ position: 'absolute', top: 8, right: 4 }}>
              {pdf.busyId === r.id ? (
                <CircularProgress size={24} sx={{ m: 1 }} />
              ) : (
                <ReportActionsMenu
                  onEdit={() => navigate(`/informes/${r.id}`)}
                  onPreview={() => pdf.openPreview(r.id)}
                  onDownload={(kind) => pdf.download(r.id, kind)}
                  onDelete={() => setToDelete(r)}
                />
              )}
            </Box>
          </Card>
        ))}
      </Box>

      {pdf.dialog}
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar informe"
        message={`¿Eliminar el informe de la orden ${toDelete?.ordenObra} con todos sus servicios y evidencias?`}
        onConfirm={() => run(() => deleteReport(toDelete!.id), 'Informe eliminado')}
        onClose={() => setToDelete(null)}
      />
    </Stack>
  )
}
