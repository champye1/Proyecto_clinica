/**
 * Servicio de bloqueos de horario.
 * Centraliza todas las operaciones sobre la tabla schedule_blocks.
 */
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { ScheduleBlockListSchema } from '../schemas/scheduleBlock.schema'

const SELECT_WITH_RELATIONS = `
  id, fecha, hora_inicio, hora_fin, motivo, dias_liberacion,
  created_at, deleted_at,
  doctor:doctors(id, nombre, apellido),
  operating_room:operating_rooms(id, nombre)
`

/**
 * Obtiene todos los bloqueos activos.
 * @param {object} filters - { fecha?, operatingRoomId?, doctorId? }
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchBlocks(filters = {}) {
  let query = supabase
    .from('schedule_blocks')
    .select(SELECT_WITH_RELATIONS)
    .is('deleted_at', null)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (filters.fecha) {
    query = query.eq('fecha', filters.fecha)
  }
  if (filters.operatingRoomId) {
    query = query.eq('operating_room_id', filters.operatingRoomId)
  }
  if (filters.doctorId) {
    query = query.eq('doctor_id', filters.doctorId)
  }

  const { data, error } = await query

  if (error) {
    logger.errorWithContext('scheduleBlockService.fetchBlocks', error)
    return { data: [], error }
  }
  const validation = ScheduleBlockListSchema.safeParse(data)
  if (!validation.success) {
    logger.errorWithContext('[schema] scheduleBlockService.fetchBlocks', validation.error)
  }
  return { data: data ?? [], error: null }
}

/**
 * Obtiene los bloqueos de una fecha y sala específicas.
 * @param {string} fecha - YYYY-MM-DD
 * @param {string} operatingRoomId
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchBlocksByDateAndRoom(fecha, operatingRoomId) {
  return fetchBlocks({ fecha, operatingRoomId })
}

/**
 * Valida que no haya solapamiento entre un bloqueo nuevo y las cirugías existentes.
 * @param {string} fecha
 * @param {string} operatingRoomId
 * @param {string} horaInicio - HH:MM
 * @param {string} horaFin - HH:MM
 * @param {string|null} excludeBlockId - ID del bloqueo a excluir (para edición)
 * @returns {Promise<{hasOverlap: boolean, error: object|null}>}
 */
export async function validateNoOverlap(fecha, operatingRoomId, horaInicio, horaFin, excludeBlockId = null) {
  // Verificar solapamiento con cirugías
  const { data: surgeries, error: surgErr } = await supabase
    .from('surgeries')
    .select('hora_inicio, hora_fin')
    .eq('fecha', fecha)
    .eq('operating_room_id', operatingRoomId)
    .is('deleted_at', null)
    .lt('hora_inicio', horaFin)
    .gt('hora_fin', horaInicio)

  if (surgErr) {
    logger.errorWithContext('scheduleBlockService.validateNoOverlap (surgeries)', surgErr)
    return { hasOverlap: false, error: surgErr }
  }

  if (surgeries && surgeries.length > 0) {
    return { hasOverlap: true, error: null }
  }

  // Verificar solapamiento con otros bloqueos
  let blockQuery = supabase
    .from('schedule_blocks')
    .select('id')
    .eq('fecha', fecha)
    .eq('operating_room_id', operatingRoomId)
    .is('deleted_at', null)
    .lt('hora_inicio', horaFin)
    .gt('hora_fin', horaInicio)

  if (excludeBlockId) {
    blockQuery = blockQuery.neq('id', excludeBlockId)
  }

  const { data: blocks, error: blockErr } = await blockQuery

  if (blockErr) {
    logger.errorWithContext('scheduleBlockService.validateNoOverlap (blocks)', blockErr)
    return { hasOverlap: false, error: blockErr }
  }

  return { hasOverlap: blocks && blocks.length > 0, error: null }
}

/**
 * Crea un nuevo bloqueo de horario.
 * @param {object} blockData - { fecha, hora_inicio, hora_fin, motivo, doctor_id?, operating_room_id, dias_liberacion? }
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createBlock(blockData) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('schedule_blocks')
    .insert({
      ...blockData,
      created_by: user?.id,
      created_at: new Date().toISOString(),
    })
    .select(SELECT_WITH_RELATIONS)
    .single()

  if (error) {
    logger.errorWithContext('scheduleBlockService.createBlock', error)
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Actualiza un bloqueo de horario existente.
 * @param {string} blockId
 * @param {object} updates
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateBlock(blockId, updates) {
  const { data, error } = await supabase
    .from('schedule_blocks')
    .update(updates)
    .eq('id', blockId)
    .select(SELECT_WITH_RELATIONS)
    .single()

  if (error) {
    logger.errorWithContext('scheduleBlockService.updateBlock', error, { blockId })
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Elimina un bloqueo (soft delete).
 * @param {string} blockId
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteBlock(blockId) {
  const { error } = await supabase
    .from('schedule_blocks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', blockId)

  if (error) {
    logger.errorWithContext('scheduleBlockService.deleteBlock', error, { blockId })
  }
  return { error }
}
