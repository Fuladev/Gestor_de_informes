import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Sesión actual de Supabase Auth. `undefined` mientras se consulta, `null` si no hay sesión.
 * `recovery` indica que el usuario llegó desde el enlace de "olvidé mi contraseña".
 */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return { session, recovery, endRecovery: () => setRecovery(false) }
}
