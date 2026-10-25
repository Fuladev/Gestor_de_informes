import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink, Navigate, Route, Routes } from 'react-router-dom'
import logo from './assets/logo.png'
import ReportsPage from './pages/ReportsPage'
import ReportEditorPage from './pages/ReportEditorPage'

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" color="inherit" sx={{ borderBottom: 1, borderColor: 'divider' }} elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'inherit', textDecoration: 'none' }}>
            <Box component="img" src={logo} alt="Fula Constructor" sx={{ height: 36 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Gestor de informes
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        <Routes>
          <Route path="/" element={<ReportsPage />} />
          <Route path="/informes/nuevo" element={<ReportEditorPage />} />
          <Route path="/informes/:id" element={<ReportEditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Box>
  )
}
