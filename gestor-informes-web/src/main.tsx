import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { NotifyProvider } from './components/NotifyProvider'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotifyProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </NotifyProvider>
    </ThemeProvider>
  </StrictMode>,
)
