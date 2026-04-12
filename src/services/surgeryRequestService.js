/**
 * Servicio de solicitudes de cirugía.
 * Centraliza todas las operaciones sobre la tabla surgery_requests.
 */
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { SurgeryRequestListSchema } from '../schemas/surgeryRequest.schema'

function validateList(data, context) {
  const result = SurgeryRequestListSchema.safeParse(data)
  if (!result.success) {
    logger.errorWithContext(`[schema] ${context}`, result.error)
  }
}

const SELECT_FULL = `
  id, estado, created_at, operation_code, notas,
  doctor:doctors(id, nombre, apellido),
  patient:patients(id, nombre, apellido, rut, fecha_nacimiento),
  supplies:surgery_request_supplies(
    id, cantidad,
    supply:supplies(id, nombre, codigo, tipo)
  )
`

/**
 * Obtiene todas las solicitudes de cirugía (para pabellón).
 * @param {object} filters - { estado?, doctorId?, search? }
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchAllRequests(filters = {}) {
  let query = supabase
    .from('surgery_requests')
    .select(SELECT_FULL)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.estado) {
    query = query.eq('estado', filters.estado)
  }
  if (filters.doctorId) {
    query = query.eq('doctor_id', filters.doctorId)
  }

  const { data, error } = await query

  if (error) {
    logger.errorWithContext('surgeryRequestService.fetchAllRequests', error)
    return { data: [], error }
  }
  validateList(data, 'surgeryRequestService.fetchAllRequests')
  return { data: data ?? [], error: null }
}

/**
 * Obtiene las solicitudes de cirugía de un médico específico.
 * @param {string} doctorId
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchRequestsByDoctor(doctorId) {
  const { data, error } = await supabase
    .from('surgery_requests')
    .select(SELECT_FULL)
    .eq('doctor_id', doctorId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    logger.errorWithContext('surgeryRequestService.fetchRequestsByDoctor', error, { doctorId })
    return { data: [], error }
  }
  validateList(data, 'surgeryRequestService.fetchRequestsByDoctor')
  return { data: data ?? [], error: null }
}

/**
 * Crea una nueva solicitud de cirugía.
 * @param {object} requestData
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createRequest(requestData) {
  const { data, error } = await supabase
    .from('surgery_requests')
    .insert(requestData)
    .select()
    .single()

  if (error) {
    logger.errorWithContext('surgeryRequestService.createRequest', error)
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Acepta una solicitud de cirugía.
 * @param {string} requestId
 * @returns {Promise<{error: object|null}>}
 */
export async function acceptRequest(requestId) {
  const { error } = await supabase
    .from('surgery_requests')
    .update({ estado: 'aceptada', updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (error) {
    logger.errorWithContext('surgeryRequestService.acceptRequest', error, { requestId })
  }
  return { error }
}

/**
 * Rechaza una solicitud de cirugía.
 * @param {string} requestId
 * @param {string} motivo - motivo del rechazo
 * @returns {Promise<{error: object|null}>}
 */
export async function rejectRequest(requestId, motivo) {
  const { error } = await supabase
    .from('surgery_requests')
    .update({
      estado: 'rechazada',
      motivo_rechazo: motivo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) {
    logger.errorWithContext('surgeryRequestService.rejectRequest', error, { requestId })
  }
  return { error }
}

/**
 * Elimina una solicitud (soft delete).
 * @param {string} requestId
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteRequest(requestId) {
  const { error } = await supabase
    .from('surgery_requests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', requestId)

  if (error) {
    logger.errorWithContext('surgeryRequestService.deleteRequest', error, { requestId })
  }
  return { error }
}

/**
 * Cuenta solicitudes pendientes (para el dashboard).
 * @returns {Promise<{count: number, error: object|null}>}
 */
export async function countPendingRequests() {
  const { count, error } = await supabase
    .from('surgery_requests')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente')
    .is('deleted_at', null)

  if (error) {
    logger.errorWithContext('surgeryRequestService.countPendingRequests', error)
    return { count: 0, error }
  }
  return { count: count ?? 0, error: null }
}
