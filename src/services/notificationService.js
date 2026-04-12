/**
 * Servicio de notificaciones.
 * Centraliza todas las operaciones sobre la tabla notifications.
 */
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { NotificationListSchema } from '../schemas/notification.schema'

/**
 * Obtiene las notificaciones de un usuario (más recientes primero).
 * @param {string} userId
 * @param {number} limit - máximo de notificaciones a retornar
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchNotifications(userId, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.errorWithContext('notificationService.fetchNotifications', error, { userId })
    return { data: [], error }
  }
  const validation = NotificationListSchema.safeParse(data)
  if (!validation.success) {
    logger.errorWithContext('[schema] notificationService.fetchNotifications', validation.error)
  }
  return { data: data ?? [], error: null }
}

/**
 * Cuenta las notificaciones no leídas de un usuario.
 * @param {string} userId
 * @returns {Promise<{count: number, error: object|null}>}
 */
export async function countUnread(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('vista', false)

  if (error) {
    logger.errorWithContext('notificationService.countUnread', error, { userId })
    return { count: 0, error }
  }
  return { count: count ?? 0, error: null }
}

/**
 * Marca una notificación como leída.
 * @param {string} notificationId
 * @returns {Promise<{error: object|null}>}
 */
export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ vista: true })
    .eq('id', notificationId)

  if (error) {
    logger.errorWithContext('notificationService.markAsRead', error, { notificationId })
  }
  return { error }
}

/**
 * Marca todas las notificaciones de un usuario como leídas.
 * @param {string} userId
 * @returns {Promise<{error: object|null}>}
 */
export async function markAllAsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ vista: true })
    .eq('user_id', userId)
    .eq('vista', false)

  if (error) {
    logger.errorWithContext('notificationService.markAllAsRead', error, { userId })
  }
  return { error }
}

/**
 * Inserta una nueva notificación.
 * @param {object} notification - { user_id, title, message, type?, link? }
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createNotification(notification) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
      vista: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    logger.errorWithContext('notificationService.createNotification', error, { notification })
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Obtiene mensajes externos no leídos (tabla external_messages).
 * @returns {Promise<{count: number, error: object|null}>}
 */
export async function countUnreadExternalMessages() {
  const { count, error } = await supabase
    .from('external_messages')
    .select('*', { count: 'exact', head: true })
    .eq('vista', false)
    .is('deleted_at', null)

  if (error) {
    logger.errorWithContext('notificationService.countUnreadExternalMessages', error)
    return { count: 0, error }
  }
  return { count: count ?? 0, error: null }
}
