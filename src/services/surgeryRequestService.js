import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'
import { getCurrentUser } from '@/services/authService'
import { SurgeryRequestListSchema } from '@/schemas/surgeryRequest.schema'

export async function fetchRequests({ filtroEstado, busqueda, filtroDoctor, filtroCodigoOperacion } = {}) {
  let query = supabase
    .from('surgery_requests')
    .select(`
      *,
      patients:patient_id(nombre, apellido, rut),
      doctors:doctor_id(id, nombre, apellido, especialidad)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filtroEstado && filtroEstado !== 'todas') query = query.eq('estado', filtroEstado)
  if (filtroDoctor && filtroDoctor !== 'todos') query = query.eq('doctor_id', filtroDoctor)
  if (filtroCodigoOperacion && filtroCodigoOperacion !== 'todos') query = query.eq('codigo_operacion', filtroCodigoOperacion)
  if (busqueda) {
    const q = busqueda.trim()
    query = query.or(`patients.nombre.ilike.%${q}%,patients.apellido.ilike.%${q}%,patients.rut.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) { logger.errorWithContext('surgeryRequestService.fetchRequests', error); return { data: [], error } }
  const validation = SurgeryRequestListSchema.safeParse(data)
  if (!validation.success) logger.errorWithContext('[schema] surgeryRequestService.fetchRequests', validation.error)
  return { data: data ?? [], error: null }
}

export async function fetchRequestsByDoctor(doctorId) {
  const { data, error } = await supabase
    .from('surgery_requests')
    .select('*, patients:patient_id(nombre, apellido)')
    .eq('doctor_id', doctorId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) { logger.errorWithContext('surgeryRequestService.fetchRequestsByDoctor', error); return { data: [], error } }
  const validation = SurgeryRequestListSchema.safeParse(data)
  if (!validation.success) logger.errorWithContext('[schema] surgeryRequestService.fetchRequestsByDoctor', validation.error)
  return { data: data ?? [], error: null }
}

export async function fetchPendingRequestsByDoctor(doctorId) {
  const { data, error } = await supabase
    .from('surgery_requests')
    .select('*, patients:patient_id(nombre, apellido)')
    .eq('doctor_id', doctorId)
    .eq('estado', 'pendiente')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) { logger.errorWithContext('surgeryRequestService.fetchPendingRequestsByDoctor', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function fetchRequestById(id) {
  const { data, error } = await supabase
    .from('surgery_requests')
    .select(`
      *,
      patients:patient_id(*),
      doctors:doctor_id(id, nombre, apellido, especialidad),
      surgery_request_supplies(*, supplies:supply_id(nombre, codigo))
    `)
    .eq('id', id)
    .single()

  if (error) { logger.errorWithContext('surgeryRequestService.fetchRequestById', error, { id }); return { data: null, error } }
  return { data, error: null }
}

export async function createRequest(payload) {
  const { data, error } = await supabase
    .from('surgery_requests')
    .insert(payload)
    .select()
    .single()

  if (error) { logger.errorWithContext('surgeryRequestService.createRequest', error); return { data: null, error } }
  return { data, error: null }
}

export async function acceptRequest(id) {
  const { user } = await getCurrentUser()
  const { data, error } = await supabase
    .from('surgery_requests')
    .update({ estado: 'aceptada', updated_at: new Date().toISOString(), aceptada_por: user?.id })
    .eq('id', id)
    .select()
    .single()

  if (error) { logger.errorWithContext('surgeryRequestService.acceptRequest', error, { id }); return { data: null, error } }
  return { data, error: null }
}

export async function rejectRequest(id, motivo) {
  const { data, error } = await supabase
    .from('surgery_requests')
    .update({ estado: 'rechazada', motivo_rechazo: motivo ?? null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) { logger.errorWithContext('surgeryRequestService.rejectRequest', error, { id }); return { data: null, error } }
  return { data, error: null }
}

export async function updateRequestStatus(id, estado, extra = {}) {
  const { data, error } = await supabase
    .from('surgery_requests')
    .update({ estado, updated_at: new Date().toISOString(), ...extra })
    .eq('id', id)
    .select()
    .single()

  if (error) { logger.errorWithContext('surgeryRequestService.updateRequestStatus', error, { id, estado }); return { data: null, error } }
  return { data, error: null }
}

export async function deleteRequest(id) {
  const { error } = await supabase
    .from('surgery_requests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) logger.errorWithContext('surgeryRequestService.deleteRequest', error, { id })
  return { error: error ?? null }
}

export async function fetchRequestsByDoctorFull(doctorId, filtroEstado) {
  let query = supabase
    .from('surgery_requests')
    .select(`*, patients:patient_id(nombre, apellido, rut), surgery_request_supplies(cantidad, supplies:supply_id(nombre, codigo)), surgeries(fecha, hora_inicio, hora_fin, estado_hora, fecha_anterior, hora_inicio_anterior, hora_fin_anterior, operating_rooms:operating_room_id(nombre))`)
    .eq('doctor_id', doctorId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (filtroEstado && filtroEstado !== 'todas') query = query.eq('estado', filtroEstado)
  const { data, error } = await query
  if (error) { logger.errorWithContext('surgeryRequestService.fetchRequestsByDoctorFull', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function updateRequest(id, payload) {
  const { error } = await supabase
    .from('surgery_requests')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { logger.errorWithContext('surgeryRequestService.updateRequest', error, { id }); return { error } }
  return { error: null }
}

export async function deleteRequestSupplies(solicitudId) {
  const { error } = await supabase
    .from('surgery_request_supplies')
    .delete()
    .eq('surgery_request_id', solicitudId)
  if (error) { logger.errorWithContext('surgeryRequestService.deleteRequestSupplies', error, { solicitudId }); return { error } }
  return { error: null }
}

export async function fetchRequestsForPabellon(filtroEstado) {
  let query = supabase
    .from('surgery_requests')
    .select(`
      *,
      doctors:doctor_id(id, user_id, nombre, apellido, especialidad, estado),
      patients:patient_id(nombre, apellido, rut),
      surgery_request_supplies(
        cantidad,
        supplies:supply_id(nombre, codigo, grupo_prestacion)
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (filtroEstado && filtroEstado !== 'todas') query = query.eq('estado', filtroEstado)
  const { data, error } = await query
  if (error) { logger.errorWithContext('surgeryRequestService.fetchRequestsForPabellon', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function rejectSolicitud(id) {
  const { error } = await supabase
    .from('surgery_requests')
    .update({ estado: 'rechazada', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { logger.errorWithContext('surgeryRequestService.rejectSolicitud', error, { id }); return { error } }
  return { error: null }
}

export async function addRequestSupplies(solicitudId, insumos, clinicaId) {
  const { error } = await supabase
    .from('surgery_request_supplies')
    .insert(insumos.map(insumo => ({
      surgery_request_id: solicitudId,
      supply_id: insumo.supply_id,
      cantidad: insumo.cantidad,
      clinica_id: clinicaId,
    })))

  if (error) logger.errorWithContext('surgeryRequestService.addRequestSupplies', error, { solicitudId })
  return { error: error ?? null }
}
