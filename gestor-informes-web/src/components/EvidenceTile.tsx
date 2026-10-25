import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import { Box, Dialog, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { deleteEvidence, renameEvidence, replaceEvidence } from '../api'
import { useAction, type EvidenceWithUrl } from '../hooks/queries'
import { processImage } from '../lib/images'
import { ConfirmDialog, TextPromptDialog } from './Dialogs'
import { EvidenceThumb } from './EvidenceThumb'

interface EvidenceTileProps {
  evidence: EvidenceWithUrl
  reportId: number
  index: number
}

export function EvidenceTile({ evidence, reportId, index }: EvidenceTileProps) {
  const run = useAction()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [dialog, setDialog] = useState<'view' | 'rename' | 'delete' | null>(null)
  const replaceInput = useRef<HTMLInputElement>(null)

  const close = () => setAnchor(null)

  const onReplace = async (file: File | undefined) => {
    if (!file) return
    await run(
      async () => replaceEvidence(evidence, reportId, await processImage(file)),
      `Evidencia "${evidence.nombre}" reemplazada`,
    )
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <EvidenceThumb src={evidence.url} nombre={evidence.nombre} index={index} onClick={() => setDialog('view')} />
      <IconButton
        size="small"
        aria-label={`Opciones de ${evidence.nombre}`}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,.9)', '&:hover': { bgcolor: '#fff' } }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <input
        ref={replaceInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onReplace(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      <Menu anchorEl={anchor} open={!!anchor} onClose={close}>
        <MenuItem onClick={() => (close(), setDialog('view'))}>
          <ListItemIcon>
            <ZoomInIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => (close(), setDialog('rename'))}>
          <ListItemIcon>
            <DriveFileRenameOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Renombrar</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => (close(), replaceInput.current?.click())}>
          <ListItemIcon>
            <SwapHorizIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reemplazar imagen</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => (close(), setDialog('delete'))} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={dialog === 'view'} onClose={() => setDialog(null)} maxWidth="lg">
        {evidence.url && <Box component="img" src={evidence.url} alt={evidence.nombre} sx={{ maxWidth: '100%', maxHeight: '80vh', display: 'block' }} />}
        <Typography sx={{ p: 1.5 }} variant="body2">
          <strong>{evidence.nombre}</strong> · {evidence.width}×{evidence.height}px · archivo original: {evidence.originalName}
        </Typography>
      </Dialog>

      <TextPromptDialog
        open={dialog === 'rename'}
        title="Renombrar evidencia"
        label="Nombre"
        initialValue={evidence.nombre}
        helperText="Las evidencias se ordenan por nombre (img1, img1 2, img2, img10…)"
        onSubmit={(nombre) => run(() => renameEvidence(evidence, nombre), 'Evidencia renombrada')}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        title="Eliminar evidencia"
        message={`¿Eliminar la evidencia "${evidence.nombre}"?`}
        onConfirm={() => run(() => deleteEvidence(evidence), 'Evidencia eliminada')}
        onClose={() => setDialog(null)}
      />
    </Box>
  )
}
