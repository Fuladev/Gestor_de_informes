import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

/** Refresca los datos en pantalla cuando otro dispositivo crea, edita o borra informes, servicios o evidencias. */
export function useRealtimeSync(enabled: boolean) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!enabled) return
    let timer: ReturnType<typeof setTimeout> | undefined
    // Una carga de 20 fotos genera 20 eventos: se agrupan en un solo refresco.
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => queryClient.invalidateQueries(), 400)
    }
    const channel = supabase.channel('cambios-informes')
    for (const table of ['informes', 'servicios', 'evidencias']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, refresh)
    }
    channel.subscribe()
    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [enabled, queryClient])
}
