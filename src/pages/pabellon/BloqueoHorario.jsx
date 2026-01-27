import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../config/supabase'
import { Calendar, Clock, Users, X, Edit } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { sanitizeString } from '../../utils/sanitizeInput'
import Pagination from '../../components/common/Pagination'
import ConfirmModal from '../../components/common/ConfirmModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { format } from 'date-fns'
import { useTheme } from '../../contexts/ThemeContext'

export default function BloqueoHorario() {
  const [formData, setFormData] = useState({
    doctor_id: '',
    operating_room_id: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    motivo: '',
    vigencia_hasta: '',
  })
  const [showConfirmEliminar, setShowConfirmEliminar] = useState(false)
  const [bloqueoAEliminar, setBloqueoAEliminar] = useState(null)
  const [bloqueoEditando, setBloqueoEditando] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()
  const { theme } = useTheme()

  const { data: doctores = [] } = useQuery({
    queryKey: ['doctores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, nombre, apellido')
        .eq('estado', 'activo')
        .is('deleted_at', null)
      
      if (error) throw error
      return data
    },
  })

  const { data: pabellones = [] } = useQuery({
    queryKey: ['pabellones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operating_rooms')
        .select('id, nombre')
        .eq('activo', true)
        .is('deleted_at', null)
      
      if (error) throw error
      return data
    },
  })

  const { data: bloqueos = [] } = useQuery({
    queryKey: ['bloqueos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_blocks')
        .select(`
          *,
          doctors:doctor_id(nombre, apellido),
          operating_rooms:operating_room_id(nombre)
        `)
        .is('deleted_at', null)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true })
      
      if (error) throw error
      return data
    },
  })

  // Consultar cirugías para validar solapamiento
  const { data: cirugias = [] } = useQuery({
    queryKey: ['cirugias-validacion', formData.fecha],
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

  const crearBloqueo = useMutation({
    mutationFn: async (data) => {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('schedule_blocks')
        .insert({
          ...data,
          created_by: user.id,
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bloqueos'])
      queryClient.invalidateQueries(['cirugias-validacion'])
      setFormData({
        doctor_id: '',
        operating_room_id: '',
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        motivo: '',
        vigencia_hasta: '',
      })
      setBloqueoEditando(null)
      showSuccess('Bloqueo creado exitosamente')
    },
    onError: (error) => {
      const errorMessage = error.message || error.toString() || 'Error desconocido'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
      } else {
        showError(`Error al crear bloqueo: ${errorMessage}`)
      }
    },
  })

  const actualizarBloqueo = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from('schedule_blocks')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bloqueos'])
      queryClient.invalidateQueries(['cirugias-validacion'])
      setFormData({
        doctor_id: '',
        operating_room_id: '',
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        motivo: '',
        vigencia_hasta: '',
      })
      setBloqueoEditando(null)
      showSuccess('Bloqueo actualizado exitosamente')
    },
    onError: (error) => {
      const errorMessage = error.message || error.toString() || 'Error desconocido'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
      } else {
        showError(`Error al actualizar bloqueo: ${errorMessage}`)
      }
    },
  })

  const eliminarBloqueo = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('schedule_blocks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bloqueos'])
      queryClient.invalidateQueries(['cirugias-validacion'])
      showSuccess('Bloqueo eliminado exitosamente')
    },
    onError: (error) => {
      const errorMessage = error.message || error.toString() || 'Error desconocido'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
      } else {
        showError(`Error al eliminar bloqueo: ${errorMessage}`)
      }
    },
  })

  // Validar solapamiento con cirugías y otros bloqueos
  const validarSolapamiento = async () => {
    if (!formData.fecha || !formData.operating_room_id || !formData.hora_inicio || !formData.hora_fin) {
      return null
    }

    // Convertir horas a minutos para comparación
    const [horaInicioH, horaInicioM] = formData.hora_inicio.split(':').map(Number)
    const [horaFinH, horaFinM] = formData.hora_fin.split(':').map(Number)
    const minutosInicio = horaInicioH * 60 + horaInicioM
    const minutosFin = horaFinH * 60 + horaFinM

    // Validar solapamiento con cirugías
    for (const cirugia of cirugias) {
      const [cInicioH, cInicioM] = cirugia.hora_inicio.split(':').map(Number)
      const [cFinH, cFinM] = cirugia.hora_fin.split(':').map(Number)
      const cMinutosInicio = cInicioH * 60 + cInicioM
      const cMinutosFin = cFinH * 60 + cFinM

      // Verificar solapamiento: si hay intersección entre los rangos
      if (
        (minutosInicio < cMinutosFin && minutosFin > cMinutosInicio)
      ) {
        return `El bloqueo se solapa con una cirugía programada (${cirugia.hora_inicio} - ${cirugia.hora_fin})`
      }
    }

    // Validar solapamiento con otros bloqueos (excluyendo el que estamos editando)
    const bloqueosExistentes = bloqueos.filter(b => 
      b.id !== bloqueoEditando?.id &&
      b.fecha === formData.fecha &&
      b.operating_room_id === formData.operating_room_id
    )

    for (const bloqueo of bloqueosExistentes) {
      const [bInicioH, bInicioM] = bloqueo.hora_inicio.split(':').map(Number)
      const [bFinH, bFinM] = bloqueo.hora_fin.split(':').map(Number)
      const bMinutosInicio = bInicioH * 60 + bInicioM
      const bMinutosFin = bFinH * 60 + bFinM

      // Verificar solapamiento
      if (
        (minutosInicio < bMinutosFin && minutosFin > bMinutosInicio)
      ) {
        return `El bloqueo se solapa con otro bloqueo existente (${bloqueo.hora_inicio} - ${bloqueo.hora_fin})`
      }
    }

    return null
  }

  // Paginación
  const totalPages = Math.ceil(bloqueos.length / itemsPerPage)
  const bloqueosPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return bloqueos.slice(startIndex, startIndex + itemsPerPage)
  }, [bloqueos, currentPage, itemsPerPage])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar hora fin > hora inicio
    if (formData.hora_fin <= formData.hora_inicio) {
      showError('La hora de fin debe ser mayor que la hora de inicio')
      return
    }
    
    // Validar vigencia
    if (formData.vigencia_hasta && formData.vigencia_hasta < formData.fecha) {
      showError('La fecha de vigencia debe ser mayor o igual a la fecha del bloqueo')
      return
    }

    // Validar solapamiento
    const errorSolapamiento = await validarSolapamiento()
    if (errorSolapamiento) {
      showError(errorSolapamiento)
      return
    }
    
    if (bloqueoEditando) {
      actualizarBloqueo.mutate({ id: bloqueoEditando.id, data: formData })
    } else {
      crearBloqueo.mutate(formData)
    }
  }

  const handleEliminar = (bloqueo) => {
    setBloqueoAEliminar(bloqueo)
    setShowConfirmEliminar(true)
  }

  const confirmarEliminar = () => {
    if (bloqueoAEliminar) {
      eliminarBloqueo.mutate(bloqueoAEliminar.id)
    }
    setBloqueoAEliminar(null)
  }

  const iniciarEdicion = (bloqueo) => {
    setBloqueoEditando(bloqueo)
    setFormData({
      doctor_id: bloqueo.doctor_id || '',
      operating_room_id: bloqueo.operating_room_id,
      fecha: bloqueo.fecha,
      hora_inicio: bloqueo.hora_inicio,
      hora_fin: bloqueo.hora_fin,
      motivo: bloqueo.motivo || '',
      vigencia_hasta: bloqueo.vigencia_hasta || '',
    })
    // Scroll al formulario
    document.querySelector('.card form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cancelarEdicion = () => {
    setBloqueoEditando(null)
    setFormData({
      doctor_id: '',
      operating_room_id: '',
      fecha: '',
      hora_inicio: '',
      hora_fin: '',
      motivo: '',
      vigencia_hasta: '',
    })
  }

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Bloqueo de Horario</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {bloqueoEditando ? 'Editar Bloqueo' : 'Crear Bloqueo'}
            </h2>
            {bloqueoEditando && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className={`text-sm ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Cancelar edición
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Doctor (Opcional)</label>
              <select
                value={formData.doctor_id}
                onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                className="input-field"
              >
                <option value="">Seleccionar doctor...</option>
                {doctores.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.nombre} {doctor.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Pabellón *</label>
              <select
                value={formData.operating_room_id}
                onChange={(e) => setFormData({ ...formData, operating_room_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Seleccionar pabellón...</option>
                {pabellones.map(pabellon => (
                  <option key={pabellon.id} value={pabellon.id}>
                    {pabellon.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Fecha *</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="input-field"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">Hora Inicio *</label>
                <input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label-field">Hora Fin *</label>
                <input
                  type="time"
                  value={formData.hora_fin}
                  onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-field">Motivo</label>
              <textarea
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: sanitizeString(e.target.value) })}
                className="input-field"
                rows="3"
                maxLength={500}
              />
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-500'}`}>
                {formData.motivo.length}/500 caracteres
              </p>
            </div>

            <div>
              <label className="label-field">Vigencia Hasta (Opcional)</label>
              <input
                type="date"
                value={formData.vigencia_hasta}
                onChange={(e) => setFormData({ ...formData, vigencia_hasta: e.target.value })}
                className="input-field"
                min={formData.fecha}
              />
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-600'}`}>
                Si no se especifica, el bloqueo será permanente hasta liberación manual
              </p>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full"
              disabled={crearBloqueo.isPending || actualizarBloqueo.isPending}
            >
              {crearBloqueo.isPending || actualizarBloqueo.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  {bloqueoEditando ? 'Actualizando...' : 'Creando...'}
                </span>
              ) : (
                bloqueoEditando ? 'Actualizar Bloqueo' : 'Crear Bloqueo'
              )}
            </button>
          </form>
        </div>

        {/* Lista de bloqueos */}
        <div className="card">
          <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Bloqueos Activos</h2>
          <div className="space-y-3">
            {bloqueos.length === 0 ? (
              <p className={`text-center py-4 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-500'}`}>No hay bloqueos activos</p>
            ) : (
              bloqueosPaginados.map(bloqueo => (
                <div key={bloqueo.id} className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{bloqueo.operating_rooms?.nombre}</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-gray-700'}`}>
                        {bloqueo.fecha} {bloqueo.hora_inicio} - {bloqueo.hora_fin}
                      </p>
                      {bloqueo.doctors && (
                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>
                          Dr. {bloqueo.doctors.nombre} {bloqueo.doctors.apellido}
                        </p>
                      )}
                      {bloqueo.motivo && (
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-600'}`}>{bloqueo.motivo}</p>
                      )}
                      {bloqueo.vigencia_hasta && (
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-500'}`}>
                          Válido hasta: {bloqueo.vigencia_hasta}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => iniciarEdicion(bloqueo)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        disabled={crearBloqueo.isPending || actualizarBloqueo.isPending}
                        title="Editar bloqueo"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEliminar(bloqueo)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        disabled={eliminarBloqueo.isPending || crearBloqueo.isPending || actualizarBloqueo.isPending}
                        title="Eliminar bloqueo"
                      >
                        {eliminarBloqueo.isPending ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {bloqueos.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={bloqueos.length}
            />
          )}
        </div>
      </div>

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={showConfirmEliminar}
        onClose={() => {
          setShowConfirmEliminar(false)
          setBloqueoAEliminar(null)
        }}
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
