import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'

export async function signUpClinica(email, password, { metadata = {}, redirectTo = null } = {}) {
  const opts = {}
  if (Object.keys(metadata).length > 0) opts.data = metadata
  if (redirectTo) opts.emailRedirectTo = redirectTo
  const { data, error } = await supabase.auth.signUp({ email, password, options: opts })
  if (error) { logger.errorWithContext('onboardingService.signUpClinica', error); return { data: null, error } }
  return { data, error: null }
}

export async function registerClinica(payload) {
  const { error } = await supabase.rpc('registrar_clinica', payload)
  if (error) { logger.errorWithContext('onboardingService.registerClinica', error); return { error } }
  return { error: null }
}

export async function resendConfirmation(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) { logger.errorWithContext('onboardingService.resendConfirmation', error); return { error } }
  return { error: null }
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export async function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return subscription
}

export async function choosePlan(planId) {
  const { error } = await supabase.rpc('actualizar_plan_clinica', { p_plan_id: planId })
  if (error) { logger.errorWithContext('onboardingService.choosePlan', error); return { error } }
  return { error: null }
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) { logger.errorWithContext('onboardingService.updatePassword', error); return { error } }
  return { error: null }
}

export async function signUpInvitedUser(email, password, { metadata = {}, redirectTo = null } = {}) {
  const opts = {}
  if (Object.keys(metadata).length > 0) opts.data = metadata
  if (redirectTo) opts.emailRedirectTo = redirectTo
  const { data, error } = await supabase.auth.signUp({ email, password, options: opts })
  if (error) { logger.errorWithContext('onboardingService.signUpInvitedUser', error); return { data: null, error } }
  return { data, error: null }
}

export async function createUserRecord(payload) {
  const { error } = await supabase.from('users').insert(payload)
  if (error) { logger.errorWithContext('onboardingService.createUserRecord', error); return { error } }
  return { error: null }
}

export async function createDoctorRecord(payload) {
  const { error } = await supabase.from('doctors').insert(payload)
  if (error) { logger.errorWithContext('onboardingService.createDoctorRecord', error); return { error } }
  return { error: null }
}

export async function updateUserRecord(id, payload) {
  const { error } = await supabase.from('users').update(payload).eq('id', id)
  if (error) { logger.errorWithContext('onboardingService.updateUserRecord', error, { id }); return { error } }
  return { error: null }
}

export async function checkInvitationCode(codigo) {
  const { data, error } = await supabase.rpc('check_invitation_code', { p_codigo: codigo })
  if (error) { logger.errorWithContext('onboardingService.checkInvitationCode', error); return { valido: false, error: 'Error al verificar el código. Intenta de nuevo.' } }
  return data
}

export async function markInvitationUsed(token) {
  const { error } = await supabase
    .from('invitaciones')
    .update({ usado: true, usado_at: new Date().toISOString() })
    .eq('token', token)
  if (error) { logger.errorWithContext('onboardingService.markInvitationUsed', error); return { error } }
  return { error: null }
}

export async function markInvitationUsedById(id, userId) {
  const { error } = await supabase
    .from('invitaciones')
    .update({ usado: true, usado_por: userId })
    .eq('id', id)
  if (error) { logger.errorWithContext('onboardingService.markInvitationUsedById', error, { id }); return { error } }
  return { error: null }
}

export async function checkSuperAdminExists() {
  const { data, error } = await supabase.rpc('check_super_admin_exists')
  if (error) { logger.errorWithContext('onboardingService.checkSuperAdminExists', error); return { data: null, error } }
  return { data, error: null }
}

export async function setupSuperAdminRecord(userId, email) {
  const { error } = await supabase.rpc('setup_super_admin_record', { p_user_id: userId, p_email: email })
  if (error) { logger.errorWithContext('onboardingService.setupSuperAdminRecord', error); return { error } }
  return { error: null }
}
