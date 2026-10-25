import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import { Box, Dialog, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { deleteEvidence, renameEvidence, replaceEvidence } from '../db'
import { useNotify } from '../hooks/useNotify'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { processImage } from '../lib/images'
import type { Evidence } from '../types'
import { ConfirmDialog, TextPromptDialog } from './Dialogs'
import { EvidenceThumb } from './EvidenceThumb'

export function EvidenceTile({ evidence, index }: { evidence: Evidence; index: number }) {
  const notify = useNotify()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [dialog, setDialog] = useState<'view' | 'rename' | 'delete' | null>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const largeUrl = useObjectUrl(dialog === 'view' ? evidence.blob : null)
  const id = evidence.id!

  const close = () => setAnchor(null)

  const onReplace = async (file: File | undefined) => {
    if (!file) return
    try {
      await replaceEvidence(id, await processImage(file))
      notify(`Evidencia "${evidence.nombre}" reemplazada`)
    } catch (e) {
      notify(e instanceof Error ? e.message : String(e), 'error')
    }
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <EvidenceThumb blob={evidence.blob} nombre={evidence.nombre} index={index} onClick={() => setDialog('view')} />
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
        {largeUrl && <Box component="img" src={largeUrl} alt={evidence.nombre} sx={{ maxWidth: '100%', maxHeight: '80vh', display: 'block' }} />}
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
        onSubmit={async (nombre) => {
          await renameEvidence(id, nombre)
          notify('Evidencia renombrada')
        }}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        title="Eliminar evidencia"
        message={`¿Eliminar la evidencia "${evidence.nombre}"?`}
        onConfirm={async () => {
          await deleteEvidence(id)
          notify('Evidencia eliminada')
        }}
        onClose={() => setDialog(null)}
      />
    </Box>
  )
}
