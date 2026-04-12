/**
 * Servicio de salas de pabellón.
 * Centraliza todas las operaciones sobre la tabla operating_rooms.
 */
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

/**
 * Obtiene todas las salas activas.
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchRooms() {
  const { data, error } = await supabase
    .from('operating_rooms')
    .select('id, nombre, activo')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (error) {
    logger.errorWithContext('operatingRoomService.fetchRooms', error)
    return { data: [], error }
  }
  return { data: data ?? [], error: null }
}

/**
 * Obtiene la ocupación de hoy (cirugías + bloqueos) para todas las salas.
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchTodayOccupancy() {
  const today = new Date().toISOString().split('T')[0]

  const [{ data: surgeries, error: surgErr }, { data: blocks, error: blockErr }] = await Promise.all([
    supabase
      .from('surgeries')
      .select('operating_room_id, hora_inicio, hora_fin')
      .eq('fecha', today)
      .is('deleted_at', null),
    supabase
      .from('schedule_blocks')
      .select('operating_room_id, hora_inicio, hora_fin')
      .eq('fecha', today)
      .is('deleted_at', null),
  ])

  if (surgErr) {
    logger.errorWithContext('operatingRoomService.fetchTodayOccupancy (surgeries)', surgErr)
    return { data: [], error: surgErr }
  }
  if (blockErr) {
    logger.errorWithContext('operatingRoomService.fetchTodayOccupancy (blocks)', blockErr)
    return { data: [], error: blockErr }
  }

  return {
    data: { surgeries: surgeries ?? [], blocks: blocks ?? [] },
    error: null,
  }
}
