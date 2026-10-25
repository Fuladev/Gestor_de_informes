import { Alert, Snackbar, type AlertColor } from '@mui/material'
import { useCallback, useState, type ReactNode } from 'react'
import { NotifyContext, type Notify } from '../hooks/useNotify'

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ message: string; severity: AlertColor; key: number } | null>(null)
  const notify = useCallback<Notify>((message, severity = 'success') => {
    setState({ message, severity, key: Date.now() })
  }, [])

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      <Snackbar
        key={state?.key}
        open={!!state}
        autoHideDuration={state?.severity === 'error' ? 8000 : 3500}
        onClose={(_, reason) => reason !== 'clickaway' && setState(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={state?.severity} variant="filled" onClose={() => setState(null)} sx={{ whiteSpace: 'pre-line' }}>
          {state?.message}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  )
}

