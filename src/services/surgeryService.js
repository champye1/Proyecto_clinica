/**
 * Servicio de cirugías.
 * Centraliza todas las operaciones sobre la tabla surgeries.
 */
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { SurgeryListSchema } from '../schemas/surgery.schema'

function validateList(data, context) {
  const result = SurgeryListSchema.safeParse(data)
  if (!result.success) {
    logger.errorWithContext(`[schema] ${context}`, result.error)
  }
}

const SELECT_WITH_RELATIONS = `
  id, fecha, hora_inicio, hora_fin, estado,
  fecha_anterior, hora_inicio_anterior,
  created_at, updated_at,
  surgery_request_id,
  operating_room:operating_rooms(id, nombre),
  doctor:doctors(id, nombre, apellido),
  patient:patients(id, nombre, apellido)
`

/**
 * Obtiene las cirugías de una fecha específica.
 * @param {string} fecha - formato YYYY-MM-DD
 * @param {string} [operatingRoomId] - filtrar por sala (opcional)
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchSurgeriesByDate(fecha, operatingRoomId = null) {
  let query = supabase
    .from('surgeries')
    .select(SELECT_WITH_RELATIONS)
    .eq('fecha', fecha)
    .is('deleted_at', null)

  if (operatingRoomId) {
    query = query.eq('operating_room_id', operatingRoomId)
  }

  const { data, error } = await query.order('hora_inicio', { ascending: true })

  if (error) {
    logger.errorWithContext('surgeryService.fetchSurgeriesByDate', error, { fecha })
    return { data: [], error }
  }
  validateList(data, 'surgeryService.fetchSurgeriesByDate')
  return { data: data ?? [], error: null }
}

/**
 * Obtiene las cirugías de un médico.
 * @param {string} doctorId
 * @param {string} [startDate] - filtrar desde esta fecha (YYYY-MM-DD)
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchSurgeriesByDoctor(doctorId, startDate = null) {
  let query = supabase
    .from('surgeries')
    .select(SELECT_WITH_RELATIONS)
    .eq('doctor_id', doctorId)
    .is('deleted_at', null)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (startDate) {
    query = query.gte('fecha', startDate)
  }

  const { data, error } = await query

  if (error) {
    logger.errorWithContext('surgeryService.fetchSurgeriesByDoctor', error, { doctorId })
    return { data: [], error }
  }
  validateList(data, 'surgeryService.fetchSurgeriesByDoctor')
  return { data: data ?? [], error: null }
}

/**
 * Obtiene las cirugías de hoy para el dashboard.
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchTodaySurgeries() {
  const today = new Date().toISOString().split('T')[0]
  return fetchSurgeriesByDate(today)
}

/**
 * Obtiene las cirugías de hoy para un médico específico.
 * @param {string} doctorId
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchTodaySurgeriesByDoctor(doctorId) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('surgeries')
    .select(SELECT_WITH_RELATIONS)
    .eq('doctor_id', doctorId)
    .eq('fecha', today)
    .is('deleted_at', null)
    .order('hora_inicio', { ascending: true })

  if (error) {
    logger.errorWithContext('surgeryService.fetchTodaySurgeriesByDoctor', error, { doctorId })
    return { data: [], error }
  }
  validateList(data, 'surgeryService.fetchTodaySurgeriesByDoctor')
  return { data: data ?? [], error: null }
}

/**
 * Programa una cirugía completa (transacción atómica via RPC).
 * @param {object} params - parámetros para la RPC programar_cirugia_completa
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function scheduleSurgery(params) {
  const { data, error } = await supabase.rpc('programar_cirugia_completa', params)

  if (error) {
    logger.errorWithContext('surgeryService.scheduleSurgery', error, { params })
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Reagenda una cirugía existente.
 * @param {string} surgeryId
 * @param {object} updates - { fecha, hora_inicio, hora_fin, operating_room_id }
 * @returns {Promise<{error: object|null}>}
 */
export async function rescheduleSurgery(surgeryId, updates) {
  const { error } = await supabase
    .from('surgeries')
    .update({
      ...updates,
      estado: 'reagendada',
      updated_at: new Date().toISOString(),
    })
    .eq('id', surgeryId)

  if (error) {
    logger.errorWithContext('surgeryService.rescheduleSurgery', error, { surgeryId })
  }
  return { error }
}

/**
 * Busca la cirugía asociada a una solicitud.
 * @param {string} surgeryRequestId
 * @returns {Promise<{surgeryId: string|null, error: object|null}>}
 */
export async function findSurgeryByRequestId(surgeryRequestId) {
  const { data, error } = await supabase
    .from('surgeries')
    .select('id')
    .eq('surgery_request_id', surgeryRequestId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    logger.errorWithContext('surgeryService.findSurgeryByRequestId', error, { surgeryRequestId })
    return { surgeryId: null, error }
  }
  return { surgeryId: data?.id ?? null, error: null }
}

/**
 * Obtiene la ocupación semanal de las salas de pabellón.
 * @param {string} startDate - YYYY-MM-DD inicio de semana
 * @param {string} endDate - YYYY-MM-DD fin de semana
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchWeeklyOccupancy(startDate, endDate) {
  const { data, error } = await supabase
    .from('surgeries')
    .select('fecha, hora_inicio, hora_fin, operating_room_id')
    .gte('fecha', startDate)
    .lte('fecha', endDate)
    .is('deleted_at', null)

  if (error) {
    logger.errorWithContext('surgeryService.fetchWeeklyOccupancy', error)
    return { data: [], error }
  }
  return { data: data ?? [], error: null }
}
