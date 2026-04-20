import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'

export async function scheduleSurgery({ surgeryRequestId, operatingRoomId, fecha, horaInicio, horaFin, observaciones }) {
  const { data, error } = await supabase.rpc('programar_cirugia_completa', {
    p_surgery_request_id: surgeryRequestId,
    p_operating_room_id:  operatingRoomId,
    p_fecha:              fecha,
    p_hora_inicio:        horaInicio,
    p_hora_fin:           horaFin,
    p_observaciones:      observaciones ?? null,
  })
  if (error) logger.errorWithContext('surgeryService.scheduleSurgery', error)
  return { data, error }
}

export async function rescheduleSurgery(id, { fecha, horaInicio, horaFin, operatingRoomId }) {
  const { error } = await supabase
    .from('surgeries')
    .update({
      fecha,
      hora_inicio: horaInicio,
      hora_fin:    horaFin,
      operating_room_id: operatingRoomId,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', id)
  return { error }
}

export async function cancelSurgery(id) {
  const { error } = await supabase
    .from('surgeries')
    .update({ estado: 'cancelada', updated_at: new Date().toISOString() })
    .eq('id', id)
  return { error }
}

export async function fetchSurgeryById(id) {
  const { data, error } = await supabase
    .from('surgeries')
    .select('doctor_id, fecha, hora_inicio, patients:patient_id(nombre, apellido)')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function fetchSurgeriesByDateRange(fechaInicio, fechaFin) {
  const { data, error } = await supabase
    .from('surgeries')
    .select('id, fecha, operating_room_id, hora_inicio, hora_fin, estado, doctors(apellido), patients:patient_id(nombre, apellido, rut)')
    .is('deleted_at', null)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
    .order('fecha', { ascending: false })
  return { data: data ?? [], error }
}

export async function fetchSurgeriesByDay(fecha) {
  const { data, error } = await supabase
    .from('surgeries')
    .select('*, doctors:doctor_id(nombre, apellido, especialidad), patients:patient_id(nombre, apellido, rut), operating_rooms:operating_room_id(nombre), surgery_request_id, surgery_requests:surgery_request_id(codigo_operacion)')
    .eq('fecha', fecha)
    .is('deleted_at', null)
    .order('hora_inicio', { ascending: true })
  return { data: data ?? [], error }
}

export async function fetchScheduleBlocksByDateRange(fechaInicio, fechaFin) {
  const { data, error } = await supabase
    .from('schedule_blocks')
    .select('id, fecha, operating_room_id, hora_inicio, hora_fin, vigencia_hasta')
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
    .is('deleted_at', null)
  return { data: data ?? [], error }
}

export async function notifyRescheduleToPabellon(surgeryRequestId) {
  const { data, error } = await supabase.rpc('notificar_reagendamiento_a_pabellon', {
    p_surgery_request_id: surgeryRequestId,
  })
  return { data, error }
}
