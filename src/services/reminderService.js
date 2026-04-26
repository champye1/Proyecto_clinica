import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'
import { getCurrentUser } from '@/services/authService'

export async function fetchReminders({ limit = 20 } = {}) {
  const { user } = await getCurrentUser()
  if (!user) return { data: [], error: null }

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) { logger.errorWithContext('reminderService.fetchReminders', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function createReminder(payload) {
  const { user } = await getCurrentUser()
  if (!user) return { data: null, error: new Error('No hay sesión activa') }

  const { data, error } = await supabase
    .from('reminders')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single()

  if (error) { logger.errorWithContext('reminderService.createReminder', error); return { data: null, error } }
  return { data, error: null }
}

export async function markReminderRead(id) {
  const { error } = await supabase
    .from('reminders')
    .update({ visto: true })
    .eq('id', id)

  if (error) logger.errorWithContext('reminderService.markReminderRead', error, { id })
  return { error: error ?? null }
}

export async function deleteReminder(id) {
  const { error } = await supabase
    .from('reminders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) logger.errorWithContext('reminderService.deleteReminder', error, { id })
  return { error: error ?? null }
}
