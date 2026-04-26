import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'
import { DoctorListSchema } from '@/schemas/doctor.schema'

export async function listDoctors() {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .is('deleted_at', null)
    .order('apellido', { ascending: true })
  if (error) { logger.errorWithContext('doctorService.listDoctors', error); return { data: [], error } }
  const validation = DoctorListSchema.safeParse(data)
  if (!validation.success) logger.errorWithContext('[schema] doctorService.listDoctors', validation.error)
  return { data: data ?? [], error: null }
}

export async function getDoctorByUserId(userId) {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return { data, error }
}

export async function getDoctorUserIdById(doctorId) {
  const { data, error } = await supabase
    .from('doctors')
    .select('user_id')
    .eq('id', doctorId)
    .single()
  return { data, error }
}

export async function checkDoctorEmailExists(email, excludeId) {
  const { data, error } = await supabase
    .from('doctors')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .neq('id', excludeId)
    .is('deleted_at', null)
    .maybeSingle()
  return { data, error }
}

export async function createDoctor(doctorData) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No hay sesión activa')
  const { data, error } = await supabase.functions.invoke('create-doctor', {
    body: doctorData,
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (error) {
    logger.errorWithContext('doctorService.createDoctor', error)
    throw new Error(error.message || 'Error al invocar Edge Function')
  }
  return data
}

export async function updateDoctor(id, data) {
  const { error } = await supabase.from('doctors').update(data).eq('id', id)
  return { error }
}

export async function updateDoctorPassword(doctorId, password) {
  const { data, error } = await supabase.functions.invoke('update-doctor-password', {
    body: { doctorId, password },
  })
  if (error) {
    logger.errorWithContext('doctorService.updateDoctorPassword', error)
    throw new Error(error.message || 'Error al actualizar contraseña')
  }
  return data
}

export async function toggleDoctorAccess(id, acceso_web_enabled) {
  const { error } = await supabase.from('doctors').update({ acceso_web_enabled }).eq('id', id)
  return { error }
}

export async function toggleDoctorStatus(id, currentEstado) {
  const nuevoEstado = currentEstado === 'activo' ? 'vacaciones' : 'activo'
  const { error } = await supabase.from('doctors').update({ estado: nuevoEstado }).eq('id', id)
  return { error, nuevoEstado }
}

export async function deleteDoctor(id) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No hay sesión activa')
  const { data, error } = await supabase.functions.invoke('delete-doctor', {
    body: { doctorId: id },
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (error) {
    logger.errorWithContext('doctorService.deleteDoctor', error)
    throw new Error(error.message || 'Error al eliminar médico')
  }
  return data
}
