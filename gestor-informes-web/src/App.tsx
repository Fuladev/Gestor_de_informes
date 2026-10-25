import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import { Alert, AppBar, Box, Button, CircularProgress, Container, IconButton, Toolbar, Tooltip, Typography } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink, Navigate, Route, Routes } from 'react-router-dom'
import logo from './assets/logo.png'
import { TextPromptDialog } from './components/Dialogs'
import { useNotify } from './hooks/useNotify'
import { useRealtimeSync } from './hooks/useRealtimeSync'
import { useSession } from './hooks/useSession'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import ReportEditorPage from './pages/ReportEditorPage'
import ReportsPage from './pages/ReportsPage'

export default function App() {
  const { session, recovery, endRecovery } = useSession()
  const notify = useNotify()
  const queryClient = useQueryClient()
  const email = session?.user.email ?? ''
  // Una cuenta puede existir y haber sido retirada de la lista de miembros: en ese caso no ve datos.
  const membership = useQuery({
    queryKey: ['miembro', email],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from('miembros').select('email').eq('email', email.toLowerCase())
      if (error) throw new Error(error.message)
      return data.length > 0
    },
  })
  useRealtimeSync(!!session && membership.data === true)

  const logout = async () => {
    await supabase.auth.signOut()
    queryClient.clear()
  }

  if (session === undefined) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }
  if (!session) return <LoginPage />

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" color="inherit" sx={{ borderBottom: 1, borderColor: 'divider' }} elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'inherit', textDecoration: 'none', flex: 1, minWidth: 0 }}
          >
            <Box component="img" src={logo} alt="Fula Constructor" sx={{ height: 36 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
              Gestor de informes
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
            {email}
          </Typography>
          <Tooltip title="Cerrar sesión">
            <IconButton onClick={logout} aria-label="Cerrar sesión">
              <LogoutOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        {membership.data === false ? (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" onClick={logout}>
                Salir
              </Button>
            }
          >
            La cuenta {email} no está autorizada para ver los informes. Pida al administrador que la agregue.
          </Alert>
        ) : membership.error ? (
          <Alert severity="error">No se pudo conectar con el servidor: {membership.error.message}</Alert>
        ) : membership.data === undefined ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Routes>
            <Route path="/" element={<ReportsPage />} />
            <Route path="/informes/nuevo" element={<ReportEditorPage />} />
            <Route path="/informes/:id" element={<ReportEditorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Container>

      <TextPromptDialog
        open={recovery}
        title="Nueva contraseña"
        label="Escriba su nueva contraseña"
        helperText="Mínimo 6 caracteres"
        onSubmit={async (password) => {
          const { error } = await supabase.auth.updateUser({ password })
          notify(error ? `No se pudo cambiar la contraseña: ${error.message}` : 'Contraseña actualizada', error ? 'error' : 'success')
        }}
        onClose={endRecovery}
      />
    </Box>
  )
}
