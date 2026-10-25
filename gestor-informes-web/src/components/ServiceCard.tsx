import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, Button, Chip, IconButton, LinearProgress, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { addEvidence, deleteService, moveService, renameService } from '../api'
import { useAction, useEvidences } from '../hooks/queries'
import { useNotify } from '../hooks/useNotify'
import { processImage } from '../lib/images'
import type { Service } from '../types'
import { ConfirmDialog, TextPromptDialog } from './Dialogs'
import { EvidenceTile } from './EvidenceTile'

interface ServiceCardProps {
  service: Service
  isFirst: boolean
  isLast: boolean
}

export function ServiceCard({ service, isFirst, isLast }: ServiceCardProps) {
  const notify = useNotify()
  const run = useAction()
  const queryClient = useQueryClient()
  const { data: evidences } = useEvidences(service.id)
  const input = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<'rename' | 'delete' | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const upload = async (files: File[]) => {
    if (files.length === 0) return
    setProgress({ done: 0, total: files.length })
    let ok = 0
    const failed: string[] = []
    for (const file of files) {
      try {
        await addEvidence(service, await processImage(file))
        ok++
      } catch (e) {
        failed.push(e instanceof Error ? e.message : String(e))
      }
      setProgress((p) => p && { ...p, done: p.done + 1 })
    }
    setProgress(null)
    await queryClient.invalidateQueries()
    if (failed.length) {
      notify(`Se cargaron ${ok} de ${files.length} imágenes.\n${failed.join('\n')}`, 'error')
    } else {
      notify(`${ok} evidencia(s) cargada(s) en "${service.nombre}"`)
    }
  }

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ alignItems: 'center', flexWrap: 'wrap', px: 2, py: 1.25, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography sx={{ fontWeight: 700, flex: { xs: '1 1 100%', sm: 1 }, minWidth: 0, overflowWrap: 'anywhere' }}>
          {service.posicion}. {service.nombre}
        </Typography>
        <Chip
          size="small"
          label={`${evidences?.length ?? 0} evidencia${evidences?.length === 1 ? '' : 's'}`}
          color={evidences && evidences.length === 0 ? 'error' : 'default'}
          variant="outlined"
        />
        <Tooltip title="Subir">
          <span>
            <IconButton size="small" disabled={isFirst} onClick={() => run(() => moveService(service, -1))} aria-label="Mover arriba">
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Bajar">
          <span>
            <IconButton size="small" disabled={isLast} onClick={() => run(() => moveService(service, 1))} aria-label="Mover abajo">
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Renombrar servicio">
          <IconButton size="small" onClick={() => setDialog('rename')} aria-label="Renombrar servicio">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar servicio">
          <IconButton size="small" color="error" onClick={() => setDialog('delete')} aria-label="Eliminar servicio">
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      {progress && <LinearProgress variant="determinate" value={(progress.done / progress.total) * 100} />}

      <Box
        sx={{ p: 2, outline: dragOver ? '2px dashed' : 'none', outlineColor: 'primary.main', outlineOffset: -6 }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          upload(Array.from(e.dataTransfer.files))
        }}
      >
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
          {evidences?.map((ev, i) => <EvidenceTile key={ev.id} evidence={ev} reportId={service.reportId} index={i + 1} />)}
          <Button
            variant="outlined"
            onClick={() => input.current?.click()}
            disabled={!!progress}
            sx={{ minHeight: 160, flexDirection: 'column', gap: 1, borderStyle: 'dashed' }}
          >
            <AddPhotoAlternateOutlinedIcon fontSize="large" />
            {progress ? `Subiendo ${progress.done}/${progress.total}…` : 'Subir evidencias'}
            <Typography variant="caption" color="text.secondary">
              o arrástrelas aquí
            </Typography>
          </Button>
        </Box>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            upload(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </Box>

      <TextPromptDialog
        open={dialog === 'rename'}
        title="Renombrar servicio"
        label="Nombre del servicio"
        initialValue={service.nombre}
        onSubmit={(nombre) => run(() => renameService(service, nombre), 'Servicio actualizado')}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        title="Eliminar servicio"
        message={`¿Eliminar "${service.nombre}" y sus ${evidences?.length ?? 0} evidencia(s)? Esta acción no se puede deshacer.`}
        onConfirm={() => run(() => deleteService(service), 'Servicio eliminado')}
        onClose={() => setDialog(null)}
      />
    </Paper>
  )
}
