import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, FileSpreadsheet } from 'lucide-react'
import { listDoctors, createDoctor, updateDoctor, updateDoctorPassword, checkDoctorEmailExists, toggleDoctorAccess, toggleDoctorStatus, deleteDoctor } from '@/services/doctorService'
import { formatRut, cleanRut, validateRut } from '@/utils/rutFormatter'
import { useNotifications } from '@/hooks/useNotifications'
import toast from 'react-hot-toast'
import { sanitizeString } from '@/utils/sanitizeInput'
import { logger } from '@/utils/logger'
import { useDebounce } from '@/hooks/useDebounce'
import { handleMutationError } from '@/utils/errorHandler'
import { exportToCSV, exportToExcel } from '@/utils/exportData'
import ConfirmModal from '@/components/common/ConfirmModal'
import { TableSkeleton } from '@/components/common/Skeleton'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'
import MedicoForm from './medicos/MedicoForm'
import MedicosTable from './medicos/MedicosTable'

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9@$!%*?&]{6}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ESPECIALIDADES = ['cirugia_general','cirugia_cardiovascular','cirugia_plastica','cirugia_ortopedica','neurocirugia','cirugia_oncologica','urologia','ginecologia','otorrinolaringologia','oftalmologia','otra']

const EMPTY_FORM = { nombre: '', apellido: '', rut: '', email: '', telefono: '', especialidad: '', estado: 'activo', acceso_web_enabled: false, username: '', password: '' }

export default function Medicos() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [medicoEditando, setMedicoEditando] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showConfirmEliminar, setShowConfirmEliminar] = useState(false)
  const [medicoAEliminar, setMedicoAEliminar] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const queryClient = useQueryClient()
  const { showSuccess, showError, showInfo } = useNotifications()
  const debouncedBusqueda = useDebounce(busqueda, 300)
  const { theme } = useTheme()
  const t = tc(theme)
  const isDark = theme === 'dark'

  const notifyDoctorAction = (type, doctorName, details = null) => {
    const isCreate = type === 'create'
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5"><span className="text-2xl">{isCreate ? '✅' : '🔄'}</span></div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{isCreate ? 'Médico Creado' : 'Perfil Actualizado'}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Doctor: <span className="font-semibold">{doctorName}</span></p>
              <p className="mt-1 text-xs text-gray-400">{new Date().toLocaleString()}</p>
              {details && <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 p-2 rounded whitespace-pre-wrap">{details}</div>}
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-slate-700">
          <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus:outline-none">Cerrar</button>
        </div>
      </div>
    ), { duration: 8000, position: 'top-right' })
  }

  const { data: medicos = [], isLoading } = useQuery({
    queryKey: ['medicos'],
    queryFn: async () => {
      const { data, error } = await listDoctors()
      if (error) throw error
      return data
    },
  })

  const medicosFiltrados = useMemo(() => {
    return medicos.filter(medico => {
      if (debouncedBusqueda) {
        const busquedaLower = debouncedBusqueda.toLowerCase()
        const nombreCompleto = `${medico.nombre} ${medico.apellido}`.toLowerCase()
        const rutFormateado = formatRut(medico.rut).toLowerCase()
        const emailLower = medico.email.toLowerCase()
        if (!nombreCompleto.includes(busquedaLower) && !rutFormateado.includes(busquedaLower) && !emailLower.includes(busquedaLower)) return false
      }
      if (filtroEspecialidad && medico.especialidad !== filtroEspecialidad) return false
      if (filtroEstado && medico.estado !== filtroEstado) return false
      return true
    })
  }, [medicos, debouncedBusqueda, filtroEspecialidad, filtroEstado])

  const totalPages = Math.ceil(medicosFiltrados.length / itemsPerPage)
  const medicosPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return medicosFiltrados.slice(startIndex, startIndex + itemsPerPage)
  }, [medicosFiltrados, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [debouncedBusqueda, filtroEspecialidad, filtroEstado])

  const handleExportCSV = () => {
    try {
      const columns = [{ key: 'nombre', label: 'Nombre' },{ key: 'apellido', label: 'Apellido' },{ key: 'rut', label: 'RUT' },{ key: 'email', label: 'Email' },{ key: 'especialidad', label: 'Especialidad' },{ key: 'estado', label: 'Estado' },{ key: 'acceso_web_enabled', label: 'Acceso Web' }]
      exportToCSV(medicosFiltrados.map(m => ({ ...m, rut: formatRut(m.rut), especialidad: m.especialidad.replace(/_/g, ' '), acceso_web_enabled: m.acceso_web_enabled ? 'Sí' : 'No' })), columns, 'medicos')
      showSuccess('Datos exportados a CSV exitosamente')
    } catch (error) { showError(`Error al exportar: ${error.message}`) }
  }

  const handleExportExcel = async () => {
    try {
      const columns = [{ key: 'nombre', label: 'Nombre' },{ key: 'apellido', label: 'Apellido' },{ key: 'rut', label: 'RUT' },{ key: 'email', label: 'Email' },{ key: 'especialidad', label: 'Especialidad' },{ key: 'estado', label: 'Estado' },{ key: 'acceso_web_enabled', label: 'Acceso Web' }]
      await exportToExcel(medicosFiltrados.map(m => ({ ...m, rut: formatRut(m.rut), especialidad: m.especialidad.replace(/_/g, ' '), acceso_web_enabled: m.acceso_web_enabled ? 'Sí' : 'No' })), columns, 'medicos')
      showSuccess('Datos exportados a Excel exitosamente')
    } catch (error) { showError(`Error al exportar: ${error.message}`) }
  }

  const validateField = (name, value) => {
    const errors = { ...fieldErrors }
    if (name === 'email' && value) {
      if (!EMAIL_REGEX.test(value)) errors.email = 'El formato del email no es válido'
      else delete errors.email
    }
    if (name === 'rut' && value) {
      if (!validateRut(cleanRut(value))) errors.rut = 'El dígito verificador del RUT no es válido'
      else delete errors.rut
    }
    if (name === 'password' && formData.acceso_web_enabled && value) {
      if (!PASSWORD_REGEX.test(value)) errors.password = 'La contraseña debe tener exactamente 6 caracteres, al menos una letra y un número (puede incluir @)'
      else delete errors.password
    }
    setFieldErrors(errors)
  }

  const handleFieldChange = (name, value) => {
    setFormData({ ...formData, [name]: value })
    if (touchedFields[name]) validateField(name, value)
  }

  const handleFieldBlur = (name) => {
    setTouchedFields({ ...touchedFields, [name]: true })
    validateField(name, formData[name])
  }

  const generarUsername = (nombre, apellido) => {
    if (!nombre) return ''
    return nombre.charAt(0).toLowerCase() + (apellido ? apellido.toLowerCase() : '')
  }

  const generarPassword = () => {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    const numeros = '0123456789'
    let password = letras.charAt(Math.floor(Math.random() * letras.length)) + numeros.charAt(Math.floor(Math.random() * numeros.length))
    const todos = letras + numeros
    for (let i = 2; i < 6; i++) password += todos.charAt(Math.floor(Math.random() * todos.length))
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  useEffect(() => {
    if (formData.acceso_web_enabled && !medicoEditando && formData.nombre && formData.apellido) {
      const nuevoUsername = generarUsername(formData.nombre, formData.apellido)
      if (nuevoUsername) setFormData(prev => ({ ...prev, username: nuevoUsername }))
    }
  }, [formData.nombre, formData.apellido])

  const crearMedico = useMutation({
    mutationFn: async (data) => {
      const normalizedData = { ...data, email: data.email.toLowerCase().trim(), nombre: data.nombre.trim(), apellido: data.apellido.trim() }
      if (!ESPECIALIDADES.includes(normalizedData.especialidad)) throw new Error(`Especialidad inválida: ${normalizedData.especialidad}`)
      const rutPattern = /^[0-9]{7,8}-[0-9kK]{1}$/
      if (!rutPattern.test(normalizedData.rut)) throw new Error('Formato de RUT inválido. Debe ser: 12345678-9')
      const functionData = await createDoctor(normalizedData)
      if (!functionData) throw new Error('Respuesta vacía de la Edge Function')
      if (!functionData.success) throw new Error(functionData.error || 'Error al crear médico')
      return { ...functionData.doctor, tempPassword: functionData.tempPassword }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['medicos'] })
      setMostrarFormulario(false)
      setFormData(EMPTY_FORM)
      setShowPassword(false)
      const detalle = result.tempPassword
        ? `👤 Usuario: ${result.username || result.email}\n📧 Email: ${result.email}\n🔑 Contraseña: ${result.tempPassword}\n⚠️ Debe cambiar contraseña al ingresar.`
        : 'Acceso web deshabilitado.'
      notifyDoctorAction('create', `${result.nombre} ${result.apellido}`, detalle)
    },
    onError: (error) => {
      logger.errorWithContext('Error completo al crear médico', error, { formData: { ...formData, password: '***' } })
      if (handleMutationError(error, showError)) return
      showError(`Error al crear médico: ${error?.message || error?.toString() || 'Error desconocido'}`)
    },
  })

  const actualizarMedico = useMutation({
    mutationFn: async ({ id, data, password }) => {
      if (data.email && medicoEditando && data.email !== medicoEditando.email) {
        const { data: medicoExistente, error: errorBusqueda } = await checkDoctorEmailExists(data.email, id)
        if (errorBusqueda) throw errorBusqueda
        if (medicoExistente) throw new Error('El email ya está registrado para otro médico')
      }
      if (password) {
        const functionData = await updateDoctorPassword(id, password)
        if (functionData?.error) throw new Error(functionData.error)
      }
      const { error } = await updateDoctor(id, data)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['medicos'] })
      setMedicoEditando(null)
      setMostrarFormulario(false)
      const nombreDoctor = variables.data.nombre ? `${variables.data.nombre} ${variables.data.apellido}` : (medicoEditando ? `${medicoEditando.nombre} ${medicoEditando.apellido}` : 'Doctor')
      notifyDoctorAction('update', nombreDoctor, variables.password ? 'Perfil y contraseña actualizados correctamente.' : 'Los datos han sido actualizados correctamente.')
    },
    onError: (error) => {
      if (handleMutationError(error, showError)) return
      showError(`Error al actualizar médico: ${error.message || error.toString() || 'Error desconocido'}`)
    },
  })

  const toggleAccesoWeb = useMutation({
    mutationFn: async ({ id, acceso_web_enabled }) => {
      const { error } = await toggleDoctorAccess(id, acceso_web_enabled)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medicos'] }),
  })

  const toggleEstado = useMutation({
    mutationFn: async ({ id, estado }) => {
      const { error, nuevoEstado } = await toggleDoctorStatus(id, estado)
      if (error) throw error
      return nuevoEstado
    },
    onSuccess: (nuevoEstado) => {
      queryClient.invalidateQueries({ queryKey: ['medicos'] })
      toast.success(`Médico cambiado a ${nuevoEstado === 'activo' ? 'activo' : 'vacaciones'}`)
    },
    onError: (error) => { toast.error('Error al cambiar estado del médico'); logger.error('Error toggleEstado:', error) },
  })

  const eliminarMedico = useMutation({
    mutationFn: async (id) => {
      const functionData = await deleteDoctor(id)
      if (!functionData) throw new Error('Respuesta vacía de la Edge Function')
      if (!functionData.success) throw new Error(functionData.error || 'Error al eliminar médico')
      return functionData
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['medicos'] })
      if (result.deleted) {
        showInfo(`✅ Médico eliminado completamente\n\n👤 Nombre: ${result.deleted.doctor}\n📧 Email: ${result.deleted.email}\n🆔 RUT: ${result.deleted.rut}\n\nTodos los datos relacionados han sido eliminados.`)
      } else {
        showSuccess('Médico eliminado exitosamente')
      }
    },
    onError: (error) => {
      logger.errorWithContext('Error completo al eliminar médico', error)
      if (handleMutationError(error, showError)) return
      showError(`Error al eliminar médico: ${error.message || error.toString() || 'Error desconocido'}`)
    },
  })

  const handleEliminar = (medico) => { setMedicoAEliminar(medico); setShowConfirmEliminar(true) }
  const confirmarEliminar = () => { if (medicoAEliminar) eliminarMedico.mutate(medicoAEliminar.id); setMedicoAEliminar(null) }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!EMAIL_REGEX.test(formData.email)) { showError('El formato del email no es válido'); return }
    const rutLimpio = cleanRut(formData.rut)
    if (!validateRut(rutLimpio)) { showError('El RUT ingresado no es válido. Verifique el dígito verificador.'); return }
    if (formData.acceso_web_enabled) {
      if (!medicoEditando && (!formData.username || !formData.password)) { showInfo('Si habilitas el acceso web, debes proporcionar un nombre de usuario y contraseña.'); return }
      if (formData.password && !PASSWORD_REGEX.test(formData.password)) { showError('La contraseña debe tener exactamente 6 caracteres, al menos una letra y un número (puede incluir @)'); return }
    }
    const dataToSubmit = { ...formData, rut: rutLimpio, email: formData.email.toLowerCase().trim() }
    delete dataToSubmit.username
    delete dataToSubmit.password
    if (!medicoEditando && formData.acceso_web_enabled) {
      dataToSubmit.username = formData.username.toLowerCase().trim()
      dataToSubmit.password = formData.password
    }
    if (medicoEditando) {
      actualizarMedico.mutate({ id: medicoEditando.id, data: dataToSubmit, password: formData.password || null })
    } else {
      crearMedico.mutate(dataToSubmit)
    }
  }

  const iniciarEdicion = (medico) => {
    setMedicoEditando(medico)
    setFormData({ nombre: medico.nombre, apellido: medico.apellido, rut: formatRut(medico.rut), email: (medico.email || '').toLowerCase(), telefono: medico.telefono || '', especialidad: medico.especialidad, estado: medico.estado, acceso_web_enabled: medico.acceso_web_enabled, username: '', password: '' })
    setFieldErrors({})
    setTouchedFields({})
    setMostrarFormulario(true)
  }

  const getEstadoBadge = (estado) => {
    if (isDark) return estado === 'activo' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
    return estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
  }

  if (isLoading) return <TableSkeleton rows={8} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className={`text-2xl sm:text-3xl font-bold ${t.textPrimary}`}>Gestión de Médicos</h1>
        <div className="flex flex-wrap gap-2">
          {medicosFiltrados.length > 0 && (
            <>
              <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2 text-sm" title="Exportar a CSV">
                <Download className="w-4 h-4" /><span className="hidden sm:inline">CSV</span>
              </button>
              <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2 text-sm" title="Exportar a Excel">
                <FileSpreadsheet className="w-4 h-4" /><span className="hidden sm:inline">Excel</span>
              </button>
            </>
          )}
          <button onClick={() => { setMostrarFormulario(true); setMedicoEditando(null); setFormData(EMPTY_FORM); setFieldErrors({}); setTouchedFields({}); setShowPassword(false) }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Nuevo Médico</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(sanitizeString(e.target.value))} placeholder="Buscar por nombre, apellido, RUT o email..." className="input-field pl-10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field text-sm">Filtrar por Especialidad</label>
              <select value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(sanitizeString(e.target.value))} className="input-field">
                <option value="">Todas las especialidades</option>
                {ESPECIALIDADES.map(esp => <option key={esp} value={esp}>{esp.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field text-sm">Filtrar por Estado</label>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(sanitizeString(e.target.value))} className="input-field">
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="vacaciones">Vacaciones</option>
              </select>
            </div>
          </div>
          {medicosFiltrados.length !== medicos.length && (
            <p className="text-sm text-gray-600">Mostrando {medicosFiltrados.length} de {medicos.length} médicos</p>
          )}
        </div>
      </div>

      {mostrarFormulario && (
        <MedicoForm
          formData={formData} setFormData={setFormData}
          medicoEditando={medicoEditando}
          fieldErrors={fieldErrors} touchedFields={touchedFields}
          handleFieldChange={handleFieldChange} handleFieldBlur={handleFieldBlur}
          showPassword={showPassword} setShowPassword={setShowPassword}
          generarPassword={generarPassword} generarUsername={generarUsername}
          handleSubmit={handleSubmit}
          onCancel={() => { setMostrarFormulario(false); setMedicoEditando(null) }}
          crearPending={crearMedico.isPending} actualizarPending={actualizarMedico.isPending}
        />
      )}

      <MedicosTable
        medicos={medicos} medicosFiltrados={medicosFiltrados} medicosPaginados={medicosPaginados}
        busqueda={busqueda} filtroEspecialidad={filtroEspecialidad} filtroEstado={filtroEstado}
        isLoading={isLoading}
        currentPage={currentPage} totalPages={totalPages} itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage}
        toggleAccesoWeb={toggleAccesoWeb} toggleEstado={toggleEstado} eliminarMedico={eliminarMedico}
        iniciarEdicion={iniciarEdicion} handleEliminar={handleEliminar}
        getEstadoBadge={getEstadoBadge} theme={theme}
      />

      <ConfirmModal
        isOpen={showConfirmEliminar}
        onClose={() => { setShowConfirmEliminar(false); setMedicoAEliminar(null) }}
        onConfirm={confirmarEliminar}
        title="Eliminar Médico"
        message={medicoAEliminar ? `⚠️ ELIMINACIÓN PERMANENTE\n\n¿Estás seguro de que deseas eliminar completamente al médico:\n\n👤 ${medicoAEliminar.nombre} ${medicoAEliminar.apellido}\n📧 ${medicoAEliminar.email}\n🆔 RUT: ${formatRut(medicoAEliminar.rut)}\n\nEsto eliminará PERMANENTEMENTE todos los datos relacionados.\n\n⚠️ Esta acción NO se puede deshacer.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}
