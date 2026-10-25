import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import { Alert, AlertTitle, Button, LinearProgress } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNotify } from '../hooks/useNotify'
import { countLocalReports, importLocalReports } from '../lib/localLegacy'

/** Ofrece subir a la nube los informes que quedaron guardados en este navegador con la versión anterior. */
export function LocalImportBanner() {
  const notify = useNotify()
  const queryClient = useQueryClient()
  const { data: count, refetch } = useQuery({ queryKey: ['locales'], queryFn: countLocalReports, staleTime: Infinity })
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  if (!count) return null

  const start = async () => {
    try {
      const done = await importLocalReports((d, total) => setProgress({ done: d, total }))
      notify(`${done} informe(s) subido(s) a la nube`)
    } catch (e) {
      notify(`La importación se detuvo: ${e instanceof Error ? e.message : e}. Puede reintentarla.`, 'error')
    } finally {
      setProgress(null)
      await refetch()
      await queryClient.invalidateQueries()
    }
  }

  return (
    <Alert
      severity="info"
      icon={<CloudUploadOutlinedIcon />}
      action={
        <Button color="inherit" onClick={start} disabled={!!progress}>
          {progress ? `Subiendo ${progress.done}/${progress.total}…` : 'Subir a la nube'}
        </Button>
      }
    >
      <AlertTitle>Hay {count} informe(s) guardado(s) solo en este dispositivo</AlertTitle>
      Se crearon con la versión anterior de la app. Súbalos para verlos desde cualquier dispositivo; se les asignará
      un número de acta.
      {progress && <LinearProgress variant="determinate" value={(progress.done / progress.total) * 100} sx={{ mt: 1 }} />}
    </Alert>
  )
}
