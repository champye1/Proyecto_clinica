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

export async function fetchDashboardOccupancy(fecha) {
  const [{ data: cirugias }, { data: bloqueos }, { data: pabellones }] = await Promise.all([
    supabase.from('surgeries').select('operating_room_id').eq('fecha', fecha).is('deleted_at', null).in('estado', ['programada', 'en_proceso']),
    supabase.from('schedule_blocks').select('operating_room_id').eq('fecha', fecha).is('deleted_at', null).or(`vigencia_hasta.is.null,vigencia_hasta.gte.${fecha}`),
    supabase.from('operating_rooms').select('id').eq('activo', true).is('deleted_at', null),
  ])
  const total = pabellones?.length || 0
  const ids = new Set([...(cirugias?.map(c => c.operating_room_id) || []), ...(bloqueos?.map(b => b.operating_room_id) || [])])
  return {
    data: {
      totalPabellones: total,
      pabellonesOcupados: ids.size,
      porcentajeOcupacion: total > 0 ? Math.round((ids.size / total) * 100) : 0,
      totalCirugias: cirugias?.length || 0,
    },
    error: null,
  }
}

export async function fetchWeeklyUtilization(fechaInicio, fechaFin) {
  const [{ data: cirugias }, { data: pabellones }] = await Promise.all([
    supabase.from('surgeries').select('operating_room_id, fecha').gte('fecha', fechaInicio).lte('fecha', fechaFin).is('deleted_at', null).in('estado', ['programada', 'en_proceso', 'completada']),
    supabase.from('operating_rooms').select('id').eq('activo', true).is('deleted_at', null),
  ])
  const totalPabellones = pabellones?.length || 0
  const dias = Math.round((new Date(fechaFin) - new Date(fechaInicio)) / (1000 * 60 * 60 * 24)) + 1
  const slotsTotales = totalPabellones * dias * 12
  const slotsOcupados = new Set(cirugias?.map(c => `${c.operating_room_id}-${c.fecha}`) || []).size
  return {
    data: {
      porcentaje: slotsTotales > 0 ? Math.round((slotsOcupados / slotsTotales) * 100) : 0,
      slotsOcupados,
      slotsTotales,
    },
    error: null,
  }
}

export async function fetchAvgSurgeryDuration(fechaInicio) {
  const { data: cirugias, error } = await supabase
    .from('surgeries')
    .select('hora_inicio, hora_fin')
    .gte('fecha', fechaInicio)
    .is('deleted_at', null)
    .in('estado', ['completada'])
  if (error) { logger.errorWithContext('operatingRoomService.fetchAvgSurgeryDuration', error); return { data: 0, error } }
  if (!cirugias?.length) return { data: 0, error: null }
  const tiempos = cirugias.map(c => (new Date(`2000-01-01T${c.hora_fin}`) - new Date(`2000-01-01T${c.hora_inicio}`)) / 60000)
  return { data: Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length), error: null }
}

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
