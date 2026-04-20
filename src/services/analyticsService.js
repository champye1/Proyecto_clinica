import { supabase } from '@/config/supabase'
import { format, subDays, subMonths } from 'date-fns'

/**
 * Returns { start, end } ISO date strings for a given period identifier.
 * 'custom' requires customStart/customEnd to be provided.
 */
export function getPeriodDates(periodo, customStart = null, customEnd = null) {
  const today = new Date()
  const end = format(today, 'yyyy-MM-dd')

  if (periodo === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd }
  }

  const startMap = {
    semana:    format(subDays(today, 6), 'yyyy-MM-dd'),
    mes:       format(subDays(today, 29), 'yyyy-MM-dd'),
    trimestre: format(subMonths(today, 3), 'yyyy-MM-dd'),
    año:       format(subMonths(today, 12), 'yyyy-MM-dd'),
  }

  return { start: startMap[periodo] ?? startMap.mes, end }
}

/**
 * Fetches all raw data needed for the analytics page for a given date range.
 */
export async function fetchAnalyticsData(startDate, endDate) {
  const [surgeriesRes, requestsRes, roomsRes, doctorsRes] = await Promise.all([
    supabase
      .from('surgeries')
      .select(`
        id, fecha, hora_inicio, hora_fin, estado, created_at,
        doctors:doctor_id(id, nombre, apellido, especialidad),
        patients:patient_id(nombre, apellido, rut),
        operating_rooms:operating_room_id(id, nombre)
      `)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .is('deleted_at', null)
      .order('fecha', { ascending: true }),

    supabase
      .from('surgery_requests')
      .select('id, estado, created_at, doctors:doctor_id(nombre, apellido)')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .is('deleted_at', null),

    supabase
      .from('operating_rooms')
      .select('id, nombre')
      .eq('activo', true)
      .is('deleted_at', null)
      .order('nombre'),

    supabase
      .from('doctors')
      .select('id, nombre, apellido, especialidad')
      .is('deleted_at', null)
      .order('apellido'),
  ])

  if (surgeriesRes.error) throw surgeriesRes.error
  if (roomsRes.error) throw roomsRes.error

  return {
    surgeries: surgeriesRes.data ?? [],
    requests:  requestsRes.data ?? [],
    rooms:     roomsRes.data ?? [],
    doctors:   doctorsRes.data ?? [],
  }
}
