import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'
import { getCurrentUser } from '@/services/authService'

export async function fetchMessages(filtro = 'no_leidos') {
  let query = supabase
    .from('external_messages')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filtro === 'no_leidos')  query = query.eq('leido', false).eq('archivado', false)
  else if (filtro === 'todos') query = query.eq('archivado', false)
  else if (filtro === 'archivados') query = query.eq('archivado', true)

  const { data, error } = await query
  if (error) { logger.errorWithContext('externalMessageService.fetchMessages', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function fetchMessageCounts() {
  const { data, error } = await supabase
    .from('external_messages')
    .select('leido, archivado')
    .is('deleted_at', null)

  if (error) return { data: { no_leidos: 0, todos: 0, archivados: 0 }, error }
  return {
    data: {
      no_leidos:  data.filter(m => !m.leido && !m.archivado).length,
      todos:      data.filter(m => !m.archivado).length,
      archivados: data.filter(m => m.archivado).length,
    },
    error: null,
  }
}

export async function markAsRead(id) {
  const { user } = await getCurrentUser()
  const { error } = await supabase
    .from('external_messages')
    .update({ leido: true, leido_at: new Date().toISOString(), leido_por: user?.id })
    .eq('id', id)

  if (error) logger.errorWithContext('externalMessageService.markAsRead', error, { id })
  return { error: error ?? null }
}

export async function archiveMessage(id, archive = true) {
  const { error } = await supabase
    .from('external_messages')
    .update({ archivado: archive })
    .eq('id', id)

  if (error) logger.errorWithContext('externalMessageService.archiveMessage', error, { id })
  return { error: error ?? null }
}

export async function saveNotes(id, notes) {
  const { error } = await supabase
    .from('external_messages')
    .update({ notas_internas: notes })
    .eq('id', id)

  if (error) logger.errorWithContext('externalMessageService.saveNotes', error, { id })
  return { error: error ?? null }
}

export async function deleteMessage(id) {
  const { error } = await supabase
    .from('external_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) logger.errorWithContext('externalMessageService.deleteMessage', error, { id })
  return { error: error ?? null }
}

export async function createContactMessage(payload) {
  const { error } = await supabase.from('external_messages').insert(payload)
  if (error) { logger.errorWithContext('externalMessageService.createContactMessage', error); return { error } }
  return { error: null }
}
