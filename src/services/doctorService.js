/**
 * Servicio de médicos.
 * Centraliza todas las operaciones sobre la tabla doctors.
 */
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { DoctorListSchema } from '../schemas/doctor.schema'

/**
 * Obtiene la lista completa de médicos activos.
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function fetchDoctors() {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, nombre, apellido, especialidad, email, telefono, estado, acceso_web_enabled, user_id')
    .is('deleted_at', null)
    .order('apellido', { ascending: true })

  if (error) {
    logger.errorWithContext('doctorService.fetchDoctors', error)
    return { data: [], error }
  }
  const validation = DoctorListSchema.safeParse(data)
  if (!validation.success) {
    logger.errorWithContext('[schema] doctorService.fetchDoctors', validation.error)
  }
  return { data: data ?? [], error: null }
}

/**
 * Obtiene un médico por su ID.
 * @param {string} id
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function fetchDoctorById(id) {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    logger.errorWithContext('doctorService.fetchDoctorById', error, { id })
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Obtiene el médico asociado al usuario autenticado.
 * @param {string} userId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function fetchDoctorByUserId(userId) {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    logger.errorWithContext('doctorService.fetchDoctorByUserId', error, { userId })
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Crea un nuevo médico (invoca Edge Function para manejar el usuario Auth).
 * @param {object} doctorData - datos del médico
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createDoctor(doctorData) {
  const { data, error } = await supabase.functions.invoke('create-doctor', {
    body: doctorData,
  })

  if (error) {
    logger.errorWithContext('doctorService.createDoctor', error)
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Actualiza los datos de un médico.
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateDoctor(id, updates) {
  const { data, error } = await supabase
    .from('doctors')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.errorWithContext('doctorService.updateDoctor', error, { id })
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Elimina un médico (soft delete via Edge Function).
 * @param {string} doctorId
 * @param {string} userId - auth user id del médico
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteDoctor(doctorId, userId) {
  const { error } = await supabase.functions.invoke('delete-doctor', {
    body: { doctor_id: doctorId, user_id: userId },
  })

  if (error) {
    logger.errorWithContext('doctorService.deleteDoctor', error, { doctorId })
  }
  return { error }
}

/**
 * Actualiza la contraseña de un médico (via Edge Function con privilegios admin).
 * @param {string} userId - auth user id del médico
 * @param {string} newPassword
 * @returns {Promise<{error: object|null}>}
 */
export async function updateDoctorPassword(userId, newPassword) {
  const { error } = await supabase.functions.invoke('update-doctor-password', {
    body: { user_id: userId, new_password: newPassword },
  })

  if (error) {
    logger.errorWithContext('doctorService.updateDoctorPassword', error)
  }
  return { error }
}
