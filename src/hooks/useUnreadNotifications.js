import { useQuery } from '@tanstack/react-query'
import { countUnread } from '../services/notificationService'
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
      const { count: total, error } = await countUnread(userId)
      if (error) {
        logger.errorWithContext('Error al obtener notificaciones no leídas', error)
        return 0
      }
      return total
    },
    enabled: !!userId,
    refetchInterval: 30000,
  })

  return { count, isLoading }
}
