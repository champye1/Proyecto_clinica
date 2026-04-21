import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { getCurrentUser } from '@/services/authService'
import { useNotifications } from '@/hooks/useNotifications'
import { sanitizeString } from '@/utils/sanitizeInput'
import { HORAS_SELECT } from '@/utils/horasOpciones'
import ConfirmModal from '@/components/common/ConfirmModal'
import { useTheme } from '@/contexts/ThemeContext'
import BloqueoForm from './bloqueoHorario/BloqueoForm'
import BloqueoList from './bloqueoHorario/BloqueoList'

const HORAS_PARA_PREVIEW = HORAS_SELECT

const EMPTY_FORM = {
  doctor_id: '',
  operating_room_id: '',
  fecha: '',
  hora_inicio: '',
  hora_fin: '',
  motivo: '',
  dias_limite_vigencia: '',
}

export default function BloqueoHorario() {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [showConfirmEliminar, setShowConfirmEliminar] = useState(false)
  const [bloqueoAEliminar, setBloqueoAEliminar] = useState(null)
  const [bloqueoEditando, setBloqueoEditando] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { data: doctores = [] } = useQuery({
    queryKey: ['doctores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('doctors').select('id, nombre, apellido').eq('estado', 'activo').is('deleted_at', null)
      if (error) throw error
      return data
    },
  })

  const { data: pabellones = [] } = useQuery({
    queryKey: ['pabellones'],
    queryFn: async () => {
      const { data, error } = await supabase.from('operating_rooms').select('id, nombre').eq('activo', true).is('deleted_at', null)
      if (error) throw error
      return data
    },
  })

  const { data: bloqueos = [] } = useQuery({
    queryKey: ['bloqueos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_blocks')
        .select('*, doctors:doctor_id(nombre, apellido), operating_rooms:operating_room_id(nombre)')
        .is('deleted_at', null)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true })
      if (error) throw error
      return data
    },
  })

  const { data: cirugias = [] } = useQuery({
    queryKey: ['cirugias-validacion', formData.fecha, formData.operating_room_id],
    queryFn: async () => {
      if (!formData.fecha || !formData.operating_room_id) return []
      const { data, error } = await supabase
        .from('surgeries')
        .select('hora_inicio, hora_fin')
        .eq('fecha', formData.fecha)
        .eq('operating_room_id', formData.operating_room_id)
        .is('deleted_at', null)
        .in('estado', ['programada', 'en_proceso'])
      if (error) throw error
      return data || []
    },
    enabled: !!formData.fecha && !!formData.operating_room_id,
  })

  const estadoPorHora = useMemo(() => {
    if (!formData.fecha || !formData.operating_room_id) return {}
    const map = {}
    HORAS_PARA_PREVIEW.forEach(h => { map[h] = 'libre' })
    cirugias.forEach(c => {
      const hi = (c.hora_inicio || '').slice(0, 5)
      const hf = (c.hora_fin || '').slice(0, 5)
      HORAS_PARA_PREVIEW.forEach(h => { if (h >= hi && h < hf) map[h] = 'ocupado' })
    })
    bloqueos
      .filter(b => b.fecha === formData.fecha && b.operating_room_id === formData.operating_room_id && b.id !== bloqueoEditando?.id)
      .forEach(b => {
        const hi = (b.hora_inicio || '').slice(0, 5)
        const hf = (b.hora_fin || '').slice(0, 5)
        HORAS_PARA_PREVIEW.forEach(h => { if (h >= hi && h < hf) map[h] = 'bloqueado' })
      })
    return map
  }, [formData.fecha, formData.operating_room_id, cirugias, bloqueos, bloqueoEditando?.id])

  const crearBloqueo = useMutation({
    mutationFn: async (data) => {
      const { user } = await getCurrentUser()
      const { error } = await supabase.from('schedule_blocks').insert({ ...data, created_by: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloqueos'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-validacion'] })
      queryClient.invalidateQueries({ queryKey: ['calendario-anual-bloqueos'] })
      queryClient.invalidateQueries({ queryKey: ['ocupacion-hoy'] })
      setFormData(EMPTY_FORM)
      setBloqueoEditando(null)
      showSuccess('Bloqueo creado exitosamente')
    },
    onError: (error) => {
      const msg = error.message || error.toString() || 'Error desconocido'
      showError(msg.includes('Failed to fetch') ? 'Error de conexión.' : `Error al crear bloqueo: ${msg}`)
    },
  })

  const actualizarBloqueo = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from('schedule_blocks').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloqueos'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-validacion'] })
      queryClient.invalidateQueries({ queryKey: ['calendario-anual-bloqueos'] })
      queryClient.invalidateQueries({ queryKey: ['ocupacion-hoy'] })
      setFormData(EMPTY_FORM)
      setBloqueoEditando(null)
      showSuccess('Bloqueo actualizado exitosamente')
    },
    onError: (error) => {
      const msg = error.message || error.toString() || 'Error desconocido'
      showError(msg.includes('Failed to fetch') ? 'Error de conexión.' : `Error al actualizar bloqueo: ${msg}`)
    },
  })

  const eliminarBloqueo = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('schedule_blocks').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloqueos'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-validacion'] })
      queryClient.invalidateQueries({ queryKey: ['calendario-anual-bloqueos'] })
      queryClient.invalidateQueries({ queryKey: ['ocupacion-hoy'] })
      showSuccess('Bloqueo eliminado exitosamente')
    },
    onError: (error) => {
      const msg = error.message || error.toString() || 'Error desconocido'
      showError(msg.includes('Failed to fetch') ? 'Error de conexión.' : `Error al eliminar bloqueo: ${msg}`)
    },
  })

  const validarSolapamiento = async () => {
    if (!formData.fecha || !formData.operating_room_id || !formData.hora_inicio || !formData.hora_fin) return null
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const ini = toMin(formData.hora_inicio)
    const fin = toMin(formData.hora_fin)
    for (const c of cirugias) {
      if (ini < toMin(c.hora_fin) && fin > toMin(c.hora_inicio))
        return `El bloqueo se solapa con una cirugía programada (${c.hora_inicio} - ${c.hora_fin})`
    }
    for (const b of bloqueos.filter(b => b.id !== bloqueoEditando?.id && b.fecha === formData.fecha && b.operating_room_id === formData.operating_room_id)) {
      if (ini < toMin(b.hora_fin) && fin > toMin(b.hora_inicio))
        return `El bloqueo se solapa con otro bloqueo existente (${b.hora_inicio} - ${b.hora_fin})`
    }
    return null
  }

  const totalPages = Math.ceil(bloqueos.length / itemsPerPage)
  const bloqueosPaginados = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return bloqueos.slice(start, start + itemsPerPage)
  }, [bloqueos, currentPage, itemsPerPage])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.hora_fin <= formData.hora_inicio) { showError('La hora de fin debe ser mayor que la hora de inicio'); return }
    const dias = formData.dias_limite_vigencia === '' ? null : parseInt(formData.dias_limite_vigencia, 10)
    if (formData.dias_limite_vigencia !== '' && (Number.isNaN(dias) || dias < 1)) { showError('Los días límite de vigencia deben ser un número mayor a 0'); return }
    const errorSolapamiento = await validarSolapamiento()
    if (errorSolapamiento) { showError(errorSolapamiento); return }
    const payload = {
      doctor_id:            formData.doctor_id || null,
      operating_room_id:    formData.operating_room_id,
      fecha:                formData.fecha,
      hora_inicio:          formData.hora_inicio,
      hora_fin:             formData.hora_fin,
      motivo:               formData.motivo || null,
      dias_auto_liberacion: dias != null && dias > 0 ? dias : null,
      vigencia_hasta:       null,
    }
    if (bloqueoEditando) actualizarBloqueo.mutate({ id: bloqueoEditando.id, data: payload })
    else crearBloqueo.mutate(payload)
  }

  const iniciarEdicion = (bloqueo) => {
    setBloqueoEditando(bloqueo)
    setFormData({
      doctor_id:            bloqueo.doctor_id || '',
      operating_room_id:    bloqueo.operating_room_id,
      fecha:                bloqueo.fecha,
      hora_inicio:          bloqueo.hora_inicio,
      hora_fin:             bloqueo.hora_fin,
      motivo:               bloqueo.motivo || '',
      dias_limite_vigencia: bloqueo.dias_auto_liberacion ?? '',
    })
    document.querySelector('.card form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cancelarEdicion = () => {
    setBloqueoEditando(null)
    setFormData(EMPTY_FORM)
  }

  const handleEliminar = (bloqueo) => { setBloqueoAEliminar(bloqueo); setShowConfirmEliminar(true) }
  const confirmarEliminar = () => { if (bloqueoAEliminar) eliminarBloqueo.mutate(bloqueoAEliminar.id); setBloqueoAEliminar(null) }

  return (
    <div className="space-y-6">
      <h1 className={isDark ? 'text-3xl font-bold text-white' : 'text-3xl font-bold text-gray-900'}>Bloqueo de Horario</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BloqueoForm
          formData={formData}
          setFormData={setFormData}
          bloqueoEditando={bloqueoEditando}
          doctores={doctores}
          pabellones={pabellones}
          estadoPorHora={estadoPorHora}
          handleSubmit={handleSubmit}
          cancelarEdicion={cancelarEdicion}
          isCreating={crearBloqueo.isPending}
          isUpdating={actualizarBloqueo.isPending}
          theme={theme}
        />
        <BloqueoList
          bloqueos={bloqueos}
          bloqueosPaginados={bloqueosPaginados}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          iniciarEdicion={iniciarEdicion}
          handleEliminar={handleEliminar}
          isDeleting={eliminarBloqueo.isPending}
          isCreating={crearBloqueo.isPending}
          isUpdating={actualizarBloqueo.isPending}
          itemsPerPage={itemsPerPage}
          theme={theme}
        />
      </div>

      <ConfirmModal
        isOpen={showConfirmEliminar}
        onClose={() => { setShowConfirmEliminar(false); setBloqueoAEliminar(null) }}
        onConfirm={confirmarEliminar}
        title="Eliminar Bloqueo"
        message={bloqueoAEliminar ? `¿Estás seguro de eliminar este bloqueo?\n\nPabellón: ${bloqueoAEliminar.operating_rooms?.nombre}\nFecha: ${bloqueoAEliminar.fecha}\nHora: ${bloqueoAEliminar.hora_inicio} - ${bloqueoAEliminar.hora_fin}${bloqueoAEliminar.doctors ? `\nDoctor: ${bloqueoAEliminar.doctors.nombre} ${bloqueoAEliminar.doctors.apellido}` : ''}` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}
