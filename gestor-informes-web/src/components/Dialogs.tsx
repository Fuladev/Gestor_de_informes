import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material'
import { useState } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface TextPromptDialogProps {
  open: boolean
  title: string
  label: string
  initialValue?: string
  helperText?: string
  confirmLabel?: string
  onSubmit: (value: string) => void
  onClose: () => void
}

export function TextPromptDialog({ open, onClose, ...props }: TextPromptDialogProps) {
  // El formulario se monta en cada apertura, así arranca siempre con el valor inicial.
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <PromptForm {...props} onClose={onClose} />
    </Dialog>
  )
}

function PromptForm({
  title,
  label,
  initialValue = '',
  helperText,
  confirmLabel = 'Guardar',
  onSubmit,
  onClose,
}: Omit<TextPromptDialogProps, 'open'>) {
  const [value, setValue] = useState(initialValue)
  const valid = value.trim().length > 0

  return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          onSubmit(value.trim())
          onClose()
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={label}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            helperText={helperText}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={!valid}>
            {confirmLabel}
          </Button>
        </DialogActions>
      </form>
  )
}
