import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { format, startOfYear, endOfYear, endOfMonth, isWithinInterval, startOfWeek, parseISO } from 'date-fns'
import {
  scheduleSurgery, rescheduleSurgery, cancelSurgery,
  fetchSurgeryById, fetchSurgeryByRequestId,
  fetchSurgeriesByDateRange, fetchSurgeriesByDay, fetchScheduleBlocksByDateRange,
} from '@/services/surgeryService'
import { fetchRequestById } from '@/services/surgeryRequestService'
import { getDoctorUserIdById } from '@/services/doctorService'
import { createNotification } from '@/services/notificationService'
import { fetchRooms } from '@/services/operatingRoomService'
import { useNotifications } from '@/hooks/useNotifications'
import { sanitizeString, safeParseJSON } from '@/utils/sanitizeInput'
import { logger } from '@/utils/logger'
import { MESES, TIME_SLOTS } from './constants'

export default function useCalendario() {
  const navigate    = useNavigate()
  const location    = useLocation()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  const fromReagendamientoNotification = location.state?.fromReagendamientoNotification === true
  const isReagendarMode = location.state?.reagendar === true && (
    location.state?.surgeryRequestId ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('reagendar_solicitud_id'))
  )

  const [anio, setAnio]                                         = useState(new Date().getFullYear())
  const [pabellonId, setPabellonId]                             = useState('todos')
  const [filtroPaciente, setFiltroPaciente]                     = useState('')
  const [view, setView]                                         = useState('year')
  const [selectedMonth, setSelectedMonth]                       = useState(null)
  const [selectedWeek, setSelectedWeek]                         = useState(null)
  const [selectedDay, setSelectedDay]                           = useState(null)
  const [selectedSlot, setSelectedSlot]                         = useState(null)
  const [showConfirmModal, setShowConfirmModal]                 = useState(false)
  const [horaFin, setHoraFin]                                   = useState('')
  const [showDayDetailsModal, setShowDayDetailsModal]           = useState(false)
  const [showDetallesModal, setShowDetallesModal]               = useState(false)
  const [dayDetailsDate, setDayDetailsDate]                     = useState(null)
  const [slotDetalle, setSlotDetalle]                           = useState(null)
  const [showConfirmCancelar, setShowConfirmCancelar]           = useState(false)
  const [cirugiaACancelar, setCirugiaACancelar]                 = useState(null)
  const [cirugiaAReagendar, setCirugiaAReagendar]               = useState(null)

  const [currentRequest, setCurrentRequest] = useState(() => {
    try {
      const s = sessionStorage.getItem('solicitud_gestionando')
      if (s) return safeParseJSON(s)
    } catch (e) { logger.errorWithContext('Error al parsear solicitud', e) }
    return null
  })

  // Navegación rápida desde dashboard
  useEffect(() => {
    try {
      const modo = sessionStorage.getItem('calendario_ir_hoy')
      if (!modo) return
      sessionStorage.removeItem('calendario_ir_hoy')
      const hoy = new Date()
      setAnio(hoy.getFullYear())
      setSelectedMonth(hoy.getMonth())
      setSelectedDay(hoy)
      if (modo === 'week') {
        setSelectedWeek(startOfWeek(hoy, { weekStartsOn: 1 }))
        setView('week')
      } else {
        setView('day')
      }
    } catch (e) { /* ignorar */ }
  }, [])

  // Llegada desde "Aceptar horario médico"
  useEffect(() => {
    try {
      const fromAceptar = location.state?.fromAceptarHorarioMedico === true || location.state?.fromResume === true
      if (!fromAceptar) return
      const slot = safeParseJSON(sessionStorage.getItem('slot_seleccionado'))
      if (!slot) return
      const fecha = new Date(slot.date)
      if (isNaN(fecha.getTime())) return
      setAnio(fecha.getFullYear())
      setSelectedMonth(fecha.getMonth())
      setSelectedDay(fecha)
      setView('day')
    } catch (e) { logger.errorWithContext('Error al abrir vista día desde aceptar horario', e) }
  }, [location.state?.fromAceptarHorarioMedico, location.state?.fromResume])

  // Modo reagendar
  useEffect(() => {
    if (!isReagendarMode) return
    const requestId = location.state?.surgeryRequestId || sessionStorage.getItem('reagendar_solicitud_id')
    if (!requestId) return
    const load = async () => {
      try {
        const { data: cirugia, error: errCirugia } = await fetchSurgeryByRequestId(requestId)
        if (errCirugia) { showError('No se encontró la cirugía a reagendar.'); return }
        if (!cirugia)   { showError('No hay cirugía programada para esta solicitud.'); return }

        const { data: solicitud, error: errSol } = await fetchRequestById(requestId)
        if (errSol || !solicitud) { showError('No se pudo cargar la solicitud.'); return }

        setCirugiaAReagendar(cirugia)
        setCurrentRequest(solicitud)
        setView('day')
        setSelectedDay(new Date(cirugia.fecha))
        setSelectedMonth(new Date(cirugia.fecha).getMonth())
        setAnio(new Date(cirugia.fecha).getFullYear())
      } catch (e) { showError('Error al cargar datos para reagendar.') }
    }
    load()
  }, [isReagendarMode, location.state?.surgeryRequestId])

  // Highlight desde notificación
  useEffect(() => {
    try {
      let hl = location.state?.highlight || safeParseJSON(sessionStorage.getItem('highlight_slot'))
      if (!hl) return
      const dateObj = parseISO(hl.date)
      if (isNaN(dateObj.getTime())) { showError('Fecha de la operación inválida.'); return }
      if (!TIME_SLOTS.includes(hl.time)) { showError('Hora de la operación fuera del rango disponible.'); return }
      setAnio(dateObj.getFullYear())
      setSelectedMonth(dateObj.getMonth())
      setSelectedDay(dateObj)
      setView('day')
      setSelectedSlot({ pabellonId: hl.pabellonId, time: hl.time, date: dateObj })
      navigate(location.pathname, { replace: true })
    } catch (e) { logger.errorWithContext('Error procesando highlight de calendario', e) }
  }, [location.state?.highlight])

  // ── Mutations ────────────────────────────────────────────────────────────────
  const programarCirugia = useMutation({
    mutationFn: async ({ solicitudId, formData }) => {
      const normalize = (t) => {
        if (t?.match(/^\d{1,2}:\d{2}$/))       { const [h, m] = t.split(':'); return `${h.padStart(2,'0')}:${m.padStart(2,'0')}:00` }
        if (t?.match(/^\d{1,2}:\d{2}:\d{2}$/)) { const [h, m, s] = t.split(':'); return `${h.padStart(2,'0')}:${m.padStart(2,'0')}:${s.padStart(2,'0')}` }
        return t
      }
      const horaInicio = normalize(formData.hora_inicio)
      const horaFinVal = normalize(formData.hora_fin)
      if (!horaInicio?.match(/^\d{2}:\d{2}:\d{2}$/)) throw new Error(`Formato de hora de inicio inválido: ${horaInicio}`)
      if (!horaFinVal?.match(/^\d{2}:\d{2}:\d{2}$/)) throw new Error(`Formato de hora de fin inválido: ${horaFinVal}`)
      const { data, error } = await scheduleSurgery({
        surgeryRequestId: solicitudId,
        operatingRoomId:  formData.operating_room_id,
        fecha:            formData.fecha,
        horaInicio,
        horaFin:          horaFinVal,
        observaciones:    formData.observaciones || null,
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'Error desconocido al programar la cirugía')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      queryClient.invalidateQueries({ queryKey: ['solicitudes-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-hoy'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-calendario'] })
      queryClient.invalidateQueries({ queryKey: ['calendario-anual-cirugias'] })
      showSuccess('Cirugía programada exitosamente')
      sessionStorage.removeItem('solicitud_gestionando')
      sessionStorage.removeItem('slot_seleccionado')
      setShowConfirmModal(false)
      setSelectedSlot(null)
      setCurrentRequest(null)
      navigate('/pabellon/solicitudes')
    },
    onError: (error) => {
      const msg     = error.message || error.toString() || 'Error desconocido'
      const details = error.details || ''
      const hint    = error.hint    || ''
      let mensaje = 'Error al programar la cirugía'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))                        mensaje = 'Error de conexión. Verifique su conexión a internet.'
      else if (msg.includes('solapamiento') || msg.includes('overlap') || msg.includes('Ya existe')) mensaje = 'Ya existe una cirugía en este horario. Seleccione otro.'
      else if (msg.includes('hora de fin') || msg.includes('hora de inicio'))                     mensaje = msg
      else if (msg.includes('tiempo de limpieza') || msg.includes('limpieza'))                    mensaje = msg
      else if (msg.includes('doctor debe estar activo'))                                           mensaje = 'El doctor debe estar activo para programar cirugías'
      else if (msg.includes('bloqueado') || msg.includes('blocked'))                              mensaje = 'El horario seleccionado está bloqueado'
      else if (msg.includes('fecha pasada'))                                                       mensaje = 'No se puede agendar en una fecha pasada'
      else if (msg.includes('solicitud') && msg.includes('pendiente'))                            mensaje = 'La solicitud debe estar en estado pendiente'
      else if (error.code === 'PGRST116' || error.code === '42883')                               mensaje = 'Error en la función de base de datos. Contacte al administrador.'
      else mensaje = msg + (details ? ` (${details})` : '') + (hint ? ` - ${hint}` : '')
      showError(mensaje)
    },
  })

  const reagendarCirugia = useMutation({
    mutationFn: async ({ cirugiaId, formData }) => {
      const norm = (t) => t?.match(/^\d{1,2}:\d{2}$/) ? (() => { const [h,m]=t.split(':'); return `${h.padStart(2,'0')}:${m.padStart(2,'0')}:00` })() : t
      const { error } = await rescheduleSurgery(cirugiaId, {
        fecha:           formData.fecha,
        horaInicio:      norm(formData.hora_inicio),
        horaFin:         norm(formData.hora_fin),
        operatingRoomId: formData.operating_room_id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-hoy'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-calendario'] })
      queryClient.invalidateQueries({ queryKey: ['calendario-anual-cirugias'] })
      showSuccess('Cirugía reagendada. Se notificó al doctor y al pabellón.')
      sessionStorage.removeItem('reagendar_solicitud_id')
      setShowConfirmModal(false); setSelectedSlot(null); setCurrentRequest(null); setCirugiaAReagendar(null)
      navigate('/pabellon/solicitudes')
    },
    onError: (error) => {
      const msg = error.message || error.toString()
      if (msg.includes('solapamiento') || msg.includes('Ya existe')) showError('Ya existe una cirugía en ese horario.')
      else if (msg.includes('bloqueado')) showError('El horario está bloqueado.')
      else showError('Error al reagendar: ' + msg)
    },
  })

  const cancelarCirugia = useMutation({
    mutationFn: async (cirugiaId) => {
      const { data: cirugia, error: errorCirugia } = await fetchSurgeryById(cirugiaId)
      if (errorCirugia) throw errorCirugia
      const { error } = await cancelSurgery(cirugiaId)
      if (error) throw error
      if (cirugia.doctor_id) {
        const { data: doctorUser } = await getDoctorUserIdById(cirugia.doctor_id)
        if (doctorUser?.user_id) {
          createNotification({
            user_id: doctorUser.user_id,
            tipo:    'operacion_programada',
            titulo:  'Cirugía Cancelada',
            mensaje: `La cirugía programada para ${cirugia.patients?.nombre} ${cirugia.patients?.apellido} el ${format(new Date(cirugia.fecha), 'dd/MM/yyyy')} a las ${cirugia.hora_inicio} ha sido cancelada por el pabellón.`,
            relacionado_con: cirugiaId,
          })
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendario-anual-cirugias'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-dia-detalle'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-fecha'] })
      showSuccess('Cirugía cancelada exitosamente. El doctor ha sido notificado.')
      setShowConfirmCancelar(false); setCirugiaACancelar(null); setShowDetallesModal(false); setShowDayDetailsModal(false); setSlotDetalle(null)
    },
    onError: (error) => {
      const msg = error.message || error.toString() || 'Error desconocido'
      showError(msg.includes('Failed to fetch') ? 'Error de conexión.' : 'Error al cancelar la cirugía: ' + msg)
    },
  })

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleConfirmSlot = () => {
    if (selectedSlot && currentRequest) {
      const [h, m] = selectedSlot.time.split(':')
      const d = new Date()
      d.setHours(parseInt(h) + 1, parseInt(m), 0, 0)
      setHoraFin(`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`)
      setShowConfirmModal(true)
    }
  }

  const handleConfirmarCupo = () => {
    if (!selectedSlot || !currentRequest || !horaFin) return
    const [ih, im] = selectedSlot.time.split(':').map(Number)
    const [fh, fm] = horaFin.split(':').map(Number)
    if (fh * 60 + fm <= ih * 60 + im) { showError('La hora de fin debe ser mayor que la hora de inicio'); return }
    const formData = { fecha: format(selectedSlot.date, 'yyyy-MM-dd'), hora_inicio: selectedSlot.time, hora_fin: horaFin, operating_room_id: selectedSlot.pabellonId, observaciones: '' }
    if (cirugiaAReagendar) reagendarCirugia.mutate({ cirugiaId: cirugiaAReagendar.id, formData })
    else programarCirugia.mutate({ solicitudId: currentRequest.id, formData })
  }

  const handleSelectSlotFromModal = (slot) => {
    if (!dayDetailsDate) return
    setSelectedSlot({ pabellonId: slot.pabellon.id, time: slot.time, date: dayDetailsDate })
    setShowDayDetailsModal(false)
    const [h, m] = slot.time.split(':')
    const d = new Date()
    d.setHours(parseInt(h) + 1, parseInt(m), 0, 0)
    setHoraFin(`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`)
    setShowConfirmModal(true)
  }

  const handleNavigate = (targetView, newAnio = null, newMonth = null) => {
    if (targetView === 'year') {
      setView('year'); setSelectedMonth(null); setSelectedWeek(null); setSelectedDay(null); setSelectedSlot(null)
    } else if (targetView === 'month') {
      setView('month'); setSelectedWeek(null); setSelectedDay(null); setSelectedSlot(null)
      if (newAnio  !== null) setAnio(newAnio)
      if (newMonth !== null) setSelectedMonth(newMonth)
    } else if (targetView === 'week') {
      setView('week'); setSelectedDay(null); setSelectedSlot(null)
    }
  }

  // ── Queries ──────────────────────────────────────────────────────────────────
  const inicioAnio     = startOfYear(new Date(anio, 0, 1))
  const finAnio        = endOfYear(new Date(anio, 0, 1))
  const fechaInicioStr = inicioAnio.toISOString().slice(0, 10)
  const fechaFinStr    = finAnio.toISOString().slice(0, 10)

  const { data: cirugias = [], isLoading: loadingCirugias } = useQuery({
    queryKey: ['calendario-anual-cirugias', anio, filtroPaciente],
    refetchInterval: 10000,
    queryFn: async () => {
      let inicio = fechaInicioStr
      let fin    = fechaFinStr
      if (filtroPaciente) {
        const inf = new Date(); inf.setFullYear(inf.getFullYear() - 5)
        const sup = new Date(); sup.setFullYear(sup.getFullYear() + 2)
        inicio = inf.toISOString().slice(0, 10)
        fin    = sup.toISOString().slice(0, 10)
      }
      const { data, error } = await fetchSurgeriesByDateRange(inicio, fin)
      if (error) throw error
      if (filtroPaciente && data) {
        const f = filtroPaciente.toLowerCase().trim()
        return data.filter(c => `${c.patients?.nombre || ''} ${c.patients?.apellido || ''}`.toLowerCase().includes(f))
      }
      return data
    },
  })

  const { data: bloqueos = [], isLoading: loadingBloqueos } = useQuery({
    queryKey: ['calendario-anual-bloqueos', anio],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await fetchScheduleBlocksByDateRange(fechaInicioStr, fechaFinStr)
      if (error) throw error
      return data
    },
  })

  const { data: cirugiasDetalle = [] } = useQuery({
    queryKey: ['cirugias-dia-detalle', selectedDay, filtroPaciente],
    refetchInterval: 10000,
    queryFn: async () => {
      if (!selectedDay) return []
      const { data, error } = await fetchSurgeriesByDay(format(selectedDay, 'yyyy-MM-dd'))
      if (error) throw error
      if (filtroPaciente && data) {
        const f = filtroPaciente.toLowerCase().trim()
        return data.filter(c => `${c.patients?.nombre || ''} ${c.patients?.apellido || ''}`.toLowerCase().includes(f))
      }
      return data
    },
    enabled: !!selectedDay && view === 'day',
  })

  const { data: pabellones = [] } = useQuery({
    queryKey: ['pabellones-calendario'],
    queryFn: async () => {
      const { data, error } = await fetchRooms()
      if (error) throw error
      return data
    },
  })

  // ── Derived state ─────────────────────────────────────────────────────────────
  const statsMeses = useMemo(() => {
    return MESES.map((mes) => {
      const inicioMes = new Date(anio, mes.indice, 1)
      const finMes    = endOfMonth(inicioMes)
      const cirugiasMes = cirugias.filter(c => {
        if (pabellonId !== 'todos' && c.operating_room_id !== pabellonId) return false
        return isWithinInterval(new Date(c.fecha), { start: inicioMes, end: finMes })
      })
      const bloqueosMes = bloqueos.filter(b => {
        if (pabellonId !== 'todos' && b.operating_room_id !== pabellonId) return false
        return isWithinInterval(new Date(b.fecha), { start: inicioMes, end: finMes })
      })
      const total = cirugiasMes.length + bloqueosMes.length
      const porcentajeAgendado  = total > 0 ? Math.round((cirugiasMes.length / total) * 100) : 0
      const porcentajeBloqueado = total > 0 ? Math.round((bloqueosMes.length / total) * 100) : 0
      return { ...mes, cirugiasEstimadas: cirugiasMes.length, porcentajeAgendado, porcentajeBloqueado, porcentajeLibre: Math.max(0, 100 - porcentajeAgendado - porcentajeBloqueado) }
    })
  }, [anio, pabellonId, cirugias, bloqueos])

  const isOverlap = useMemo(() => {
    if (!selectedSlot || !horaFin || !horaFin.match(/^\d{2}:\d{2}$/)) return false
    const fechaStr = format(selectedSlot.date, 'yyyy-MM-dd')
    return cirugias.some(c => {
      if (c.fecha !== fechaStr || c.operating_room_id !== selectedSlot.pabellonId || c.estado === 'cancelada') return false
      if (cirugiaAReagendar && c.id === cirugiaAReagendar.id) return false
      return selectedSlot.time < c.hora_fin && horaFin > c.hora_inicio
    })
  }, [selectedSlot, horaFin, cirugias, cirugiaAReagendar])

  return {
    // Navigation state
    anio, setAnio,
    pabellonId, setPabellonId: (v) => setPabellonId(sanitizeString(v)),
    filtroPaciente, setFiltroPaciente: (v) => setFiltroPaciente(sanitizeString(v)),
    view, setView,
    selectedMonth, setSelectedMonth,
    selectedWeek, setSelectedWeek,
    selectedDay, setSelectedDay,
    selectedSlot, setSelectedSlot,
    // Modal state
    showConfirmModal, setShowConfirmModal,
    horaFin, setHoraFin,
    showDayDetailsModal, setShowDayDetailsModal,
    showDetallesModal, setShowDetallesModal,
    dayDetailsDate, setDayDetailsDate,
    slotDetalle, setSlotDetalle,
    showConfirmCancelar, setShowConfirmCancelar,
    cirugiaACancelar, setCirugiaACancelar,
    cirugiaAReagendar, setCirugiaAReagendar,
    currentRequest, setCurrentRequest,
    // Mutations
    programarCirugia, reagendarCirugia, cancelarCirugia,
    // Handlers
    handleConfirmSlot, handleConfirmarCupo, handleSelectSlotFromModal, handleNavigate,
    // Queries
    cirugias, bloqueos, cirugiasDetalle, pabellones,
    loadingCirugias, loadingBloqueos,
    // Computed
    statsMeses, isOverlap,
    // Context flags
    fromReagendamientoNotification, isReagendarMode,
    navigate, location,
  }
}
