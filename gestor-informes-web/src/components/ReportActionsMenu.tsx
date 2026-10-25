import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'
import { useState } from 'react'
import type { DocumentKind } from '../hooks/useReportPdf'

interface ReportActionsMenuProps {
  onEdit?: () => void
  onPreview: () => void
  onDownload: (kind: DocumentKind) => void
  onDelete: () => void
  disabled?: boolean
}

export function ReportActionsMenu({ onEdit, onPreview, onDownload, onDelete, disabled }: ReportActionsMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const run = (action: () => void) => () => {
    setAnchor(null)
    action()
  }

  return (
    <>
      <IconButton
        aria-label="Acciones del informe"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          setAnchor(e.currentTarget)
        }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} onClick={(e) => e.stopPropagation()}>
        {onEdit && (
          <MenuItem onClick={run(onEdit)}>
            <ListItemIcon>
              <EditOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={run(onPreview)}>
          <ListItemIcon>
            <VisibilityOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Previsualizar</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(() => onDownload('informe'))}>
          <ListItemIcon>
            <PictureAsPdfOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Descargar informe PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(() => onDownload('acta'))}>
          <ListItemIcon>
            <AssignmentTurnedInOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Descargar acta de entrega</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={run(onDelete)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
