import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'
import { useNotifications } from './useNotifications'

const BACKOFF_INITIAL_MS = 10_000
const BACKOFF_MAX_MS = 120_000
const BACKOFF_MULTIPLIER = 2

/**
 * Hook para escuchar notificaciones en tiempo real usando Supabase Realtime.
 * Incluye un fallback de polling con backoff exponencial (10s → 20s → 40s → máx 120s)
 * que se reinicia cuando llega una actualización o cuando la pestaña recupera el foco.
 *
 * @param {string} userId - ID del usuario actual
 */
export function useRealtimeNotifications(userId) {
  const queryClient = useQueryClient()
  const { showSuccess, showInfo } = useNotifications()

  const backoffMs = useRef(BACKOFF_INITIAL_MS)
  const fallbackTimerId = useRef(null)

  // Invalida todas las queries relacionadas con notificaciones/cirugías
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    queryClient.invalidateQueries({ queryKey: ['cirugias-hoy'] })
    queryClient.invalidateQueries({ queryKey: ['cirugias-calendario'] })
    queryClient.invalidateQueries({ queryKey: ['solicitudes-pendientes'] })
  }, [queryClient])

  // Reinicia el backoff a su valor inicial y reprograma el timer
  const resetBackoff = useCallback(() => {
    backoffMs.current = BACKOFF_INITIAL_MS
    clearTimeout(fallbackTimerId.current)
    scheduleFallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scheduleFallback = useCallback(() => {
    clearTimeout(fallbackTimerId.current)
    fallbackTimerId.current = setTimeout(() => {
      // Sólo consulta si la pestaña es visible
      if (document.visibilityState === 'visible') {
        invalidateAll()
      }
      // Avanza al siguiente nivel de backoff (máximo BACKOFF_MAX_MS)
      backoffMs.current = Math.min(backoffMs.current * BACKOFF_MULTIPLIER, BACKOFF_MAX_MS)
      scheduleFallback()
    }, backoffMs.current)
  }, [invalidateAll])

  useEffect(() => {
    if (!userId) return

    // ── Supabase Realtime ───────────────────────────────────────────────────

    const notificationsChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.debug('Nueva notificación recibida:', payload.new)
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
          showInfo(`Nueva notificación: ${payload.new.titulo}`)
          resetBackoff()
        }
      )
      .subscribe()

    const requestsChannel = supabase
      .channel(`surgery_requests:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'surgery_requests',
        },
        (payload) => {
          logger.debug('Cambio en solicitud:', payload.new)
          queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
          queryClient.invalidateQueries({ queryKey: ['solicitudes-doctor'] })
          queryClient.invalidateQueries({ queryKey: ['solicitudes-pendientes'] })
          resetBackoff()

          if (payload.new.estado === 'aceptada' && payload.old.estado === 'pendiente') {
            showSuccess('Tu solicitud ha sido aceptada')
          } else if (payload.new.estado === 'rechazada' && payload.old.estado === 'pendiente') {
            showInfo('Tu solicitud ha sido rechazada')
          }
        }
      )
      .subscribe()

    const surgeriesChannel = supabase
      .channel(`surgeries:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'surgeries',
        },
        (payload) => {
          logger.debug('Cambio en cirugía:', payload)
          queryClient.invalidateQueries({ queryKey: ['cirugias-hoy'] })
          queryClient.invalidateQueries({ queryKey: ['cirugias-calendario'] })
          queryClient.invalidateQueries({ queryKey: ['calendario-anual-cirugias'] })
          queryClient.invalidateQueries({ queryKey: ['calendario-doctor-cirugias'] })
          queryClient.invalidateQueries({ queryKey: ['cirugias-dia-detalle'] })
          queryClient.invalidateQueries({ queryKey: ['cirugias-fecha'] })
          resetBackoff()

          if (
            payload.eventType === 'UPDATE' &&
            payload.new.estado === 'cancelada' &&
            payload.old.estado === 'programada'
          ) {
            showInfo('Una cirugía ha sido cancelada')
          }
        }
      )
      .subscribe()

    // ── Fallback polling con backoff exponencial ────────────────────────────

    backoffMs.current = BACKOFF_INITIAL_MS
    scheduleFallback()

    // ── Window focus: reinicia backoff e invalida inmediatamente ───────────

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        invalidateAll()
        resetBackoff()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      supabase.removeChannel(notificationsChannel)
      supabase.removeChannel(requestsChannel)
      supabase.removeChannel(surgeriesChannel)
      clearTimeout(fallbackTimerId.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId, queryClient, showSuccess, showInfo, invalidateAll, resetBackoff, scheduleFallback])
}
