import { createTheme } from '@mui/material/styles'

// Color tomado del logo de Fula Constructor.
export const theme = createTheme({
  palette: {
    primary: { main: '#8e194a' },
    secondary: { main: '#424242' },
    background: { default: '#f5f4f6' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: 'none' } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { outlined: { borderColor: '#e2dfe4' } } },
  },
})
