import { useEffect, useState } from 'react'

/** Crea una URL temporal para un Blob y la libera cuando cambia o se desmonta el componente. */
export function useObjectUrl(blob: Blob | undefined | null): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    // La URL es un recurso externo (registro de blobs del navegador) que hay que liberar,
    // por eso se crea en el efecto y no durante el render.
    const next = blob ? URL.createObjectURL(blob) : undefined
    // oxlint-disable-next-line react/set-state-in-effect
    setUrl(next)
    if (!next) return
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url
}
