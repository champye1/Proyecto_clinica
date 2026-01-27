import { useQuery } from '@tanstack/react-query'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

/**
 * Hook para obtener el contador de notificaciones no leídas
 * @param {string} userId - ID del usuario actual
 */
export function useUnreadNotifications(userId) {
  const { data: count = 0, isLoading } = useQuery({
    queryKey: ['unread-notifications-count', userId],
    queryFn: async () => {
      if (!userId) return 0

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('vista', false)
        .is('deleted_at', null)

      if (error) {
        logger.errorWithContext('Error al obtener notificaciones no leídas', error)
        return 0
      }

      return count || 0
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  })

  return { count, isLoading }
}
