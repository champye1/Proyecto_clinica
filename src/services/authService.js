/**
 * Servicio de autenticación.
 * Centraliza todas las operaciones de Supabase Auth y la tabla users/doctors.
 */
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

/**
 * Obtiene el usuario autenticado actual (valida con el servidor).
 * @returns {Promise<{user: object|null, error: object|null}>}
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user: user ?? null, error }
}

/**
 * Obtiene la sesión actual desde el almacenamiento local.
 * Útil para verificar si hay token de recuperación en el hash.
 * @returns {Promise<{session: object|null, error: object|null}>}
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

/**
 * Obtiene el rol del usuario desde la tabla users.
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{role: string|null, error: object|null}>}
 */
export async function getUserRole(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    logger.errorWithContext('authService.getUserRole', error, { userId })
    return { role: null, error }
  }
  return { role: data?.role ?? null, error: null }
}

/**
 * Inicia sesión con email y contraseña.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

/**
 * Resuelve un username de doctor a su email (via RPC anónima).
 * @param {string} username
 * @returns {Promise<{email: string|null, error: object|null}>}
 */
export async function resolveUsernameToEmail(username) {
  const { data: resolvedEmail, error } = await supabase
    .rpc('get_doctor_email_by_username', { p_username: username.toLowerCase().trim() })

  if (error || resolvedEmail == null || resolvedEmail === '') {
    return { email: null, error: error ?? new Error('Usuario no encontrado') }
  }
  return { email: resolvedEmail, error: null }
}

/**
 * Verifica que el usuario pertenece a la tabla users y obtiene su rol.
 * @param {string} userId
 * @returns {Promise<{userData: object|null, error: object|null}>}
 */
export async function verifyUserExists(userId) {
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    return { userData: null, error }
  }
  return { userData, error: null }
}

/**
 * Verifica que el doctor existe en la tabla doctors y tiene acceso habilitado.
 * @param {string} userId
 * @returns {Promise<{doctorData: object|null, error: object|null}>}
 */
export async function verifyDoctorAccess(userId) {
  const { data: doctorData, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    return { doctorData: null, error }
  }
  return { doctorData, error: null }
}

/**
 * Cierra la sesión del usuario actual.
 * @returns {Promise<{error: object|null}>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Envía un email de recuperación de contraseña.
 * @param {string} email
 * @returns {Promise<{error: object|null}>}
 */
export async function sendPasswordResetEmail(email) {
  const redirectTo = `${window.location.origin}/restablecer-contrasena`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  return { error }
}

/**
 * Actualiza la contraseña del usuario autenticado.
 * @param {string} newPassword
 * @returns {Promise<{error: object|null}>}
 */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return { error }
}

/**
 * Escucha cambios en el estado de autenticación.
 * @param {Function} callback - (event, session) => void
 * @returns {Function} unsubscribe - llama para detener la escucha
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return () => subscription.unsubscribe()
}
