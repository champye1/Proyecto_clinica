import { supabase } from '@/config/supabase'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No hay sesión activa.')
  return `Bearer ${session.access_token}`
}

// ─── Médicos ────────────────────────────────────────────────────────────────

export async function fetchMedicos() {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, nombre, apellido, email, especialidad, estado, rut, acceso_web_enabled, created_at')
    .order('apellido')
  if (error) throw error
  return data
}

export async function toggleMedicoEstado(doctorId, nuevoEstado) {
  const { error } = await supabase
    .from('doctors')
    .update({ estado: nuevoEstado })
    .eq('id', doctorId)
  if (error) throw error
}

export async function createMedico(datosDoctor) {
  const authorization = await getAuthHeader()
  const res = await fetch(`${FUNCTIONS_URL}/create-doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authorization },
    body: JSON.stringify(datosDoctor),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Error al crear médico.')
  return json
}

// ─── Personal de Pabellón ───────────────────────────────────────────────────

export async function fetchPersonalPabellon() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, nombre, role, activo, created_at')
    .in('role', ['pabellon', 'admin_clinica'])
    .order('nombre')
  if (error) throw error
  return data
}

export async function createUsuarioPabellon(datos) {
  const authorization = await getAuthHeader()
  const res = await fetch(`${FUNCTIONS_URL}/create-pabellon-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authorization },
    body: JSON.stringify(datos),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Error al crear usuario.')
  return json
}

export async function deleteUsuarioPabellon(userId) {
  // Solo borra de public.users — en producción usarías una Edge Function
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)
  if (error) throw error
}

// ─── Activación / desactivación de usuarios ────────────────────────────────

export async function toggleUsuarioActivo(userId, nuevoActivo) {
  const { error } = await supabase
    .from('users')
    .update({ activo: nuevoActivo })
    .eq('id', userId)
  if (error) throw error
}

// ─── Invitaciones ──────────────────────────────────────────────────────────

export async function fetchInvitaciones() {
  const { data, error } = await supabase
    .from('invitaciones')
    .select('id, codigo, email, rol, activo, usado, expires_at, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function revocarInvitacion(id) {
  const { error } = await supabase
    .from('invitaciones')
    .update({ activo: false })
    .eq('id', id)
  if (error) throw error
}

export async function reactivarInvitacion(id) {
  const { error } = await supabase
    .from('invitaciones')
    .update({ activo: true })
    .eq('id', id)
  if (error) throw error
}

// ─── Actividad ─────────────────────────────────────────────────────────────

export async function fetchActividad(limit = 50) {
  const { data, error } = await supabase
    .from('clinica_actividad')
    .select('id, tipo, descripcion, metadata, created_at, user:user_id(nombre, email)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}
