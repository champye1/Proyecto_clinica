import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCurrentUser } from '@/services/authService'
import { getDoctorByUserId } from '@/services/doctorService'
import { notifyRescheduleToPabellon } from '@/services/surgeryService'
import { fetchRequestsByDoctorFull, updateRequest, deleteRequestSupplies, addRequestSupplies } from '@/services/surgeryRequestService'
import { fetchActiveSupplies } from '@/services/supplyService'
import { getMyClinicaId } from '@/utils/getClinicaId'
import { useNotifications } from '@/hooks/useNotifications'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'
import { sanitizeString } from '@/utils/sanitizeInput'
import Pagination from '@/components/common/Pagination'
import { TableSkeleton } from '@/components/common/Skeleton'
import { codigosOperaciones, getGrupoFonasaByCodigo, insumoAplicaParaGrupo } from '@/data/codigosOperaciones'
import SolicitudDoctorCard from './solicitudes/SolicitudDoctorCard'
import SolicitudEditModal from './solicitudes/SolicitudEditModal'

const EMPTY_FORM = {
  codigo_operacion: '',
  hora_recomendada: '',
  hora_fin_recomendada: '',
  fecha_preferida: '',
  observaciones: '',
  insumos: [],
}

export default function Solicitudes() {
  const queryClient = useQueryClient()
  const { theme } = useTheme()
  const { showSuccess, showError } = useNotifications()
  const t = tc(theme)
  const isDark = theme === 'dark'
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [solicitudEditando, setSolicitudEditando] = useState(null)
  const [formEdicion, setFormEdicion] = useState(EMPTY_FORM)
  const [insumoSeleccionado, setInsumoSeleccionado] = useState('')
  const [cantidadInsumo, setCantidadInsumo] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['solicitudes-doctor', filtroEstado],
    queryFn: async () => {
      if (!doctor) return []
      const { data, error } = await fetchRequestsByDoctorFull(doctor.id, filtroEstado)
      if (error) throw error
      return data
    },
    enabled: !!doctor,
  })

  const { data: insumos = [] } = useQuery({
    queryKey: ['insumos'],
    queryFn: async () => {
      const { data, error } = await fetchActiveSupplies()
      if (error) throw error
      return data
    },
    enabled: !!doctor,
  })

  const grupoFonasaEdicion = getGrupoFonasaByCodigo(formEdicion.codigo_operacion)
  const insumosDisponiblesEdicion = useMemo(() => {
    if (!grupoFonasaEdicion) return insumos
    return insumos.filter(ins => insumoAplicaParaGrupo(ins.grupos_fonasa, grupoFonasaEdicion))
  }, [insumos, grupoFonasaEdicion])

  useEffect(() => {
    if (insumoSeleccionado && !insumosDisponiblesEdicion.some(i => i.id === insumoSeleccionado)) {
      setInsumoSeleccionado('')
    }
  }, [insumosDisponiblesEdicion, insumoSeleccionado])

  const totalPages = Math.ceil(solicitudes.length / itemsPerPage)
  const solicitudesPaginadas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return solicitudes.slice(startIndex, startIndex + itemsPerPage)
  }, [solicitudes, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [filtroEstado])

  const actualizarSolicitud = useMutation({
    mutationFn: async ({ solicitudId, formData }) => {
      const { error: errorSolicitud } = await updateRequest(solicitudId, {
        codigo_operacion: formData.codigo_operacion,
        hora_recomendada: formData.hora_recomendada || null,
        hora_fin_recomendada: formData.hora_fin_recomendada || null,
        fecha_preferida: formData.fecha_preferida || null,
        observaciones: formData.observaciones || null,
      })
      if (errorSolicitud) throw errorSolicitud

      const { error: errorDelete } = await deleteRequestSupplies(solicitudId)
      if (errorDelete) throw errorDelete

      if (formData.insumos?.length > 0) {
        const clinicaId = await getMyClinicaId()
        const { error: errorInsumos } = await addRequestSupplies(solicitudId, formData.insumos, clinicaId)
        if (errorInsumos) throw errorInsumos
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes-doctor'] })
      showSuccess('Solicitud actualizada exitosamente')
      setSolicitudEditando(null)
      setFormEdicion(EMPTY_FORM)
    },
    onError: (error) => {
      const msg = error.message || error.toString() || 'Error desconocido'
      showError(msg.includes('Failed to fetch') || msg.includes('NetworkError')
        ? 'Error de conexión. Verifique su conexión a internet e intente nuevamente.'
        : 'Error al actualizar la solicitud: ' + msg)
    },
  })

  const solicitarReagendamiento = useMutation({
    mutationFn: async (solicitud) => {
      const { data, error } = await notifyRescheduleToPabellon(solicitud.id)
      if (error) throw error
      if (!data?.success) throw new Error('No se pudo enviar la notificación')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes-doctor'] })
      showSuccess('Pabellón ha sido notificado de la solicitud de reagendamiento.')
    },
    onError: (error) => { showError(error.message || 'Error al notificar a pabellón.') },
  })

  const handleEditarClick = (solicitud) => {
    if (solicitud.estado !== 'pendiente') { showError('Solo se pueden editar solicitudes pendientes'); return }
    setSolicitudEditando(solicitud)
    setFormEdicion({
      codigo_operacion: solicitud.codigo_operacion || '',
      hora_recomendada: solicitud.hora_recomendada ? (typeof solicitud.hora_recomendada === 'string' ? solicitud.hora_recomendada.slice(0, 5) : solicitud.hora_recomendada) : '',
      hora_fin_recomendada: solicitud.hora_fin_recomendada ? (typeof solicitud.hora_fin_recomendada === 'string' ? solicitud.hora_fin_recomendada.slice(0, 5) : solicitud.hora_fin_recomendada) : '',
      fecha_preferida: solicitud.fecha_preferida || '',
      observaciones: solicitud.observaciones || '',
      insumos: (solicitud.surgery_request_supplies || []).map(item => ({
        supply_id: item.supplies?.id || item.supply_id,
        nombre: item.supplies?.nombre,
        codigo: item.supplies?.codigo,
        cantidad: item.cantidad,
      })),
    })
  }

  const agregarInsumo = () => {
    if (!insumoSeleccionado) { showError('Por favor seleccione un insumo'); return }
    const insumo = insumos.find(i => i.id === insumoSeleccionado)
    if (!insumo) { showError('Insumo no encontrado'); return }
    if (formEdicion.insumos.some(i => i.supply_id === insumo.id)) { showError('Este insumo ya está agregado'); return }
    if (!cantidadInsumo || cantidadInsumo < 1) { showError('La cantidad debe ser al menos 1'); return }
    setFormEdicion({ ...formEdicion, insumos: [...formEdicion.insumos, { supply_id: insumo.id, nombre: insumo.nombre, codigo: insumo.codigo, cantidad: cantidadInsumo }] })
    setInsumoSeleccionado('')
    setCantidadInsumo(1)
    showSuccess(`Insumo "${insumo.nombre}" agregado correctamente`)
  }

  const eliminarInsumo = (index) => {
    setFormEdicion({ ...formEdicion, insumos: formEdicion.insumos.filter((_, i) => i !== index) })
  }

  const handleGuardarEdicion = (e) => {
    e.preventDefault()
    if (!formEdicion.codigo_operacion) { showError('El código de operación es requerido'); return }
    if (!codigosOperaciones.some(c => c.codigo === formEdicion.codigo_operacion)) { showError('Código de operación inválido'); return }
    actualizarSolicitud.mutate({ solicitudId: solicitudEditando.id, formData: formEdicion })
  }

  const handleCloseModal = () => {
    setSolicitudEditando(null)
    setFormEdicion(EMPTY_FORM)
  }

  if (isLoading) return <TableSkeleton rows={6} />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Mis Solicitudes</h1>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(sanitizeString(e.target.value))}
          className="input-field w-auto"
        >
          <option value="todas">Todas</option>
          <option value="pendiente">Pendientes</option>
          <option value="aceptada">Aceptadas</option>
          <option value="rechazada">Rechazadas</option>
        </select>
      </div>

      <div className="space-y-4">
        {solicitudes.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-500">No hay solicitudes</p>
          </div>
        ) : (
          <>
            {solicitudesPaginadas.map(solicitud => (
              <SolicitudDoctorCard
                key={solicitud.id}
                solicitud={solicitud}
                isDark={isDark}
                isReschedulePending={solicitarReagendamiento.isPending}
                onEditarClick={handleEditarClick}
                onSolicitarReagendamiento={(s) => solicitarReagendamiento.mutate(s)}
              />
            ))}
            {solicitudes.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={solicitudes.length}
              />
            )}
          </>
        )}
      </div>

      <SolicitudEditModal
        solicitudEditando={solicitudEditando}
        onClose={handleCloseModal}
        formEdicion={formEdicion}
        setFormEdicion={setFormEdicion}
        insumoSeleccionado={insumoSeleccionado}
        setInsumoSeleccionado={setInsumoSeleccionado}
        cantidadInsumo={cantidadInsumo}
        setCantidadInsumo={setCantidadInsumo}
        insumosDisponiblesEdicion={insumosDisponiblesEdicion}
        grupoFonasaEdicion={grupoFonasaEdicion}
        agregarInsumo={agregarInsumo}
        eliminarInsumo={eliminarInsumo}
        handleGuardarEdicion={handleGuardarEdicion}
        isSubmitting={actualizarSolicitud.isPending}
      />
    </div>
  )
}
