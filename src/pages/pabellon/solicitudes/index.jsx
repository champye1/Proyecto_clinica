import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { getMyClinicaId } from '@/utils/getClinicaId'
import { FileText, Search } from 'lucide-react'
import { format } from 'date-fns'
import { codigosOperaciones } from '@/data/codigosOperaciones'
import { useNotifications } from '@/hooks/useNotifications'
import { useDebounce } from '@/hooks/useDebounce'
import { useTheme } from '@/contexts/ThemeContext'
import { sanitizeString, safeParseJSON } from '@/utils/sanitizeInput'
import { logger } from '@/utils/logger'
import Button from '@/components/common/Button'
import EmptyState from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/Skeleton'
import Modal from '@/components/common/Modal'
import { motion } from 'framer-motion'
import { emailSolicitudRechazada, emailCirugiaProgramada, emailReagendamiento } from '@/services/emailService'
import { createNotification } from '@/services/notificationService'
import { notifyDoctorSolicitudRechazada, notifyDoctorCirugiaProgramada, notifyDoctorReagendamiento } from '@/services/whatsappService'
import { STYLES } from './solicitudes.styles'
import SolicitudCard from './SolicitudCard'
import DetalleModal from './DetalleModal'
import ProgramacionModal from './ProgramacionModal'

export default function Solicitudes() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotifications()

  const [filtroEstado,           setFiltroEstado]           = useState('todas')
  const [busqueda,               setBusqueda]               = useState('')
  const [filtroDoctor,           setFiltroDoctor]           = useState('todos')
  const [filtroCodigoOperacion,  setFiltroCodigoOperacion]  = useState('todos')
  const debouncedBusqueda = useDebounce(busqueda, 300)

  const [solicitudProgramando,       setSolicitudProgramando]       = useState(null)
  const [solicitudDetalle,           setSolicitudDetalle]           = useState(null)
  const [solicitudAceptandoHorario,  setSolicitudAceptandoHorario]  = useState(null)
  const [showConfirmRechazar,        setShowConfirmRechazar]        = useState(false)
  const [solicitudARechazar,         setSolicitudARechazar]         = useState(null)
  const [seleccionBloques,           setSeleccionBloques]           = useState({ pabellonId: null, times: [] })

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

  // Restore slot selected from calendar
  useEffect(() => {
    try {
      const slotStr     = sessionStorage.getItem('slot_seleccionado')
      const solicitudStr = sessionStorage.getItem('solicitud_gestionando')
      if (slotStr && solicitudStr) {
        const slot     = safeParseJSON(slotStr)
        const solicitud = safeParseJSON(solicitudStr)
        if (!slot?.date || !slot?.time || !slot?.pabellonId || !solicitud?.id) {
          logger.warn('Slot o solicitud con estructura inválida en sessionStorage')
          sessionStorage.removeItem('slot_seleccionado')
          sessionStorage.removeItem('solicitud_gestionando')
          return
        }
        setSolicitudProgramando(solicitud)
        setFormProgramacion({
          fecha:              format(new Date(slot.date), 'yyyy-MM-dd'),
          hora_inicio:        slot.time,
          hora_fin:           '',
          operating_room_id:  slot.pabellonId,
          observaciones:      '',
        })
        sessionStorage.removeItem('slot_seleccionado')
      }
    } catch (e) {
      logger.errorWithContext('Error al procesar slot seleccionado', e)
    }
  }, [])

  const location = useLocation()
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

  const queryClient = useQueryClient()

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['solicitudes', filtroEstado],
    queryFn: async () => {
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
      if (filtroEstado !== 'todas') query = query.eq('estado', filtroEstado)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

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
        const q = debouncedBusqueda.toLowerCase()
        const nombre  = `${s.patients?.nombre || ''} ${s.patients?.apellido || ''}`.toLowerCase()
        const rut     = (s.patients?.rut || '').toLowerCase()
        const doctor  = `${s.doctors?.nombre || ''} ${s.doctors?.apellido || ''}`.toLowerCase()
        const codigo  = (s.codigo_operacion || '').toLowerCase()
        if (!nombre.includes(q) && !rut.includes(q) && !doctor.includes(q) && !codigo.includes(q)) return false
      }
      return true
    })
  }, [solicitudes, filtroEstado, filtroDoctor, filtroCodigoOperacion, debouncedBusqueda])

  const { data: pabellones = [] } = useQuery({
    queryKey: ['pabellones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operating_rooms')
        .select('id, nombre')
        .eq('activo', true)
        .is('deleted_at', null)
        .order('nombre')
      if (error) throw error
      return data
    },
  })

  const { data: cirugiasFecha = [] } = useQuery({
    queryKey: ['cirugias-fecha', formProgramacion.fecha],
    queryFn: async () => {
      if (!formProgramacion.fecha) return []
      const { data, error } = await supabase
        .from('surgeries')
        .select('id, operating_room_id, hora_inicio, hora_fin, doctors:doctor_id(nombre, apellido)')
        .eq('fecha', formProgramacion.fecha)
        .is('deleted_at', null)
        .in('estado', ['programada', 'en_proceso'])
      if (error) throw error
      return data || []
    },
    enabled: !!formProgramacion.fecha,
  })

  const { data: bloqueosFecha = [] } = useQuery({
    queryKey: ['bloqueos-fecha', formProgramacion.fecha],
    queryFn: async () => {
      if (!formProgramacion.fecha) return []
      const { data, error } = await supabase
        .from('schedule_blocks')
        .select('id, operating_room_id, hora_inicio, hora_fin, vigencia_hasta')
        .eq('fecha', formProgramacion.fecha)
        .is('deleted_at', null)
      if (error) throw error
      return (data || []).filter(b => !b.vigencia_hasta || b.vigencia_hasta >= formProgramacion.fecha)
    },
    enabled: !!formProgramacion.fecha,
  })

  const slotsHorarios = useMemo(() => {
    const hours = []
    for (let i = 8; i < 24; i++) hours.push(`${i.toString().padStart(2, '0')}:00`)
    return hours
  }, [])

  const pabellonesMostrar = useMemo(() => pabellones.slice(0, 4), [pabellones])

  const getSlotStatus = (pabellonId, time) => {
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
  }

  const rechazarSolicitud = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('surgery_requests')
        .update({ estado: 'rechazada', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
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
      const normalizar = (h) => h.includes(':') && h.length === 5 ? `${h}:00` : h
      const { data, error } = await supabase.rpc('programar_cirugia_completa', {
        p_surgery_request_id: solicitudId,
        p_operating_room_id:  formData.operating_room_id,
        p_fecha:              formData.fecha,
        p_hora_inicio:        normalizar(formData.hora_inicio),
        p_hora_fin:           normalizar(formData.hora_fin),
        p_observaciones:      formData.observaciones || null,
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
          title:   'Cirugía programada',
          message: `Su cirugía para ${solicitudProgramando.patients?.nombre} ${solicitudProgramando.patients?.apellido} fue programada el ${formProgramacion.fecha} a las ${formProgramacion.hora_inicio}.`,
          type:    'cirugia_programada',
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
      const { data, error } = await supabase.rpc('programar_cirugia_completa', {
        p_surgery_request_id: solicitudId,
        p_operating_room_id:  operatingRoomId,
        p_fecha:              fecha,
        p_hora_inicio:        horaInicioNorm,
        p_hora_fin:           horaFinNorm,
        p_observaciones:      null,
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
          title:   'Cirugía programada',
          message: `Pabellón aceptó su horario propuesto para ${solicitudAceptandoHorario.patients?.nombre} ${solicitudAceptandoHorario.patients?.apellido}. Fecha: ${vars.fecha}.`,
          type:    'cirugia_programada',
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
      const { data: cirugia, error: cirugiaError } = await supabase
        .from('surgeries')
        .select('id')
        .eq('surgery_request_id', solicitudId)
        .is('deleted_at', null)
        .maybeSingle()
      if (cirugiaError) throw cirugiaError
      if (!cirugia?.id) throw new Error('No hay cirugía programada para esta solicitud.')
      const { error: updateError } = await supabase
        .from('surgeries')
        .update({ fecha, hora_inicio: horaInicioNorm, hora_fin: horaFinNorm, operating_room_id: operatingRoomId, updated_at: new Date().toISOString() })
        .eq('id', cirugia.id)
      if (updateError) throw updateError
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
          title:   'Cirugía reagendada',
          message: `Su cirugía para ${solicitudAceptandoHorario.patients?.nombre} ${solicitudAceptandoHorario.patients?.apellido} fue reagendada para el ${vars.fecha}.`,
          type:    'cirugia_programada',
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

  const obtenerHorarioPreferido = (solicitud) => {
    if (!solicitud || solicitud.dejar_fecha_a_pabellon) return null
    if (solicitud.fecha_preferida && solicitud.hora_recomendada && solicitud.operating_room_id_preferido) {
      return {
        fecha:            solicitud.fecha_preferida,
        horaInicio:       solicitud.hora_recomendada,
        horaFin:          solicitud.hora_fin_recomendada || null,
        operatingRoomId:  solicitud.operating_room_id_preferido,
      }
    }
    if (solicitud.fecha_preferida_2 && solicitud.hora_recomendada_2 && solicitud.operating_room_id_preferido_2) {
      return {
        fecha:            solicitud.fecha_preferida_2,
        horaInicio:       solicitud.hora_recomendada_2,
        horaFin:          solicitud.hora_fin_recomendada_2 || null,
        operatingRoomId:  solicitud.operating_room_id_preferido_2,
      }
    }
    const extras = Array.isArray(solicitud.horarios_preferidos_extra) ? solicitud.horarios_preferidos_extra : []
    const extra  = extras.find(h => h?.fecha_preferida && h?.hora_recomendada && h?.operating_room_id)
    if (extra) {
      return {
        fecha:            extra.fecha_preferida,
        horaInicio:       extra.hora_recomendada,
        horaFin:          extra.hora_fin_recomendada || null,
        operatingRoomId:  extra.operating_room_id,
      }
    }
    return null
  }

  const tieneHorarioPreferido = (solicitud) => Boolean(obtenerHorarioPreferido(solicitud))

  const handleAceptarHorarioMedico = (solicitud) => {
    const horario = obtenerHorarioPreferido(solicitud)
    if (!horario) { showError('La solicitud no tiene un horario preferido válido para aceptar.'); return }
    setSolicitudProgramando(solicitud)
    setFormProgramacion({
      fecha: typeof horario.fecha === 'string' ? horario.fecha.slice(0, 10) : new Date(horario.fecha).toISOString().slice(0, 10),
      hora_inicio: '', hora_fin: '', operating_room_id: '', observaciones: '',
    })
  }

  const handleAceptarYProgramar = (solicitud) => {
    try {
      if (!solicitud) { showError('No se pudo abrir la gestión de cupos: solicitud inválida.'); return }
      sessionStorage.setItem('solicitud_gestionando', JSON.stringify(solicitud))
      setSolicitudProgramando(solicitud)
      setFormProgramacion({ fecha: '', hora_inicio: '', hora_fin: '', operating_room_id: '', observaciones: '' })
    } catch (e) {
      logger.errorWithContext('Error al abrir gestión de cupos directamente', e)
      showError('Ocurrió un error al abrir la gestión de cupos.')
    }
  }

  const handleEnviarAvisoReagendacion = async (solicitud) => {
    try {
      await notificarDoctorPorReagendamiento(solicitud)
      showSuccess('Aviso de reagendación enviado al médico.')
    } catch (error) {
      logger.errorWithContext('Error al enviar aviso de reagendación', error)
      showError('No se pudo enviar el aviso: ' + (error.message || error.toString() || 'Error desconocido'))
    }
  }

  const handleGestionarHora = (solicitud) => {
    try {
      if (!solicitud) { showError('No se pudo abrir el calendario: solicitud inválida.'); return }
      sessionStorage.setItem('solicitud_gestionando', JSON.stringify(solicitud))
      navigate('/pabellon/calendario', { state: { fromGestionHora: true, initialView: 'month' } })
    } catch (e) {
      logger.errorWithContext('Error al abrir calendario (gestionar hora)', e)
      showError('Ocurrió un error al abrir el calendario.')
    }
  }

  const notificarDoctorPorReagendamiento = async (solicitud) => {
    const doctorUserId = solicitud?.doctors?.user_id
    if (!doctorUserId) return
    const nombrePaciente = `${solicitud?.patients?.nombre || ''} ${solicitud?.patients?.apellido || ''}`.trim() || 'el paciente'
    const mensaje = `Pabellón no pudo aceptar el horario propuesto para ${nombrePaciente}. Se iniciará el proceso de reagendamiento.`
    const clinicaId = await getMyClinicaId()
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id:         doctorUserId,
        tipo:            'solicitud_reagendamiento',
        titulo:          'Pabellón reagendará la cirugía',
        mensaje,
        relacionado_con: solicitud.id,
        clinica_id:      clinicaId,
      })
    if (error) throw error
    emailReagendamiento(solicitud)
  }

  const handleReagendar = async (solicitud) => {
    try {
      await notificarDoctorPorReagendamiento(solicitud)
    } catch (error) {
      logger.errorWithContext('Error al notificar al doctor sobre reagendamiento', error)
      showError('No se pudo notificar al doctor: ' + (error.message || error.toString() || 'Error desconocido'))
    }
    sessionStorage.setItem('reagendar_solicitud_id', solicitud.id)
    navigate('/pabellon/calendario', { state: { reagendar: true, surgeryRequestId: solicitud.id } })
  }

  const getEstadoBadge = (estado) => ({
    pendiente: 'bg-yellow-100 text-yellow-800',
    aceptada:  'bg-green-100 text-green-800',
    rechazada: 'bg-red-100 text-red-800',
    cancelada: 'bg-gray-100 text-gray-800',
  }[estado] || 'bg-yellow-100 text-yellow-800')

  const getPriorityColor = (solicitud) => {
    if (solicitud.prioridad === 'alta' || solicitud.prioridad === 'Alta') return 'bg-red-500'
    if (solicitud.estado === 'pendiente' && solicitud.urgencia === 'alta') return 'bg-red-500'
    return 'bg-blue-500'
  }

  const getPriorityBadge = (solicitud) => {
    if (solicitud.prioridad === 'alta' || solicitud.prioridad === 'Alta')
      return { text: 'PRIORIDAD ALTA', bg: 'bg-red-500', textColor: 'text-white' }
    if (solicitud.estado === 'pendiente' && solicitud.urgencia === 'alta')
      return { text: 'PRIORIDAD ALTA', bg: 'bg-red-500', textColor: 'text-white' }
    return { text: 'PRIORIDAD MEDIA', bg: 'bg-blue-500', textColor: 'text-white' }
  }

  const getInitial      = (nombre) => nombre?.charAt(0).toUpperCase() || '?'
  const getProcedureName = (codigo) => codigosOperaciones.find(c => c.codigo === codigo)?.nombre || codigo

  if (isLoading) return <TableSkeleton rows={6} />

  const isDark    = theme === 'dark'
  const isMedical = theme === 'medical'
  const filterInputClass  = isDark ? STYLES.searchInputDark  : isMedical ? STYLES.searchInputMedical  : STYLES.searchInputLight
  const filterSelectClass = isDark ? STYLES.filterSelectDark : isMedical ? STYLES.filterSelectMedical : STYLES.filterSelectLight

  return (
    <div className={STYLES.page}>
      <div className={STYLES.header}>
        <h2 className={isDark ? STYLES.titleDark : STYLES.titleLight}>BANDEJA DE SOLICITUDES</h2>
        <p className={STYLES.subtitle}>MÉDICOS PENDIENTES DE AGENDAMIENTO</p>
      </div>

      <div className={STYLES.filtersSection}>
        <div className={STYLES.searchWrap}>
          <Search className={isDark ? STYLES.searchIconDark : STYLES.searchIconLight} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(sanitizeString(e.target.value))}
            placeholder="Buscar por paciente, RUT, doctor o código..."
            className={filterInputClass}
          />
        </div>
        <div className={STYLES.filtersGrid}>
          <div>
            <label className={isDark ? STYLES.filterLabelDark : STYLES.filterLabelLight}>Filtro por Doctor</label>
            <select value={filtroDoctor} onChange={(e) => setFiltroDoctor(sanitizeString(e.target.value))} className={filterSelectClass}>
              <option value="todos">Todos los doctores</option>
              {doctoresUnicos.map(doctor => (
                <option key={doctor.id} value={doctor.id}>Dr. {doctor.nombre} {doctor.apellido}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={isDark ? STYLES.filterLabelDark : STYLES.filterLabelLight}>Filtro por Código de Operación</label>
            <select value={filtroCodigoOperacion} onChange={(e) => setFiltroCodigoOperacion(sanitizeString(e.target.value))} className={filterSelectClass}>
              <option value="todos">Todos los códigos</option>
              {codigosUnicos.map(codigo => {
                const obj = codigosOperaciones.find(c => c.codigo === codigo)
                return <option key={codigo} value={codigo}>{codigo} - {obj?.nombre || codigo}</option>
              })}
            </select>
          </div>
          <div>
            <label className={isDark ? STYLES.filterLabelDark : STYLES.filterLabelLight}>Filtro por Estado</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(sanitizeString(e.target.value))} className={filterSelectClass}>
              <option value="todas">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="aceptada">Aceptadas</option>
              <option value="rechazada">Rechazadas</option>
            </select>
          </div>
        </div>
        {(busqueda || filtroDoctor !== 'todos' || filtroCodigoOperacion !== 'todos' || filtroEstado !== 'todas') && (
          <div className={isDark ? STYLES.counterDark : STYLES.counterLight}>
            Mostrando {solicitudesFiltradas.length} de {solicitudes.length} solicitudes
          </div>
        )}
      </div>

      <div className={STYLES.chips}>
        {[
          { value: 'todas',    label: 'Todas',      count: solicitudes.length },
          { value: 'pendiente', label: 'Pendientes', count: solicitudes.filter(s => s.estado === 'pendiente').length },
          { value: 'aceptada',  label: 'Aceptadas',  count: solicitudes.filter(s => s.estado === 'aceptada').length },
        ].map((filtro) => (
          <motion.button
            key={filtro.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFiltroEstado(filtro.value)}
            className={filtroEstado === filtro.value ? STYLES.chipActive : STYLES.chipInactive}
          >
            <span>{filtro.label}</span>
            <span className={filtroEstado === filtro.value ? STYLES.chipCountActive : STYLES.chipCountInactive}>
              {filtro.count}
            </span>
          </motion.button>
        ))}
      </div>

      <div className={STYLES.cardsGrid}>
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : solicitudesFiltradas.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No hay solicitudes"
            description={filtroEstado === 'todas'
              ? 'No se encontraron solicitudes en el sistema'
              : `No hay solicitudes con estado "${filtroEstado}"`
            }
          />
        ) : (
          solicitudesFiltradas.map((solicitud) => (
            <SolicitudCard
              key={solicitud.id}
              solicitud={solicitud}
              isDark={isDark}
              isMedical={isMedical}
              onVerDetalle={setSolicitudDetalle}
              onAceptarHorario={handleAceptarHorarioMedico}
              onAvisoReagendacion={handleEnviarAvisoReagendacion}
              onAceptarYProgramar={handleAceptarYProgramar}
              onGestionarHora={handleGestionarHora}
              onReagendar={handleReagendar}
              tieneHorarioPreferido={tieneHorarioPreferido}
              getPriorityColor={getPriorityColor}
              getPriorityBadge={getPriorityBadge}
              getInitial={getInitial}
              getProcedureName={getProcedureName}
              programarConHorarioDelMedico={programarConHorarioDelMedico}
              reagendarConHorarioDelMedico={reagendarConHorarioDelMedico}
              solicitudAceptandoHorario={solicitudAceptandoHorario}
            />
          ))
        )}
      </div>

      {solicitudDetalle && (
        <DetalleModal
          solicitudDetalle={solicitudDetalle}
          isDark={isDark}
          isMedical={isMedical}
          onClose={() => setSolicitudDetalle(null)}
          getEstadoBadge={getEstadoBadge}
        />
      )}

      {solicitudProgramando && (
        <ProgramacionModal
          solicitudProgramando={solicitudProgramando}
          onClose={resetForm}
          formProgramacion={formProgramacion}
          setFormProgramacion={setFormProgramacion}
          seleccionBloques={seleccionBloques}
          setSeleccionBloques={setSeleccionBloques}
          pabellonesMostrar={pabellonesMostrar}
          pabellones={pabellones}
          slotsHorarios={slotsHorarios}
          getSlotStatus={getSlotStatus}
          areContiguous={areContiguous}
          sortTimesAsc={sortTimesAsc}
          timeToMinutes={timeToMinutes}
          showError={showError}
          programarCirugia={programarCirugia}
        />
      )}

      <Modal
        isOpen={showConfirmRechazar}
        onClose={() => { setShowConfirmRechazar(false); setSolicitudARechazar(null) }}
        title="Confirmar Rechazo"
      >
        {solicitudARechazar && (
          <div className={STYLES.detailSections}>
            <p className={STYLES.textSl7}>
              ¿Está seguro de que desea rechazar la solicitud de{' '}
              <span className={STYLES.fontBlk}>
                {solicitudARechazar.patients?.nombre} {solicitudARechazar.patients?.apellido}
              </span>?
            </p>
            <p className={STYLES.textSmSl5}>Esta acción no se puede deshacer.</p>
            <div className={STYLES.flexGap4End}>
              <Button
                variant="secondary"
                onClick={() => { setShowConfirmRechazar(false); setSolicitudARechazar(null) }}
                disabled={rechazarSolicitud.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => solicitudARechazar && rechazarSolicitud.mutate(solicitudARechazar.id)}
                loading={rechazarSolicitud.isPending}
                disabled={rechazarSolicitud.isPending}
                className={STYLES.btnRed}
              >
                Confirmar Rechazo
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
