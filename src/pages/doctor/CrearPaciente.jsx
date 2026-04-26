import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyClinicaId } from '@/utils/getClinicaId'
import { getCurrentUser } from '@/services/authService'
import { getDoctorByUserId } from '@/services/doctorService'
import { fetchActiveSupplies, fetchOperationPacks } from '@/services/supplyService'
import { fetchRooms } from '@/services/operatingRoomService'
import { findPatientByRut, createPatient, updatePatient } from '@/services/patientService'
import { createRequest, addRequestSupplies } from '@/services/surgeryRequestService'
import { createNotification } from '@/services/notificationService'
import { UserPlus, AlertCircle, Ban } from 'lucide-react'
import { formatRut, cleanRut, validateRut, isValidRutFormat } from '@/utils/rutFormatter'
import { sanitizeString, sanitizeRut } from '@/utils/sanitizeInput'
import SearchableSelect from '@/components/SearchableSelect'
import { codigosOperaciones, getGrupoFonasaByCodigo, insumoAplicaParaGrupo } from '@/data/codigosOperaciones'
import { useNotifications } from '@/hooks/useNotifications'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'
import ConfirmModal from '@/components/common/ConfirmModal'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import HorariosSelector from './crearPaciente/HorariosSelector'
import InsumosSection from './crearPaciente/InsumosSection'

const EMPTY_FORM = {
  nombre: '', apellido: '', rut: '',
  codigo_operacion: '',
  hora_recomendada: '', hora_fin_recomendada: '', fecha_preferida: '', operating_room_id_preferido: '',
  hora_recomendada_2: '', hora_fin_recomendada_2: '', fecha_preferida_2: '', operating_room_id_preferido_2: '',
  dejar_fecha_a_pabellon: true,
  horarios_extra: [],
  observaciones: '',
  insumos: [],
}

export default function CrearPaciente() {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [slot1Seleccionado, setSlot1Seleccionado] = useState(null)
  const [slot2Seleccionado, setSlot2Seleccionado] = useState(null)
  const [showSegundoHorario, setShowSegundoHorario] = useState(false)
  const [insumoSeleccionado, setInsumoSeleccionado] = useState('')
  const [cantidadInsumo, setCantidadInsumo] = useState(1)
  const [rutError, setRutError] = useState('')
  const [showConfirmSinInsumos, setShowConfirmSinInsumos] = useState(false)
  const [showCalendarioGrid, setShowCalendarioGrid] = useState(true)

  const queryClient = useQueryClient()
  const { showError, showSuccess } = useNotifications()
  const { theme } = useTheme()
  const t = tc(theme)
  const location = useLocation()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  useEffect(() => {
    const state = location.state
    if (!state?.desdeDisponibilidad || !state.fechaPreferida) return
    const s1 = state.slot1
    const s2 = state.slot2
    if (!s1) return
    setFormData(prev => ({
      ...prev,
      fecha_preferida: state.fechaPreferida,
      hora_recomendada: s1.horaInicio || '',
      hora_fin_recomendada: s1.horaFin || '',
      operating_room_id_preferido: s1.operating_room_id || '',
      fecha_preferida_2: s2 ? (state.fechaPreferida2 || state.fechaPreferida) : '',
      hora_recomendada_2: s2?.horaInicio || '',
      hora_fin_recomendada_2: s2?.horaFin || '',
      operating_room_id_preferido_2: s2?.operating_room_id || '',
    }))
    setSlot1Seleccionado({ operating_room_id: s1.operating_room_id, nombre_pabellon: s1.nombrePabellon || '', hora_inicio: s1.horaInicio, hora_fin: s1.horaFin })
    setSlot2Seleccionado(s2 ? { operating_room_id: s2.operating_room_id, nombre_pabellon: s2.nombrePabellon || '', hora_inicio: s2.horaInicio, hora_fin: s2.horaFin } : null)
    if (s2) setShowSegundoHorario(true)
  }, [location.state])

  const { data: doctor } = useQuery({
    queryKey: ['doctor-actual'],
    queryFn: async () => {
      const { user } = await getCurrentUser()
      if (!user) return null
      const { data, error } = await getDoctorByUserId(user.id)
      if (error) throw error
      return data
    },
  })

  const { data: insumos = [] } = useQuery({
    queryKey: ['insumos'],
    queryFn: async () => {
      const { data, error } = await fetchActiveSupplies()
      if (error) throw error
      return data
    },
  })

  const { data: pabellonesList = [] } = useQuery({
    queryKey: ['operating-rooms-crear'],
    queryFn: async () => {
      const { data, error } = await fetchRooms()
      if (error) throw error
      return data
    },
  })

  const { data: packData } = useQuery({
    queryKey: ['operation-pack', formData.codigo_operacion],
    queryFn: async () => {
      if (!formData.codigo_operacion) return { packItems: [], recommendedSupplyIds: [] }
      try {
        const { data: rows, error } = await fetchOperationPacks(formData.codigo_operacion)
        if (error) return { packItems: [], recommendedSupplyIds: [] }
        const packItems = (rows || []).filter(r => r.supplies).map(r => ({ supply_id: r.supply_id, nombre: r.supplies.nombre, codigo: r.supplies.codigo, cantidad: Math.max(0, Number(r.cantidad) || 0) }))
        return { packItems, recommendedSupplyIds: packItems.map(p => p.supply_id) }
      } catch { return { packItems: [], recommendedSupplyIds: [] } }
    },
    enabled: !!formData.codigo_operacion,
  })

  const lastAppliedPackCodeRef = useRef(null)
  useEffect(() => {
    if (!formData.codigo_operacion) { lastAppliedPackCodeRef.current = null; return }
    if (!packData?.packItems || lastAppliedPackCodeRef.current === formData.codigo_operacion) return
    const packInsumos = packData.packItems.filter(p => p.cantidad >= 1).map(p => ({ supply_id: p.supply_id, nombre: p.nombre, codigo: p.codigo, cantidad: p.cantidad }))
    lastAppliedPackCodeRef.current = formData.codigo_operacion
    setFormData(prev => ({ ...prev, insumos: packInsumos }))
  }, [formData.codigo_operacion, packData?.packItems])

  const grupoFonasa = getGrupoFonasaByCodigo(formData.codigo_operacion)
  const insumosDisponibles = useMemo(() => {
    let list = grupoFonasa ? insumos.filter(ins => insumoAplicaParaGrupo(ins.grupos_fonasa, grupoFonasa)) : insumos
    const recommendedIds = packData?.recommendedSupplyIds || []
    if (recommendedIds.length === 0) return list
    return [...list].sort((a, b) => {
      const aRec = recommendedIds.includes(a.id)
      const bRec = recommendedIds.includes(b.id)
      if (aRec && !bRec) return -1
      if (!aRec && bRec) return 1
      return 0
    })
  }, [insumos, grupoFonasa, packData?.recommendedSupplyIds])

  useEffect(() => {
    if (insumoSeleccionado && !insumosDisponibles.some(i => i.id === insumoSeleccionado)) setInsumoSeleccionado('')
  }, [insumosDisponibles, insumoSeleccionado])

  const crearPacienteYSolicitud = useMutation({
    mutationFn: async (data) => {
      if (!doctor) throw new Error('Doctor no encontrado')
      const clinicaId = await getMyClinicaId()

      const { data: pacienteExistente, error: errorBusqueda } = await findPatientByRut(doctor.id, cleanRut(data.rut))
      if (errorBusqueda) throw errorBusqueda

      let paciente
      if (pacienteExistente) {
        paciente = pacienteExistente
        if (pacienteExistente.nombre !== data.nombre || pacienteExistente.apellido !== data.apellido) {
          const { error: updateError } = await updatePatient(pacienteExistente.id, { nombre: data.nombre, apellido: data.apellido })
          if (updateError) throw updateError
          paciente = { ...pacienteExistente, nombre: data.nombre, apellido: data.apellido }
        }
      } else {
        const { data: nuevoPaciente, error: pacienteError } = await createPatient({ doctor_id: doctor.id, nombre: data.nombre, apellido: data.apellido, rut: cleanRut(data.rut), clinica_id: clinicaId })
        if (pacienteError) throw pacienteError
        paciente = nuevoPaciente
      }

      const dejarAPabellon = Boolean(data.dejar_fecha_a_pabellon)
      const payloadSolicitud = {
        doctor_id: doctor.id, patient_id: paciente.id, clinica_id: clinicaId,
        codigo_operacion: data.codigo_operacion, observaciones: data.observaciones || null,
        dejar_fecha_a_pabellon: dejarAPabellon,
        hora_recomendada: dejarAPabellon ? null : (data.hora_recomendada || null),
        hora_fin_recomendada: dejarAPabellon ? null : (data.hora_fin_recomendada || null),
        fecha_preferida: dejarAPabellon ? null : (data.fecha_preferida || null),
        operating_room_id_preferido: dejarAPabellon ? null : (data.operating_room_id_preferido || null),
        hora_recomendada_2: dejarAPabellon ? null : (data.hora_recomendada_2 || null),
        hora_fin_recomendada_2: dejarAPabellon ? null : (data.hora_fin_recomendada_2 || null),
        fecha_preferida_2: dejarAPabellon ? null : (data.fecha_preferida_2 || null),
        operating_room_id_preferido_2: dejarAPabellon ? null : (data.operating_room_id_preferido_2 || null),
        horarios_preferidos_extra: (data.horarios_extra?.length ? data.horarios_extra : null),
      }
      const { data: solicitud, error: solicitudError } = await createRequest(payloadSolicitud)
      if (solicitudError) throw solicitudError

      if (data.insumos?.length > 0) {
        const { error: insumosError } = await addRequestSupplies(solicitud.id, data.insumos, clinicaId)
        if (insumosError) throw insumosError
      }

      try {
        await createNotification({
          tipo: 'orden_sin_agendar',
          titulo: 'Nueva orden de cirugía sin agendar',
          mensaje: `Dr. ${doctor.nombre} ${doctor.apellido} tiene un paciente pendiente de agendamiento: ${data.nombre} ${data.apellido} — ${data.codigo_operacion}`,
          relacionado_con: solicitud.id,
          clinica_id: clinicaId,
          target_role: 'pabellon',
        })
      } catch { /* no bloquear si falla la notificación */ }

      return { paciente, solicitud }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes-doctor-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['estado-slots-pabellon'] })
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      queryClient.invalidateQueries({ queryKey: ['solicitudes-pendientes'] })
      setFormData({ ...EMPTY_FORM, dejar_fecha_a_pabellon: false })
      setSlot1Seleccionado(null); setSlot2Seleccionado(null); setShowSegundoHorario(false); setRutError('')
      let mensaje = 'Solicitud creada.'
      if (variables?.dejar_fecha_a_pabellon) {
        mensaje = 'Solicitud creada. Pabellón asignará fecha y hora.'
      } else if (variables?.fecha_preferida) {
        try {
          const fechaReserva = new Date(variables.fecha_preferida + 'T12:00:00')
          const diaYFecha = format(fechaReserva, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
          mensaje = `Se creó una reserva para este día: ${diaYFecha.charAt(0).toUpperCase() + diaYFecha.slice(1)}.`
        } catch { mensaje = 'Solicitud creada exitosamente.' }
      } else {
        mensaje = 'Solicitud creada exitosamente. El horario quedó guardado para este paciente.'
      }
      showSuccess(mensaje)
      if (variables?.fecha_preferida && !variables?.dejar_fecha_a_pabellon) {
        navigate('/doctor/horarios', { state: { fecha: variables.fecha_preferida }, replace: true })
      }
    },
    onError: (error) => {
      const msg = error.message || error.toString() || 'Error desconocido'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
      } else if (msg.includes('duplicate key') || error.code === '23505') {
        showError('Ya existe un paciente con este RUT. La solicitud debería haberse creado usando el paciente existente.')
      } else if (msg.includes('doctor debe estar activo')) {
        showError('No puede crear solicitudes. Su estado actual no permite esta acción')
      } else {
        showError(msg)
      }
    },
  })

  const agregarInsumo = () => {
    if (!insumoSeleccionado) { showError('Por favor seleccione un insumo'); return }
    const insumo = insumos.find(i => i.id === insumoSeleccionado)
    if (!insumo) { showError('Insumo no encontrado'); return }
    if (formData.insumos.some(i => i.supply_id === insumo.id)) { showError('Este insumo ya está agregado a la solicitud'); return }
    if (!cantidadInsumo || cantidadInsumo < 1) { showError('La cantidad debe ser al menos 1'); return }
    setFormData({ ...formData, insumos: [...formData.insumos, { supply_id: insumo.id, nombre: insumo.nombre, codigo: insumo.codigo, cantidad: cantidadInsumo }] })
    setInsumoSeleccionado(''); setCantidadInsumo(1)
    showSuccess(`Insumo "${insumo.nombre}" agregado correctamente`)
  }

  const eliminarInsumo = (index) => setFormData({ ...formData, insumos: formData.insumos.filter((_, i) => i !== index) })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!doctor) { showError('No se pudo obtener la información del doctor'); return }
    if (doctor.estado !== 'activo') { showError(`No puede crear solicitudes. Su estado actual es: ${doctor.estado === 'vacaciones' ? 'vacaciones' : doctor.estado}.`); return }
    if (!isValidRutFormat(formData.rut)) { setRutError('El formato del RUT no es válido. Use el formato: 12.345.678-9'); showError('El formato del RUT no es válido'); return }
    if (!validateRut(formData.rut)) { setRutError('El dígito verificador del RUT no es válido'); showError('El dígito verificador del RUT no es válido.'); return }
    setRutError('')
    if (!codigosOperaciones.some(c => c.codigo === formData.codigo_operacion)) { showError('Código de operación inválido. Por favor, seleccione un código válido de la lista.'); return }
    if (formData.insumos.length === 0) { setShowConfirmSinInsumos(true); return }
    crearPacienteYSolicitud.mutate({ ...formData, rut: cleanRut(formData.rut) })
  }

  const confirmarSinInsumos = () => {
    crearPacienteYSolicitud.mutate({ ...formData, rut: cleanRut(formData.rut) })
    setShowConfirmSinInsumos(false)
  }

  const puedeCrearSolicitud = doctor?.estado === 'activo'
  const estaEnVacaciones = doctor?.estado === 'vacaciones'

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${t.textPrimary}`}>Crear Ficha de Paciente</h1>

      {estaEnVacaciones && (
        <div className="card bg-amber-50 border-2 border-amber-200">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-full flex-shrink-0"><Ban className="w-6 h-6 text-amber-600" /></div>
            <div>
              <h3 className="text-lg font-black text-amber-900 mb-2">Estado: En Vacaciones</h3>
              <p className="text-sm text-amber-800 mb-1">No puede crear solicitudes quirúrgicas mientras su estado sea "vacaciones".</p>
              <p className="text-xs text-amber-700">Si necesita crear solicitudes, por favor contacte al administrador del sistema para cambiar su estado a "activo".</p>
            </div>
          </div>
        </div>
      )}

      {doctor && !puedeCrearSolicitud && !estaEnVacaciones && (
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-full flex-shrink-0"><AlertCircle className="w-6 h-6 text-red-600" /></div>
            <div>
              <h3 className="text-lg font-black text-red-900 mb-2">Estado No Válido</h3>
              <p className="text-sm text-red-800">Su estado actual ({doctor.estado}) no permite crear solicitudes. Por favor, contacte al administrador.</p>
            </div>
          </div>
        </div>
      )}

      <div className={!puedeCrearSolicitud ? 'card opacity-60 pointer-events-none' : 'card'}>
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
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: sanitizeString(e.target.value) })} className="input-field" required />
              </div>
              <div>
                <label className="label-field">Apellido *</label>
                <input type="text" value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: sanitizeString(e.target.value) })} className="input-field" required />
              </div>
            </div>
            <div className="mt-4">
              <label className="label-field">RUT *</label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) => { const sanitized = sanitizeRut(e.target.value); setFormData({ ...formData, rut: formatRut(sanitized) }); if (rutError) setRutError('') }}
                onBlur={() => { if (formData.rut && isValidRutFormat(formData.rut)) { setRutError(!validateRut(formData.rut) ? 'El dígito verificador del RUT no es válido' : '') } else if (formData.rut) { setRutError('El formato del RUT no es válido') } }}
                className={rutError ? 'input-field border-red-500 focus:border-red-500 focus:ring-red-500' : 'input-field'}
                placeholder="12.345.678-9"
                required
                maxLength={12}
              />
              {rutError && <p className="mt-1 text-sm text-red-600">{rutError}</p>}
            </div>
          </div>

          {/* Datos de la operación */}
          <div>
            <h2 className="text-xl font-bold mb-4">Datos de la Operación</h2>
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

            <HorariosSelector
              formData={formData} setFormData={setFormData}
              slot1Seleccionado={slot1Seleccionado} setSlot1Seleccionado={setSlot1Seleccionado}
              slot2Seleccionado={slot2Seleccionado} setSlot2Seleccionado={setSlot2Seleccionado}
              showSegundoHorario={showSegundoHorario} setShowSegundoHorario={setShowSegundoHorario}
              showCalendarioGrid={showCalendarioGrid} setShowCalendarioGrid={setShowCalendarioGrid}
              pabellonesList={pabellonesList}
              initialFecha={location.state?.fecha || new Date().toISOString().split('T')[0]}
              theme={theme}
            />

            <div className="mt-4">
              <label className="label-field">Observaciones</label>
              <textarea value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: sanitizeString(e.target.value) })} className="input-field" rows="3" maxLength={500} />
              <p className="text-xs text-gray-500 mt-1">{formData.observaciones?.length || 0}/500 caracteres</p>
            </div>
          </div>

          <InsumosSection
            formData={formData}
            insumoSeleccionado={insumoSeleccionado} setInsumoSeleccionado={setInsumoSeleccionado}
            cantidadInsumo={cantidadInsumo} setCantidadInsumo={setCantidadInsumo}
            insumosDisponibles={insumosDisponibles}
            grupoFonasa={grupoFonasa} packData={packData}
            agregarInsumo={agregarInsumo} eliminarInsumo={eliminarInsumo}
            theme={theme}
          />

          <button type="submit" className="btn-primary w-full py-3" disabled={!puedeCrearSolicitud || crearPacienteYSolicitud.isPending}>
            {crearPacienteYSolicitud.isPending ? (
              <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />Creando...</span>
            ) : puedeCrearSolicitud ? 'Crear Paciente y Solicitud' : 'No disponible - Estado inválido'}
          </button>
        </form>
      </div>

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
