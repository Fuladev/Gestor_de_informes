import { createContext, useContext } from 'react'
import type { AlertColor } from '@mui/material'

export type Notify = (message: string, severity?: AlertColor) => void

export const NotifyContext = createContext<Notify>(() => {})

export function useNotify(): Notify {
  return useContext(NotifyContext)
}
