import { Box, Typography } from '@mui/material'
import { useObjectUrl } from '../hooks/useObjectUrl'

interface EvidenceThumbProps {
  src: string | undefined
  nombre: string
  index: number
  highlight?: 'error' | 'warning'
  onClick?: () => void
}

export function EvidenceThumb({ src, nombre, index, highlight, onClick }: EvidenceThumbProps) {
  const borderColor = highlight === 'error' ? 'error.main' : highlight === 'warning' ? 'warning.main' : 'divider'
  return (
    <Box
      onClick={onClick}
      sx={{
        border: 2,
        borderColor,
        borderRadius: 1.5,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '3 / 4', bgcolor: 'grey.100' }}>
        {src && (
          <Box
            component="img"
            src={src}
            alt={nombre}
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            left: 6,
            px: 0.75,
            borderRadius: 1,
            bgcolor: 'rgba(0,0,0,.65)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {index}
        </Box>
      </Box>
      <Typography variant="caption" component="div" noWrap title={nombre} sx={{ px: 1, py: 0.5 }}>
        {nombre || '(sin nombre)'}
      </Typography>
    </Box>
  )
}

/** Miniatura a partir de una imagen ya descargada (previsualización del informe). */
export function BlobEvidenceThumb({ blob, ...props }: Omit<EvidenceThumbProps, 'src'> & { blob: Blob | null }) {
  return <EvidenceThumb src={useObjectUrl(blob)} {...props} />
}
