import SaveIcon from '@mui/icons-material/Save'
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState, type ChangeEvent } from 'react'
import { validateReportData, type FieldErrors } from '../lib/validation'
import { EMPTY_REPORT } from '../lib/emptyReport'
import type { ReportData } from '../types'

/** El padre debe darle un `key` derivado de `initial` para reiniciar el formulario cuando cambian los datos guardados. */
interface ReportFormProps {
  initial: ReportData
  submitLabel: string
  onSubmit: (data: ReportData) => Promise<void>
}

export function ReportForm({ initial, submitLabel, onSubmit }: ReportFormProps) {
  const [data, setData] = useState<ReportData>(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)


  const dirty = (Object.keys(EMPTY_REPORT) as (keyof ReportData)[]).some((k) => data[k] !== initial[k])

  const field = (name: keyof ReportData) => ({
    name,
    value: data[name],
    error: !!errors[name],
    helperText: errors[name],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setData((d) => ({ ...d, [name]: e.target.value }))
      if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }))
    },
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const found = validateReportData(data)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    try {
      await onSubmit(data)
    } finally {
      setSaving(false)
    }
  }

  const dateSlot = { inputLabel: { shrink: true } }

  return (
    <Paper variant="outlined" component="form" onSubmit={submit} noValidate sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Datos de la obra
      </Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField label="Orden de obra N°" required {...field('ordenObra')} />
        <TextField label="Ubicación de la obra" required {...field('ubicacion')} />
        <TextField label="Fecha de inicio" type="date" required slotProps={dateSlot} {...field('fechaInicio')} />
        <TextField label="Fecha de finalización" type="date" required slotProps={dateSlot} {...field('fechaFin')} />
        <TextField label="Actividades" required multiline minRows={2} sx={{ gridColumn: '1 / -1' }} {...field('actividades')} />
        <TextField
          label="Justificación del trabajo"
          multiline
          minRows={2}
          sx={{ gridColumn: '1 / -1' }}
          placeholder="Ej.: Según cotización #134"
          {...field('justificacion')}
          helperText={errors.justificacion ?? 'Opcional. Aparece en el encabezado del PDF.'}
        />
      </Box>

      <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 700 }}>
        Responsable que recibe
      </Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField label="Nombre del responsable" required {...field('responsableNombre')} />
        <TextField
          label="Número del responsable"
          required
          type="tel"
          slotProps={{ htmlInput: { inputMode: 'tel' } }}
          {...field('responsableTelefono')}
        />
        <TextField label="Cargo del responsable" {...field('responsableCargo')} helperText="Opcional" />
        <TextField select label="Texto de validación" {...field('tipoValidacion')} helperText="Párrafo que firma el responsable">
          <MenuItem value="visita">Validación de visita técnica</MenuItem>
          <MenuItem value="recibido">Recibido a satisfacción</MenuItem>
        </TextField>
      </Box>

      <Stack direction="row" sx={{ mt: 3, justifyContent: 'flex-end' }}>
        <Button type="submit" variant="contained" size="large" startIcon={<SaveIcon />} disabled={saving || !dirty}>
          {submitLabel}
        </Button>
      </Stack>
    </Paper>
  )
}
