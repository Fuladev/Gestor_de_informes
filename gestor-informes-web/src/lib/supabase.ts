import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !key) {
  throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY (ver .env)')
}

/** Cliente único de Supabase. La clave publicable es pública por diseño: la seguridad la dan RLS y el login. */
// PKCE: los enlaces de los correos vuelven con ?code=..., compatible con la navegación por # de la app.
export const supabase = createClient(url, key, { auth: { flowType: 'pkce' } })

export const EVIDENCE_BUCKET = 'evidencias'
