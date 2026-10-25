import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { getReport, listEvidences, listReports, listServices, signedUrls } from '../api'
import type { Evidence } from '../types'
import { useNotify } from './useNotify'

export const useReports = () => useQuery({ queryKey: ['informes'], queryFn: listReports })

export const useReport = (id: number | undefined) =>
  useQuery({ queryKey: ['informe', id], queryFn: () => getReport(id!), enabled: id !== undefined })

export const useServices = (reportId: number) =>
  useQuery({ queryKey: ['servicios', reportId], queryFn: () => listServices(reportId) })

export interface EvidenceWithUrl extends Evidence {
  url?: string
}

/** Evidencias de un servicio, ordenadas por nombre, con URL firmada para mostrar la miniatura. */
export const useEvidences = (serviceId: number) =>
  useQuery({
    queryKey: ['evidencias', serviceId],
    queryFn: async (): Promise<EvidenceWithUrl[]> => {
      const evidences = await listEvidences(serviceId)
      const urls = await signedUrls(evidences.map((e) => e.storagePath))
      return evidences.map((e) => ({ ...e, url: urls.get(e.storagePath) }))
    },
    // Las URLs firmadas duran 1 hora: se renuevan antes de que venzan.
    staleTime: 30 * 60 * 1000,
    refetchInterval: 45 * 60 * 1000,
  })

/**
 * Ejecuta una operación sobre la base de datos, muestra el resultado y refresca los datos en pantalla.
 * Devuelve `true` si la operación terminó bien.
 */
export function useAction() {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useCallback(
    async (operation: () => Promise<unknown>, successMessage?: string): Promise<boolean> => {
      try {
        await operation()
        if (successMessage) notify(successMessage)
        return true
      } catch (e) {
        notify(e instanceof Error ? e.message : String(e), 'error')
        return false
      } finally {
        await queryClient.invalidateQueries()
      }
    },
    [queryClient, notify],
  )
}
