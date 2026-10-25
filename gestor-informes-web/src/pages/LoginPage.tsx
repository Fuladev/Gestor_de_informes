import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import logo from '../assets/logo.png'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'signup' | 'reset'

/** Adonde vuelve el usuario desde los correos de confirmación y de cambio de contraseña. */
const redirectTo = () => window.location.origin + window.location.pathname

function friendlyError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Correo o contraseña incorrectos.'
  if (/email not confirmed/i.test(message)) return 'Debe confirmar su correo: revise la bandeja de entrada (y spam).'
  if (/database error saving new user|no está autorizado/i.test(message)) {
    return 'Este correo no está autorizado para usar el gestor. Pida al administrador que lo agregue.'
  }
  if (/already registered/i.test(message)) return 'Ese correo ya tiene cuenta. Ingrese con su contraseña.'
  if (/rate limit|too many/i.test(message)) return 'Demasiados intentos. Espere unos minutos y vuelva a intentarlo.'
  if (/password/i.test(message) && /6/.test(message)) return 'La contraseña debe tener al menos 6 caracteres.'
  return message
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [info, setInfo] = useState<string>()

  const switchTo = (next: Mode) => {
    setMode(next)
    setError(undefined)
    setInfo(undefined)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(undefined)
    setInfo(undefined)
    if (mode === 'signup' && password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setBusy(true)
    try {
      const address = email.trim().toLowerCase()
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: address, password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: redirectTo() },
        })
        if (error) throw error
        if (!data.session) {
          setMode('login')
          setInfo('Cuenta creada. Le enviamos un correo para confirmarla; ábralo y luego ingrese con su contraseña.')
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(address, { redirectTo: redirectTo() })
        if (error) throw error
        setInfo('Si el correo tiene cuenta, recibirá un enlace para crear una nueva contraseña.')
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  const titles: Record<Mode, string> = {
    login: 'Ingresar',
    signup: 'Crear cuenta',
    reset: 'Recuperar contraseña',
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: 'background.default' }}>
      <Paper variant="outlined" component="form" onSubmit={submit} sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 420 }}>
        <Stack spacing={2.5}>
          <Box sx={{ textAlign: 'center' }}>
            <Box component="img" src={logo} alt="Fula Constructor" sx={{ height: 64, mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Gestor de informes
            </Typography>
            <Typography color="text.secondary">{titles[mode]}</Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {info && <Alert severity="success">{info}</Alert>}

          <TextField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode !== 'reset' && (
            <TextField
              label="Contraseña"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText={mode === 'signup' ? 'Mínimo 6 caracteres' : undefined}
            />
          )}
          {mode === 'signup' && (
            <TextField
              label="Repita la contraseña"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}

          <Button type="submit" variant="contained" size="large" disabled={busy}>
            {mode === 'login' ? 'Ingresar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar enlace'}
          </Button>

          <Stack spacing={0.5} sx={{ textAlign: 'center' }}>
            {mode !== 'login' && (
              <Link component="button" type="button" onClick={() => switchTo('login')}>
                Ya tengo cuenta: ingresar
              </Link>
            )}
            {mode !== 'signup' && (
              <Link component="button" type="button" onClick={() => switchTo('signup')}>
                Primera vez: crear mi cuenta
              </Link>
            )}
            {mode === 'login' && (
              <Link component="button" type="button" onClick={() => switchTo('reset')}>
                Olvidé mi contraseña
              </Link>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Solo pueden crear cuenta los correos autorizados por la empresa.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}
