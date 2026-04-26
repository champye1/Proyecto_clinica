import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'
import { getCurrentUser } from '@/services/authService'
import { ScheduleBlockListSchema } from '@/schemas/scheduleBlock.schema'

export async function fetchBlocks() {
  const { data, error } = await supabase
    .from('schedule_blocks')
    .select('*, doctors:doctor_id(nombre, apellido), operating_rooms:operating_room_id(nombre)')
    .is('deleted_at', null)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (error) { logger.errorWithContext('scheduleBlockService.fetchBlocks', error); return { data: [], error } }
  const validation = ScheduleBlockListSchema.safeParse(data)
  if (!validation.success) logger.errorWithContext('[schema] scheduleBlockService.fetchBlocks', validation.error)
  return { data: data ?? [], error: null }
}

export async function fetchBlocksByDate(fecha) {
  const { data, error } = await supabase
    .from('schedule_blocks')
    .select('id, operating_room_id, hora_inicio, hora_fin, vigencia_hasta')
    .eq('fecha', fecha)
    .is('deleted_at', null)
  if (error) { logger.errorWithContext('scheduleBlockService.fetchBlocksByDate', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function fetchBlocksForSlot(fecha, operatingRoomId) {
  const { data, error } = await supabase
    .from('schedule_blocks')
    .select('hora_inicio, hora_fin, id')
    .eq('fecha', fecha)
    .eq('operating_room_id', operatingRoomId)
    .is('deleted_at', null)

  if (error) { logger.errorWithContext('scheduleBlockService.fetchBlocksForSlot', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function createBlock(payload) {
  const { user } = await getCurrentUser()
  const { data, error } = await supabase
    .from('schedule_blocks')
    .insert({ ...payload, created_by: user?.id })
    .select()
    .single()

  if (error) { logger.errorWithContext('scheduleBlockService.createBlock', error); return { data: null, error } }
  return { data, error: null }
}

export async function updateBlock(id, payload) {
  const { data, error } = await supabase
    .from('schedule_blocks')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) { logger.errorWithContext('scheduleBlockService.updateBlock', error, { id }); return { data: null, error } }
  return { data, error: null }
}

export async function fetchSurgeriesForSlot(fecha, operatingRoomId) {
  const { data, error } = await supabase
    .from('surgeries')
    .select('hora_inicio, hora_fin')
    .eq('fecha', fecha)
    .eq('operating_room_id', operatingRoomId)
    .is('deleted_at', null)
    .in('estado', ['programada', 'en_proceso'])

  if (error) { logger.errorWithContext('scheduleBlockService.fetchSurgeriesForSlot', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function deleteBlock(id) {
  const { error } = await supabase
    .from('schedule_blocks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) logger.errorWithContext('scheduleBlockService.deleteBlock', error, { id })
  return { error: error ?? null }
}
