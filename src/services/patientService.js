import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'

export async function findPatientByRut(doctorId, rut) {
  const { data, error } = await supabase
    .from('patients')
    .select('id, nombre, apellido')
    .eq('doctor_id', doctorId)
    .eq('rut', rut)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) { logger.errorWithContext('patientService.findPatientByRut', error); return { data: null, error } }
  return { data, error: null }
}

export async function createPatient(payload) {
  const { data, error } = await supabase
    .from('patients')
    .insert(payload)
    .select()
    .single()

  if (error) { logger.errorWithContext('patientService.createPatient', error); return { data: null, error } }
  return { data, error: null }
}

export async function updatePatient(id, payload) {
  const { data, error } = await supabase
    .from('patients')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) { logger.errorWithContext('patientService.updatePatient', error, { id }); return { data: null, error } }
  return { data, error: null }
}

export async function deletePatient(id) {
  const { error } = await supabase
    .from('patients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) logger.errorWithContext('patientService.deletePatient', error, { id })
  return { error: error ?? null }
}
