import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'

export async function getAdminStats() {
  const { data, error } = await supabase.rpc('get_admin_stats')
  if (error) { logger.errorWithContext('adminService.getAdminStats', error); return { data: null, error } }
  return { data, error: null }
}

export async function getAllClinics() {
  const { data, error } = await supabase.rpc('get_all_clinicas')
  if (error) { logger.errorWithContext('adminService.getAllClinics', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function getAllUsers() {
  const { data, error } = await supabase.rpc('get_all_usuarios')
  if (error) { logger.errorWithContext('adminService.getAllUsers', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function getClinicHealth(clinicaId) {
  const { data, error } = await supabase.rpc('get_clinica_health', { p_clinica_id: clinicaId })
  if (error) { logger.errorWithContext('adminService.getClinicHealth', error, { clinicaId }); return { data: null, error } }
  return { data, error: null }
}

export async function getImpersonationData(clinicaId) {
  const { data, error } = await supabase.rpc('get_impersonation_data', { p_clinica_id: clinicaId })
  if (error) { logger.errorWithContext('adminService.getImpersonationData', error, { clinicaId }); return { data: null, error } }
  return { data, error: null }
}

export async function getFinancialStats() {
  const { data, error } = await supabase.rpc('get_financial_stats')
  if (error) { logger.errorWithContext('adminService.getFinancialStats', error); return { data: null, error } }
  return { data, error: null }
}

export async function getAuditLogs({ page = 0, limit = 50, fechaDesde = null, fechaHasta = null } = {}) {
  const { data, error } = await supabase.rpc('get_audit_logs_admin', {
    p_limit:       limit,
    p_offset:      page * limit,
    p_fecha_desde: fechaDesde || null,
    p_fecha_hasta: fechaHasta || null,
  })
  if (error) { logger.errorWithContext('adminService.getAuditLogs', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function createClinic(payload) {
  const { data, error } = await supabase.rpc('admin_crear_clinica', payload)
  if (error) { logger.errorWithContext('adminService.createClinic', error); return { data: null, error } }
  return { data, error: null }
}

export async function deactivateUser(userId) {
  const { error } = await supabase.rpc('admin_desactivar_usuario', { p_user_id: userId })
  if (error) { logger.errorWithContext('adminService.deactivateUser', error, { userId }); return { error } }
  return { error: null }
}

export async function reactivateUser(userId) {
  const { error } = await supabase.rpc('admin_reactivar_usuario', { p_user_id: userId })
  if (error) { logger.errorWithContext('adminService.reactivateUser', error, { userId }); return { error } }
  return { error: null }
}

export async function forceLogoutUser(userId) {
  const { error } = await supabase.rpc('admin_force_logout', { p_user_id: userId })
  if (error) { logger.errorWithContext('adminService.forceLogoutUser', error, { userId }); return { error } }
  return { error: null }
}

export async function extendTrial(clinicaId, dias) {
  const { error } = await supabase.rpc('extender_trial', { p_clinica_id: clinicaId, p_dias: dias })
  if (error) { logger.errorWithContext('adminService.extendTrial', error, { clinicaId }); return { error } }
  return { error: null }
}

export async function activatePlan(clinicaId, planId) {
  const { error } = await supabase.rpc('admin_activar_plan', { p_clinica_id: clinicaId, p_plan_id: planId })
  if (error) { logger.errorWithContext('adminService.activatePlan', error, { clinicaId }); return { error } }
  return { error: null }
}

export async function suspendClinic(clinicaId) {
  const { error } = await supabase.rpc('admin_suspender_clinica', { p_clinica_id: clinicaId })
  if (error) { logger.errorWithContext('adminService.suspendClinic', error, { clinicaId }); return { error } }
  return { error: null }
}

export async function reactivateClinic(clinicaId) {
  const { error } = await supabase.rpc('admin_reactivar_clinica', { p_clinica_id: clinicaId })
  if (error) { logger.errorWithContext('adminService.reactivateClinic', error, { clinicaId }); return { error } }
  return { error: null }
}

export async function fetchPlans() {
  const { data, error } = await supabase
    .from('planes')
    .select('id, nombre, precio_mensual_usd')
    .eq('activo', true)
    .order('precio_mensual_usd')
  if (error) { logger.errorWithContext('adminService.fetchPlans', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function getAllBroadcasts() {
  const { data, error } = await supabase.rpc('get_all_broadcast_admin')
  if (error) { logger.errorWithContext('adminService.getAllBroadcasts', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function sendBroadcast(payload) {
  const { error } = await supabase.rpc('admin_send_broadcast', payload)
  if (error) { logger.errorWithContext('adminService.sendBroadcast', error); return { error } }
  return { error: null }
}

export async function deactivateBroadcast(id) {
  const { error } = await supabase.rpc('admin_desactivar_broadcast', { p_id: id })
  if (error) { logger.errorWithContext('adminService.deactivateBroadcast', error, { id }); return { error } }
  return { error: null }
}

export async function sendPasswordReset(email, redirectTo) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) { logger.errorWithContext('adminService.sendPasswordReset', error); return { error } }
  return { error: null }
}
