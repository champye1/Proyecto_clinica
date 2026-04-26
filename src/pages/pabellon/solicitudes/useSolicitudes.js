import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { getMyClinicaId } from '@/utils/getClinicaId'
import { useNotifications } from '@/hooks/useNotifications'
import { useDebounce } from '@/hooks/useDebounce'
import { sanitizeString, safeParseJSON } from '@/utils/sanitizeInput'
import { logger } from '@/utils/logger'
import { fetchRequestsForPabellon, rejectSolicitud } from '@/services/surgeryRequestService'
import { fetchRooms } from '@/services/operatingRoomService'
import { scheduleSurgery, fetchSurgeriesByDay, fetchSurgeryByRequestId, rescheduleSurgery } from '@/services/surgeryService'
import { fetchBlocksByDate } from '@/services/scheduleBlockService'
import { createNotification } from '@/services/notificationService'
import { emailSolicitudRechazada, emailCirugiaProgramada, emailReagendamiento } from '@/services/emailService'
import { notifyDoctorSolicitudRechazada, notifyDoctorCirugiaProgramada, notifyDoctorReagendamiento } from '@/services/whatsappService'

export function useSolicitudes() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showSuccess, showError } = useNotifications()
  const queryClient = useQueryClient()

  // ── Filtros ────────────────────────────────────────────────
  const [filtroEstado,          setFiltroEstado]          = useState('todas')
  const [busqueda,              setBusqueda]              = useState('')
  const [filtroDoctor,          setFiltroDoctor]          = useState('todos')
  const [filtroCodigoOperacion, setFiltroCodigoOperacion] = useState('todos')
  const debouncedBusqueda = useDebounce(busqueda, 300)

  // ── Modales / UI ───────────────────────────────────────────
  const [solicitudProgramando,      setSolicitudProgramando]      = useState(null)
  const [solicitudDetalle,          setSolicitudDetalle]          = useState(null)
  const [solicitudAceptandoHorario, setSolicitudAceptandoHorario] = useState(null)
  const [showConfirmRechazar,       setShowConfirmRechazar]       = useState(false)
  const [solicitudARechazar,        setSolicitudARechazar]        = useState(null)
  const [seleccionBloques,          setSeleccionBloques]          = useState({ pabellonId: null, times: [] })

  const [formProgramacion, setFormProgramacion] = useState({
    fecha: '', hora_inicio: '', hora_fin: '', operating_room_id: '', observaciones: '',
  })

  const resetForm = useCallback(() => {
    setSolicitudProgramando(null)
    setFormProgramacion({ fecha: '', hora_inicio: '', hora_fin: '', operating_room_id: '', observaciones: '' })
    setSeleccionBloques({ pabellonId: null, times: [] })
    sessionStorage.removeItem('solicitud_gestionando')
    sessionStorage.removeItem('slot_seleccionado')
  }, [])

  // ── Restore slot from calendar ─────────────────────────────
  useEffect(() => {
    try {
      const slotStr      = sessionStorage.getItem('slot_seleccionado')
      const solicitudStr = sessionStorage.getItem('solicitud_gestionando')
      if (slotStr && solicitudStr) {
        const slot      = safeParseJSON(slotStr)
        const solicitud = safeParseJSON(solicitudStr)
        if (!slot?.date || !slot?.time || !slot?.pabellonId || !solicitud?.id) {
          logger.warn('Slot o solicitud con estructura inválida en sessionStorage')
          sessionStorage.removeItem('slot_seleccionado')
          sessionStorage.removeItem('solicitud_gestionando')
          return
        }
        setSolicitudProgramando(solicitud)
        setFormProgramacion({
          fecha:             format(new Date(slot.date), 'yyyy-MM-dd'),
          hora_inicio:       slot.time,
          hora_fin:          '',
          operating_room_id: slot.pabellonId,
          observaciones:     '',
        })
        sessionStorage.removeItem('slot_seleccionado')
      }
    } catch (e) {
      logger.errorWithContext('Error al procesar slot seleccionado', e)
    }
  }, [])

  useEffect(() => {
    try {
      const openDirect   = location.state?.openProgramacion === true
      const solicitudStr = sessionStorage.getItem('solicitud_gestionando')
      if (openDirect && solicitudStr) {
        const solicitud = safeParseJSON(solicitudStr)
        if (!solicitud?.id) {
          logger.warn('solicitud_gestionando inválida en sessionStorage')
          sessionStorage.removeItem('solicitud_gestionando')
          return
        }
        setSolicitudProgramando(solicitud)
        setFormProgramacion({ fecha: '', hora_inicio: '', hora_fin: '', operating_room_id: '', observaciones: '' })
      }
    } catch (e) {
      logger.errorWithContext('Error al abrir programación directa', e)
    }
  }, [location.state?.openProgramacion])

  // ── Helpers de tiempo ──────────────────────────────────────
  const timeToMinutes = useCallback((t) => {
    const [h, m] = String(t).split(':').map(Number)
    return h * 60 + (m || 0)
  }, [])

  const sortTimesAsc = useCallback((arr) =>
    [...arr].sort((a, b) => timeToMinutes(a) - timeToMinutes(b)),
    [timeToMinutes]
  )

  const areContiguous = useCallback((arr) => {
    const s = sortTimesAsc(arr)
    for (let i = 1; i < s.length; i++) {
      if (timeToMinutes(s[i]) - timeToMinutes(s[i - 1]) !== 60) return false
    }
    return true
  }, [sortTimesAsc, timeToMinutes])

  // ── Queries ────────────────────────────────────────────────
  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['solicitudes', filtroEstado],
    queryFn: async () => {
      const { data, error } = await fetchRequestsForPabellon(filtroEstado)
      if (error) throw error
      return data
    },
  })

  const { data: pabellones = [] } = useQuery({
    queryKey: ['pabellones'],
    queryFn: async () => {
      const { data, error } = await fetchRooms()
      if (error) throw error
      return data
    },
  })

  const { data: cirugiasFecha = [] } = useQuery({
    queryKey: ['cirugias-fecha', formProgramacion.fecha],
    queryFn: async () => {
      if (!formProgramacion.fecha) return []
      const { data, error } = await fetchSurgeriesByDay(formProgramacion.fecha)
      if (error) throw error
      return (data || []).filter(c => ['programada', 'en_proceso'].includes(c.estado))
    },
    enabled: !!formProgramacion.fecha,
  })

  const { data: bloqueosFecha = [] } = useQuery({
    queryKey: ['bloqueos-fecha', formProgramacion.fecha],
    queryFn: async () => {
      if (!formProgramacion.fecha) return []
      const { data, error } = await fetchBlocksByDate(formProgramacion.fecha)
      if (error) throw error
      return (data || []).filter(b => !b.vigencia_hasta || b.vigencia_hasta >= formProgramacion.fecha)
    },
    enabled: !!formProgramacion.fecha,
  })

  // ── Computed ───────────────────────────────────────────────
  const doctoresUnicos = useMemo(() => {
    const map = new Map()
    solicitudes.forEach(s => { if (s.doctors && !map.has(s.doctors.id)) map.set(s.doctors.id, s.doctors) })
    return Array.from(map.values())
  }, [solicitudes])

  const codigosUnicos = useMemo(() => {
    const set = new Set()
    solicitudes.forEach(s => { if (s.codigo_operacion) set.add(s.codigo_operacion) })
    return Array.from(set).sort()
  }, [solicitudes])

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(s => {
      if (filtroEstado !== 'todas' && s.estado !== filtroEstado) return false
      if (filtroDoctor !== 'todos' && s.doctors?.id !== filtroDoctor) return false
      if (filtroCodigoOperacion !== 'todos' && s.codigo_operacion !== filtroCodigoOperacion) return false
      if (debouncedBusqueda.trim()) {
        const q      = debouncedBusqueda.toLowerCase()
        const nombre = `${s.patients?.nombre || ''} ${s.patients?.apellido || ''}`.toLowerCase()
        const rut    = (s.patients?.rut || '').toLowerCase()
        const doctor = `${s.doctors?.nombre || ''} ${s.doctors?.apellido || ''}`.toLowerCase()
        const codigo = (s.codigo_operacion || '').toLowerCase()
        if (!nombre.includes(q) && !rut.includes(q) && !doctor.includes(q) && !codigo.includes(q)) return false
      }
      return true
    })
  }, [solicitudes, filtroEstado, filtroDoctor, filtroCodigoOperacion, debouncedBusqueda])

  const slotsHorarios = useMemo(() => {
    const hours = []
    for (let i = 8; i < 24; i++) hours.push(`${i.toString().padStart(2, '0')}:00`)
    return hours
  }, [])

  const pabellonesMostrar = useMemo(() => pabellones.slice(0, 4), [pabellones])

  const getSlotStatus = useCallback((pabellonId, time) => {
    if (!formProgramacion.fecha) return { status: 'available' }
    const cirugia = cirugiasFecha.find(c =>
      c.operating_room_id === pabellonId &&
      c.hora_inicio <= time + ':00' &&
      c.hora_fin > time + ':00'
    )
    if (cirugia) return { status: 'occupied', data: cirugia }
    const bloqueo = bloqueosFecha.find(b =>
      b.operating_room_id === pabellonId &&
      b.hora_inicio <= time + ':00' &&
      b.hora_fin > time + ':00'
    )
    if (bloqueo) return { status: 'blocked', data: bloqueo }
    return { status: 'available' }
  }, [formProgramacion.fecha, cirugiasFecha, bloqueosFecha])

  // ── Notificar reagendamiento ───────────────────────────────
  const notificarDoctorPorReagendamiento = useCallback(async (solicitud) => {
    const doctorUserId   = solicitud?.doctors?.user_id
    if (!doctorUserId) return
    const nombrePaciente = `${solicitud?.patients?.nombre || ''} ${solicitud?.patients?.apellido || ''}`.trim() || 'el paciente'
    const clinicaId      = await getMyClinicaId()
    const { error } = await createNotification({
      user_id:         doctorUserId,
      tipo:            'solicitud_reagendamiento',
      titulo:          'Pabellón reagendará la cirugía',
      mensaje:         `Pabellón no pudo aceptar el horario propuesto para ${nombrePaciente}. Se iniciará el proceso de reagendamiento.`,
      relacionado_con: solicitud.id,
      clinica_id:      clinicaId,
    })
    if (error) throw error
    emailReagendamiento(solicitud)
  }, [])

  // ── Mutations ──────────────────────────────────────────────
  const rechazarSolicitud = useMutation({
    mutationFn: (id) => rejectSolicitud(id).then(({ error }) => { if (error) throw error }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      showSuccess('Solicitud rechazada')
      if (solicitudARechazar) {
        emailSolicitudRechazada(solicitudARechazar)
        createNotification({
          user_id: solicitudARechazar.doctors?.user_id,
          title:   'Solicitud rechazada',
          message: `Su solicitud para ${solicitudARechazar.patients?.nombre} ${solicitudARechazar.patients?.apellido} fue rechazada por pabellón.`,
          type:    'solicitud_rechazada',
        })
        notifyDoctorSolicitudRechazada({
          telefono:       solicitudARechazar.doctors?.telefono,
          nombreDoctor:   `${solicitudARechazar.doctors?.nombre ?? ''} ${solicitudARechazar.doctors?.apellido ?? ''}`.trim(),
          nombrePaciente: `${solicitudARechazar.patients?.nombre ?? ''} ${solicitudARechazar.patients?.apellido ?? ''}`.trim(),
          procedimiento:  solicitudARechazar.procedimiento,
        })
      }
      setShowConfirmRechazar(false)
      setSolicitudARechazar(null)
    },
    onError: (error) => {
      const msg = error.message || error.toString() || 'Error desconocido'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
      } else {
        showError('Error al rechazar la solicitud: ' + msg)
      }
    },
  })

  const programarCirugia = useMutation({
    mutationFn: async ({ solicitudId, formData }) => {
      const norm = (h) => h.includes(':') && h.length === 5 ? `${h}:00` : h
      const { data, error } = await scheduleSurgery({
        surgeryRequestId: solicitudId,
        operatingRoomId:  formData.operating_room_id,
        fecha:            formData.fecha,
        horaInicio:       norm(formData.hora_inicio),
        horaFin:          norm(formData.hora_fin),
        observaciones:    formData.observaciones || null,
      })
      if (error) { logger.errorWithContext('Error al programar cirugía', error); throw error }
      if (!data?.success) throw new Error(data?.message || 'Error desconocido al programar la cirugía')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      queryClient.invalidateQueries({ queryKey: ['solicitudes-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-hoy'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-calendario'] })
      if (solicitudProgramando) {
        const pabNombre = pabellones.find(p => p.id === formProgramacion.operating_room_id)?.nombre ?? '—'
        emailCirugiaProgramada(solicitudProgramando, formProgramacion, pabNombre)
        createNotification({
          user_id: solicitudProgramando.doctors?.user_id,
          titulo:  'Cirugía programada',
          mensaje: `Su cirugía para ${solicitudProgramando.patients?.nombre} ${solicitudProgramando.patients?.apellido} fue programada el ${formProgramacion.fecha} a las ${formProgramacion.hora_inicio}.`,
          tipo:    'cirugia_programada',
        })
        notifyDoctorCirugiaProgramada({
          telefono:       solicitudProgramando.doctors?.telefono,
          nombreDoctor:   `${solicitudProgramando.doctors?.nombre ?? ''} ${solicitudProgramando.doctors?.apellido ?? ''}`.trim(),
          nombrePaciente: `${solicitudProgramando.patients?.nombre ?? ''} ${solicitudProgramando.patients?.apellido ?? ''}`.trim(),
          procedimiento:  solicitudProgramando.procedimiento,
          fecha:          formProgramacion.fecha,
          hora:           formProgramacion.hora_inicio,
          sala:           pabNombre,
        })
      }
      try {
        const hl = sessionStorage.getItem('highlight_slot')
        if (hl) {
          const parsed = safeParseJSON(hl)
          if (parsed) navigate('/pabellon/calendario', { state: { highlight: parsed } })
        }
      } catch {}
      resetForm()
      sessionStorage.removeItem('highlight_slot')
    },
    onError: (error) => {
      logger.errorWithContext('Error al programar cirugía (onError)', error)
      const msg = error.message || error.toString() || 'Error desconocido'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
      } else if (msg.includes('solapamiento') || msg.includes('overlap')) {
        showError('Ya existe una cirugía programada en este horario. Por favor, seleccione otro horario.')
      } else if (msg.includes('bloqueado') || msg.includes('blocked')) {
        showError('El horario seleccionado está bloqueado por convenio')
      } else if (msg.includes('fecha pasada')) {
        showError('No se puede agendar una cirugía en una fecha pasada')
      } else {
        showError(msg)
      }
    },
  })

  const programarConHorarioDelMedico = useMutation({
    mutationFn: async ({ solicitudId, fecha, operatingRoomId, horaInicio, horaFin }) => {
      const norm = (hora) => {
        if (!hora) return null
        return typeof hora === 'string' ? (hora.length === 5 ? `${hora}:00` : hora) : hora
      }
      const horaInicioNorm = norm(horaInicio)
      let horaFinNorm      = norm(horaFin)
      if (!horaFinNorm && horaInicioNorm) {
        const [h, m, s] = horaInicioNorm.split(':').map(Number)
        const base = new Date()
        base.setHours(h, m ?? 0, s ?? 0, 0)
        base.setHours(base.getHours() + 1)
        horaFinNorm = `${String(base.getHours()).padStart(2, '0')}:${String(base.getMinutes()).padStart(2, '0')}:00`
      }
      const { data, error } = await scheduleSurgery({
        surgeryRequestId: solicitudId,
        operatingRoomId,
        fecha,
        horaInicio: horaInicioNorm,
        horaFin:    horaFinNorm,
        observaciones: null,
      })
      if (error) { logger.errorWithContext('Error al programar con horario del médico', error); throw error }
      if (!data?.success) throw new Error(data?.message || 'Error desconocido al programar la cirugía con el horario del médico')
      return data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      queryClient.invalidateQueries({ queryKey: ['solicitudes-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-hoy'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-calendario'] })
      if (solicitudAceptandoHorario) {
        const pabNombre = pabellones.find(p => p.id === vars.operatingRoomId)?.nombre ?? '—'
        emailCirugiaProgramada(
          solicitudAceptandoHorario,
          { fecha: vars.fecha, hora_inicio: vars.horaInicio, hora_fin: vars.horaFin },
          pabNombre,
        )
        createNotification({
          user_id: solicitudAceptandoHorario.doctors?.user_id,
          titulo:  'Cirugía programada',
          mensaje: `Pabellón aceptó su horario propuesto para ${solicitudAceptandoHorario.patients?.nombre} ${solicitudAceptandoHorario.patients?.apellido}. Fecha: ${vars.fecha}.`,
          tipo:    'cirugia_programada',
        })
        notifyDoctorCirugiaProgramada({
          telefono:       solicitudAceptandoHorario.doctors?.telefono,
          nombreDoctor:   `${solicitudAceptandoHorario.doctors?.nombre ?? ''} ${solicitudAceptandoHorario.doctors?.apellido ?? ''}`.trim(),
          nombrePaciente: `${solicitudAceptandoHorario.patients?.nombre ?? ''} ${solicitudAceptandoHorario.patients?.apellido ?? ''}`.trim(),
          procedimiento:  solicitudAceptandoHorario.procedimiento,
          fecha:          vars.fecha,
          hora:           vars.horaInicio,
          sala:           pabNombre,
        })
      }
      setSolicitudAceptandoHorario(null)
      showSuccess('Horario del médico aceptado y cirugía programada')
    },
    onError: (error) => {
      logger.errorWithContext('Error al aceptar horario del médico', error)
      const msg = error.message || error.toString() || 'Error desconocido'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
      } else if (msg.includes('solapamiento') || msg.includes('overlap')) {
        showError('Ya existe una cirugía programada en este horario. Por favor, seleccione otro horario.')
      } else if (msg.includes('bloqueado') || msg.includes('blocked')) {
        showError('El horario seleccionado está bloqueado por convenio')
      } else if (msg.includes('fecha pasada')) {
        showError('No se puede agendar una cirugía en una fecha pasada')
      } else {
        showError(msg)
      }
    },
  })

  const reagendarConHorarioDelMedico = useMutation({
    mutationFn: async ({ solicitudId, fecha, operatingRoomId, horaInicio, horaFin }) => {
      const norm = (hora) => {
        if (!hora) return null
        return typeof hora === 'string' ? (hora.length === 5 ? `${hora}:00` : hora) : hora
      }
      const horaInicioNorm = norm(horaInicio)
      let horaFinNorm      = norm(horaFin)
      if (!horaFinNorm && horaInicioNorm) {
        const [h, m, s] = horaInicioNorm.split(':').map(Number)
        const base = new Date()
        base.setHours(h, m ?? 0, s ?? 0, 0)
        base.setHours(base.getHours() + 1)
        horaFinNorm = `${String(base.getHours()).padStart(2, '0')}:${String(base.getMinutes()).padStart(2, '0')}:00`
      }
      const { data: cirugia, error: cirugiaError } = await fetchSurgeryByRequestId(solicitudId)
      if (cirugiaError) throw cirugiaError
      if (!cirugia?.id) throw new Error('No hay cirugía programada para esta solicitud.')
      const { error } = await rescheduleSurgery(cirugia.id, {
        fecha,
        horaInicio: horaInicioNorm,
        horaFin:    horaFinNorm,
        operatingRoomId,
      })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      queryClient.invalidateQueries({ queryKey: ['solicitudes-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-hoy'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-calendario'] })
      queryClient.invalidateQueries({ queryKey: ['calendario-anual-cirugias'] })
      if (solicitudAceptandoHorario) {
        const pabNombre = pabellones.find(p => p.id === vars.operatingRoomId)?.nombre ?? '—'
        emailCirugiaProgramada(
          solicitudAceptandoHorario,
          { fecha: vars.fecha, hora_inicio: vars.horaInicio, hora_fin: vars.horaFin },
          pabNombre,
        )
        createNotification({
          user_id: solicitudAceptandoHorario.doctors?.user_id,
          titulo:  'Cirugía reagendada',
          mensaje: `Su cirugía para ${solicitudAceptandoHorario.patients?.nombre} ${solicitudAceptandoHorario.patients?.apellido} fue reagendada para el ${vars.fecha}.`,
          tipo:    'cirugia_programada',
        })
        notifyDoctorReagendamiento({
          telefono:       solicitudAceptandoHorario.doctors?.telefono,
          nombreDoctor:   `${solicitudAceptandoHorario.doctors?.nombre ?? ''} ${solicitudAceptandoHorario.doctors?.apellido ?? ''}`.trim(),
          nombrePaciente: `${solicitudAceptandoHorario.patients?.nombre ?? ''} ${solicitudAceptandoHorario.patients?.apellido ?? ''}`.trim(),
          procedimiento:  solicitudAceptandoHorario.procedimiento,
        })
      }
      setSolicitudAceptandoHorario(null)
      showSuccess('Horario del médico aceptado y cirugía reagendada')
    },
    onError: (error) => {
      logger.errorWithContext('Error al reagendar con horario del médico', error)
      const msg = error.message || error.toString() || 'Error desconocido'
      if (msg.includes('solapamiento') || msg.includes('overlap') || msg.includes('Ya existe')) {
        showError('Ya existe una cirugía en ese horario. Elija otro horario.')
      } else if (msg.includes('bloqueado') || msg.includes('blocked')) {
        showError('El horario está bloqueado.')
      } else {
        showError('Error al aceptar el horario del médico: ' + msg)
      }
    },
  })

  // ── Handlers ───────────────────────────────────────────────
  const obtenerHorarioPreferido = useCallback((solicitud) => {
    if (!solicitud || solicitud.dejar_fecha_a_pabellon) return null
    if (solicitud.fecha_preferida && solicitud.hora_recomendada && solicitud.operating_room_id_preferido) {
      return {
        fecha:           solicitud.fecha_preferida,
        horaInicio:      solicitud.hora_recomendada,
        horaFin:         solicitud.hora_fin_recomendada || null,
        operatingRoomId: solicitud.operating_room_id_preferido,
      }
    }
    if (solicitud.fecha_preferida_2 && solicitud.hora_recomendada_2 && solicitud.operating_room_id_preferido_2) {
      return {
        fecha:           solicitud.fecha_preferida_2,
        horaInicio:      solicitud.hora_recomendada_2,
        horaFin:         solicitud.hora_fin_recomendada_2 || null,
        operatingRoomId: solicitud.operating_room_id_preferido_2,
      }
    }
    const extras = Array.isArray(solicitud.horarios_preferidos_extra) ? solicitud.horarios_preferidos_extra : []
    const extra  = extras.find(h => h?.fecha_preferida && h?.hora_recomendada && h?.operating_room_id)
    if (extra) {
      return {
        fecha:           extra.fecha_preferida,
        horaInicio:      extra.hora_recomendada,
        horaFin:         extra.hora_fin_recomendada || null,
        operatingRoomId: extra.operating_room_id,
      }
    }
    return null
  }, [])

  const tieneHorarioPreferido = useCallback((solicitud) => Boolean(obtenerHorarioPreferido(solicitud)), [obtenerHorarioPreferido])

  const handleAceptarHorarioMedico = useCallback((solicitud) => {
    const horario = obtenerHorarioPreferido(solicitud)
    if (!horario) { showError('La solicitud no tiene un horario preferido válido para aceptar.'); return }
    setSolicitudProgramando(solicitud)
    setFormProgramacion({
      fecha:             typeof horario.fecha === 'string' ? horario.fecha.slice(0, 10) : new Date(horario.fecha).toISOString().slice(0, 10),
      hora_inicio:       '',
      hora_fin:          '',
      operating_room_id: '',
      observaciones:     '',
    })
  }, [obtenerHorarioPreferido, showError])

  const handleAceptarYProgramar = useCallback((solicitud) => {
    try {
      if (!solicitud) { showError('No se pudo abrir la gestión de cupos: solicitud inválida.'); return }
      sessionStorage.setItem('solicitud_gestionando', JSON.stringify(solicitud))
      setSolicitudProgramando(solicitud)
      setFormProgramacion({ fecha: '', hora_inicio: '', hora_fin: '', operating_room_id: '', observaciones: '' })
    } catch (e) {
      logger.errorWithContext('Error al abrir gestión de cupos directamente', e)
      showError('Ocurrió un error al abrir la gestión de cupos.')
    }
  }, [showError])

  const handleEnviarAvisoReagendacion = useCallback(async (solicitud) => {
    try {
      await notificarDoctorPorReagendamiento(solicitud)
      showSuccess('Aviso de reagendación enviado al médico.')
    } catch (error) {
      logger.errorWithContext('Error al enviar aviso de reagendación', error)
      showError('No se pudo enviar el aviso: ' + (error.message || error.toString() || 'Error desconocido'))
    }
  }, [notificarDoctorPorReagendamiento, showSuccess, showError])

  const handleGestionarHora = useCallback((solicitud) => {
    try {
      if (!solicitud) { showError('No se pudo abrir el calendario: solicitud inválida.'); return }
      sessionStorage.setItem('solicitud_gestionando', JSON.stringify(solicitud))
      navigate('/pabellon/calendario', { state: { fromGestionHora: true, initialView: 'month' } })
    } catch (e) {
      logger.errorWithContext('Error al abrir calendario (gestionar hora)', e)
      showError('Ocurrió un error al abrir el calendario.')
    }
  }, [navigate, showError])

  const handleReagendar = useCallback(async (solicitud) => {
    try {
      await notificarDoctorPorReagendamiento(solicitud)
    } catch (error) {
      logger.errorWithContext('Error al notificar al doctor sobre reagendamiento', error)
      showError('No se pudo notificar al doctor: ' + (error.message || error.toString() || 'Error desconocido'))
    }
    sessionStorage.setItem('reagendar_solicitud_id', solicitud.id)
    navigate('/pabellon/calendario', { state: { reagendar: true, surgeryRequestId: solicitud.id } })
  }, [notificarDoctorPorReagendamiento, navigate, showError])

  return {
    // state
    filtroEstado, setFiltroEstado,
    busqueda, setBusqueda: (v) => setBusqueda(sanitizeString(v)),
    filtroDoctor, setFiltroDoctor: (v) => setFiltroDoctor(sanitizeString(v)),
    filtroCodigoOperacion, setFiltroCodigoOperacion: (v) => setFiltroCodigoOperacion(sanitizeString(v)),
    solicitudProgramando, setSolicitudProgramando,
    solicitudDetalle, setSolicitudDetalle,
    solicitudAceptandoHorario, setSolicitudAceptandoHorario,
    showConfirmRechazar, setShowConfirmRechazar,
    solicitudARechazar, setSolicitudARechazar,
    seleccionBloques, setSeleccionBloques,
    formProgramacion, setFormProgramacion,
    resetForm,
    // data
    solicitudes, isLoading,
    pabellones, pabellonesMostrar,
    solicitudesFiltradas,
    doctoresUnicos, codigosUnicos,
    slotsHorarios,
    // computed
    getSlotStatus, tieneHorarioPreferido,
    areContiguous, sortTimesAsc, timeToMinutes,
    // mutations
    rechazarSolicitud, programarCirugia,
    programarConHorarioDelMedico, reagendarConHorarioDelMedico,
    // handlers
    handleAceptarHorarioMedico, handleAceptarYProgramar,
    handleEnviarAvisoReagendacion, handleGestionarHora, handleReagendar,
    showError,
  }
}
