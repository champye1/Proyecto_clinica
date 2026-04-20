import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'

/**
 * Hook para obtener la lista de notificaciones del usuario y marcarlas como leídas.
 */
export function useNotificationsList(userId, options = {}) {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('id, tipo, titulo, mensaje, vista, created_at, relacionado_con')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) {
        logger.errorWithContext('Error al obtener notificaciones', error)
        return []
      }
      return data || []
    },
    enabled: !!userId && (options.enabled !== false),
  })

  const markAsRead = useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .update({ vista: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count', userId] })
    },
  })

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ vista: true })
        .eq('user_id', userId)
        .eq('vista', false)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count', userId] })
    },
  })

  return { notifications, isLoading, markAsRead, markAllAsRead }
}
