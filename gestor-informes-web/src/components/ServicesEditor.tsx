import AddIcon from '@mui/icons-material/Add'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { createService, db } from '../db'
import { useNotify } from '../hooks/useNotify'
import { TextPromptDialog } from './Dialogs'
import { ServiceCard } from './ServiceCard'

export function ServicesEditor({ reportId }: { reportId: number }) {
  const notify = useNotify()
  const services = useLiveQuery(() => db.services.where('reportId').equals(reportId).sortBy('posicion'), [reportId])
  const [adding, setAdding] = useState(false)

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', mb: 2, gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Servicios y evidencias
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cree cada servicio con su nombre y luego suba sus fotos. Las evidencias se ordenan por nombre.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
          Agregar servicio
        </Button>
      </Stack>

      <Stack spacing={2}>
        {services?.map((s, i) => (
          <ServiceCard key={s.id} service={s} isFirst={i === 0} isLast={i === services.length - 1} />
        ))}
        {services?.length === 0 && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Aún no hay servicios. Ejemplo: “Suministro e instalación de lámparas de emergencia”.
            </Typography>
            <Button startIcon={<AddIcon />} onClick={() => setAdding(true)}>
              Agregar el primer servicio
            </Button>
          </Paper>
        )}
      </Stack>

      <TextPromptDialog
        open={adding}
        title="Nuevo servicio"
        label="Nombre del servicio"
        confirmLabel="Crear"
        helperText="Después de crearlo podrá subir sus evidencias"
        onSubmit={async (nombre) => {
          await createService(reportId, nombre)
          notify('Servicio creado')
        }}
        onClose={() => setAdding(false)}
      />
    </Box>
  )
}
