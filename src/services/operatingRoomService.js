/**
 * Servicio de salas de pabellón.
 * Centraliza todas las operaciones sobre la tabla operating_rooms.
 */
import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'
import { getMyClinicaId } from '@/utils/getClinicaId'

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

/**
 * Crea una nueva sala de pabellón.
 * @param {object} roomData - { nombre, descripcion? }
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createRoom(roomData) {
  const clinicaId = await getMyClinicaId()
  const { data, error } = await supabase
    .from('operating_rooms')
    .insert({ ...roomData, clinica_id: clinicaId, activo: true })
    .select()
    .single()

  if (error) {
    logger.errorWithContext('operatingRoomService.createRoom', error)
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Actualiza una sala de pabellón.
 * @param {string} roomId
 * @param {object} updates - { nombre?, descripcion?, activo? }
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateRoom(roomId, updates) {
  const { data, error } = await supabase
    .from('operating_rooms')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', roomId)
    .select()
    .single()

  if (error) {
    logger.errorWithContext('operatingRoomService.updateRoom', error, { roomId })
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Elimina (desactiva) una sala de pabellón.
 * @param {string} roomId
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteRoom(roomId) {
  const { error } = await supabase
    .from('operating_rooms')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', roomId)

  if (error) {
    logger.errorWithContext('operatingRoomService.deleteRoom', error, { roomId })
  }
  return { error }
}

/**
 * Obtiene todas las salas (activas e inactivas) para configuración.
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchAllRooms() {
  const { data, error } = await supabase
    .from('operating_rooms')
    .select('id, nombre, activo')
    .order('nombre', { ascending: true })

  if (error) {
    logger.errorWithContext('operatingRoomService.fetchAllRooms', error)
    return { data: [], error }
  }
  return { data: data ?? [], error: null }
}
