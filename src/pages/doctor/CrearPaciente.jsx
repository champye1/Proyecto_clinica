import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../config/supabase'
import { UserPlus, Package, AlertCircle, Ban } from 'lucide-react'
import { formatRut, cleanRut, validateRut, isValidRutFormat } from '../../utils/rutFormatter'
import { sanitizeString, sanitizeRut } from '../../utils/sanitizeInput'
import SearchableSelect from '../../components/SearchableSelect'
import { codigosOperaciones, getGrupoFonasaByCodigo, insumoAplicaParaGrupo } from '../../data/codigosOperaciones'
import { useNotifications } from '../../hooks/useNotifications'
import { useTheme } from '../../contexts/ThemeContext'
import ConfirmModal from '../../components/common/ConfirmModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function CrearPaciente() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    codigo_operacion: '',
    hora_recomendada: '',
    observaciones: '',
    insumos: [], // Array de { supply_id, cantidad }
  })

  const [insumoSeleccionado, setInsumoSeleccionado] = useState('')
  const [cantidadInsumo, setCantidadInsumo] = useState(1)
  const [rutError, setRutError] = useState('')
  const [showConfirmSinInsumos, setShowConfirmSinInsumos] = useState(false)

  const queryClient = useQueryClient()
  const { showError, showSuccess } = useNotifications()
  const { theme } = useTheme()

  const { data: doctor } = useQuery({
    queryKey: ['doctor-actual'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('doctors')
        .select('id, estado')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
  })

  const { data: insumos = [] } = useQuery({
    queryKey: ['insumos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplies')
        .select('id, nombre, codigo, grupo_prestacion, grupos_fonasa')
        .eq('activo', true)
        .is('deleted_at', null)
        .order('nombre', { ascending: true })
      
      if (error) throw error
      return data
    },
  })

  // Insumos filtrados por grupo Fonasa de la cirugía seleccionada (ej. mallas solo en hernias, no en neuro)
  const grupoFonasa = getGrupoFonasaByCodigo(formData.codigo_operacion)
  const insumosDisponibles = useMemo(() => {
    if (!grupoFonasa) return insumos
    return insumos.filter(ins => insumoAplicaParaGrupo(ins.grupos_fonasa, grupoFonasa))
  }, [insumos, grupoFonasa])

  useEffect(() => {
    if (insumoSeleccionado && !insumosDisponibles.some(i => i.id === insumoSeleccionado)) {
      setInsumoSeleccionado('')
    }
  }, [insumosDisponibles, insumoSeleccionado])

  const crearPacienteYSolicitud = useMutation({
    mutationFn: async (data) => {
      if (!doctor) throw new Error('Doctor no encontrado')

      // Verificar si ya existe un paciente con ese RUT para este doctor
      const { data: pacienteExistente, error: errorBusqueda } = await supabase
        .from('patients')
        .select('id, nombre, apellido')
        .eq('doctor_id', doctor.id)
        .eq('rut', cleanRut(data.rut))
        .is('deleted_at', null)
        .maybeSingle()

      if (errorBusqueda) throw errorBusqueda

      let paciente
      if (pacienteExistente) {
        // Usar el paciente existente
        paciente = pacienteExistente
        
        // Actualizar nombre/apellido si han cambiado
        if (pacienteExistente.nombre !== data.nombre || pacienteExistente.apellido !== data.apellido) {
          const { error: updateError } = await supabase
            .from('patients')
            .update({ 
              nombre: data.nombre, 
              apellido: data.apellido,
              updated_at: new Date().toISOString()
            })
            .eq('id', pacienteExistente.id)
          
          if (updateError) throw updateError
          
          // Actualizar el objeto paciente con los nuevos datos
          paciente = {
            ...pacienteExistente,
            nombre: data.nombre,
            apellido: data.apellido
          }
        }
      } else {
        // Crear nuevo paciente
        const { data: nuevoPaciente, error: pacienteError } = await supabase
          .from('patients')
          .insert({
            doctor_id: doctor.id,
            nombre: data.nombre,
            apellido: data.apellido,
            rut: cleanRut(data.rut),
          })
          .select()
          .single()

        if (pacienteError) throw pacienteError
        paciente = nuevoPaciente
      }

      // Crear solicitud quirúrgica (usando el paciente existente o nuevo)
      const { data: solicitud, error: solicitudError } = await supabase
        .from('surgery_requests')
        .insert({
          doctor_id: doctor.id,
          patient_id: paciente.id,
          codigo_operacion: data.codigo_operacion,
          hora_recomendada: data.hora_recomendada || null,
          observaciones: data.observaciones || null,
        })
        .select()
        .single()

      if (solicitudError) throw solicitudError

      // Crear insumos de la solicitud
      if (data.insumos && data.insumos.length > 0) {
        const insumosData = data.insumos.map(insumo => ({
          surgery_request_id: solicitud.id,
          supply_id: insumo.supply_id,
          cantidad: insumo.cantidad,
        }))

        const { error: insumosError } = await supabase
          .from('surgery_request_supplies')
          .insert(insumosData)

        if (insumosError) throw insumosError
      }

      return { paciente, solicitud }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['solicitudes-doctor-pendientes'])
      setFormData({
        nombre: '',
        apellido: '',
        rut: '',
        codigo_operacion: '',
        hora_recomendada: '',
        observaciones: '',
        insumos: [],
      })
      // Limpiar error de RUT si existe
      setRutError('')
      showSuccess('Solicitud creada exitosamente')
    },
    onError: (error) => {
      // Manejo de errores específicos
      let mensaje = 'Error al crear la solicitud'
      
      const errorMessage = error.message || error.toString() || 'Error desconocido'
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        mensaje = 'Error de conexión. Verifique su conexión a internet e intente nuevamente.'
      } else if (errorMessage.includes('duplicate key') || error.code === '23505') {
        mensaje = 'Ya existe un paciente con este RUT. La solicitud debería haberse creado usando el paciente existente.'
      } else if (errorMessage.includes('doctor debe estar activo')) {
        mensaje = 'No puede crear solicitudes. Su estado actual no permite esta acción'
      } else {
        mensaje = errorMessage
      }
      
      showError(mensaje)
    },
  })

  const agregarInsumo = () => {
    if (!insumoSeleccionado) {
      showError('Por favor seleccione un insumo')
      return
    }

    const insumo = insumos.find(i => i.id === insumoSeleccionado)
    if (!insumo) {
      showError('Insumo no encontrado')
      return
    }

    // Verificar si ya está agregado
    if (formData.insumos.some(i => i.supply_id === insumo.id)) {
      showError('Este insumo ya está agregado a la solicitud')
      return
    }

    // Validar cantidad mínima
    if (!cantidadInsumo || cantidadInsumo < 1) {
      showError('La cantidad debe ser al menos 1')
      return
    }

    const nuevoInsumo = {
      supply_id: insumo.id,
      nombre: insumo.nombre,
      codigo: insumo.codigo,
      cantidad: cantidadInsumo,
    }

    setFormData({
      ...formData,
      insumos: [...formData.insumos, nuevoInsumo],
    })

    setInsumoSeleccionado('')
    setCantidadInsumo(1)
    showSuccess(`Insumo "${insumo.nombre}" agregado correctamente`)
  }

  const eliminarInsumo = (index) => {
    setFormData({
      ...formData,
      insumos: formData.insumos.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validar estado del doctor antes de continuar
    if (!doctor) {
      showError('No se pudo obtener la información del doctor')
      return
    }
    
    if (doctor.estado !== 'activo') {
      showError(`No puede crear solicitudes. Su estado actual es: ${doctor.estado === 'vacaciones' ? 'vacaciones' : doctor.estado}. Por favor, contacte al administrador si necesita crear solicitudes.`)
      return
    }
    
    // Validar formato del RUT
    if (!isValidRutFormat(formData.rut)) {
      setRutError('El formato del RUT no es válido. Use el formato: 12.345.678-9')
      showError('El formato del RUT no es válido')
      return
    }
    
    // Validar dígito verificador del RUT
    if (!validateRut(formData.rut)) {
      setRutError('El dígito verificador del RUT no es válido')
      showError('El dígito verificador del RUT no es válido. Por favor, verifique el RUT ingresado.')
      return
    }
    
    // Limpiar error si el RUT es válido
    setRutError('')
    
    // Validar código de operación
    const codigoValido = codigosOperaciones.some(c => c.codigo === formData.codigo_operacion)
    if (!codigoValido) {
      showError('Código de operación inválido. Por favor, seleccione un código válido de la lista.')
      return
    }
    
    if (formData.insumos.length === 0) {
      setShowConfirmSinInsumos(true)
      return
    }

    // Limpiar el RUT antes de enviar (remover puntos, mantener formato con guion)
    const dataToSubmit = {
      ...formData,
      rut: cleanRut(formData.rut)
    }

    crearPacienteYSolicitud.mutate(dataToSubmit)
  }

  const confirmarSinInsumos = () => {
    // Limpiar el RUT antes de enviar (remover puntos, mantener formato con guion)
    const dataToSubmit = {
      ...formData,
      rut: cleanRut(formData.rut)
    }

    crearPacienteYSolicitud.mutate(dataToSubmit)
    setShowConfirmSinInsumos(false)
  }

  // Verificar si el doctor puede crear solicitudes
  const puedeCrearSolicitud = doctor?.estado === 'activo'
  const estaEnVacaciones = doctor?.estado === 'vacaciones'

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Crear Ficha de Paciente</h1>

      {/* Alerta si el doctor está en vacaciones */}
      {estaEnVacaciones && (
        <div className="card bg-amber-50 border-2 border-amber-200">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-full flex-shrink-0">
              <Ban className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-amber-900 mb-2">Estado: En Vacaciones</h3>
              <p className="text-sm text-amber-800 mb-1">
                No puede crear solicitudes quirúrgicas mientras su estado sea "vacaciones".
              </p>
              <p className="text-xs text-amber-700">
                Si necesita crear solicitudes, por favor contacte al administrador del sistema para cambiar su estado a "activo".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta si el estado es desconocido o no está disponible */}
      {doctor && !puedeCrearSolicitud && !estaEnVacaciones && (
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-red-900 mb-2">Estado No Válido</h3>
              <p className="text-sm text-red-800">
                Su estado actual ({doctor.estado}) no permite crear solicitudes. Por favor, contacte al administrador.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`card ${!puedeCrearSolicitud ? 'opacity-60 pointer-events-none' : ''}`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del paciente */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Datos del Paciente
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: sanitizeString(e.target.value) })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label-field">Apellido *</label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: sanitizeString(e.target.value) })}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="label-field">RUT *</label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) => {
                  const sanitized = sanitizeRut(e.target.value)
                  const formatted = formatRut(sanitized)
                  setFormData({ ...formData, rut: formatted })
                  // Limpiar error cuando el usuario empiece a escribir
                  if (rutError) {
                    setRutError('')
                  }
                }}
                onBlur={() => {
                  // Validar cuando el usuario sale del campo
                  if (formData.rut && isValidRutFormat(formData.rut)) {
                    if (!validateRut(formData.rut)) {
                      setRutError('El dígito verificador del RUT no es válido')
                    } else {
                      setRutError('')
                    }
                  } else if (formData.rut) {
                    setRutError('El formato del RUT no es válido')
                  }
                }}
                className={`input-field ${rutError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="12.345.678-9"
                required
                maxLength={12}
              />
              {rutError && (
                <p className="mt-1 text-sm text-red-600">{rutError}</p>
              )}
            </div>
          </div>

          {/* Datos de la operación */}
          <div>
            <h2 className="text-xl font-bold mb-4">Datos de la Operación</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">Código de Operación *</label>
                <SearchableSelect
                  options={codigosOperaciones}
                  value={formData.codigo_operacion}
                  onChange={(codigo) => setFormData({ ...formData, codigo_operacion: codigo })}
                  placeholder="Buscar código de operación..."
                  required
                />
              </div>
              <div>
                <label className="label-field">Hora Recomendada (Opcional)</label>
                <input
                  type="time"
                  value={formData.hora_recomendada}
                  onChange={(e) => setFormData({ ...formData, hora_recomendada: sanitizeString(e.target.value) })}
                  className="input-field"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="label-field">Observaciones</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: sanitizeString(e.target.value) })}
                className="input-field"
                rows="3"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.observaciones?.length || 0}/500 caracteres
              </p>
            </div>
          </div>

          {/* Insumos */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Insumos Requeridos
            </h2>
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <SearchableSelect
                  options={insumosDisponibles}
                  value={insumoSeleccionado}
                  onChange={(id) => setInsumoSeleccionado(id)}
                  placeholder={grupoFonasa ? `Insumos para esta cirugía (grupo ${grupoFonasa})` : 'Primero elija código de operación'}
                  valueKey="id"
                  displayFormat={(insumo) => `${insumo.codigo} - ${insumo.nombre}`}
                />
              </div>
              <input
                type="number"
                value={cantidadInsumo}
                onChange={(e) => setCantidadInsumo(parseInt(e.target.value) || 1)}
                className="input-field w-24"
                min="1"
                placeholder="Cant."
              />
              <button
                type="button"
                onClick={agregarInsumo}
                className="btn-secondary"
                disabled={!insumoSeleccionado}
              >
                Agregar
              </button>
            </div>

            {formData.insumos.length > 0 && (
              <div className="border rounded-lg p-4 space-y-2">
                {formData.insumos.map((insumo, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>
                      {insumo.nombre} ({insumo.codigo}) - Cantidad: {insumo.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminarInsumo(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full py-3"
            disabled={!puedeCrearSolicitud || crearPacienteYSolicitud.isPending}
          >
            {crearPacienteYSolicitud.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Creando...
              </span>
            ) : puedeCrearSolicitud ? (
              'Crear Paciente y Solicitud'
            ) : (
              'No disponible - Estado inválido'
            )}
          </button>
        </form>
      </div>

      {/* Modal de Confirmación Sin Insumos */}
      <ConfirmModal
        isOpen={showConfirmSinInsumos}
        onClose={() => setShowConfirmSinInsumos(false)}
        onConfirm={confirmarSinInsumos}
        title="Confirmar Solicitud Sin Insumos"
        message="No ha seleccionado insumos. ¿Desea continuar con la solicitud sin insumos?"
        confirmText="Continuar"
        cancelText="Cancelar"
        variant="warning"
      />
    </div>
  )
}
