import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { getMyClinicaId } from '@/utils/getClinicaId'
import { Clock, CheckCircle2, XCircle, Edit, X, Package, CalendarClock } from 'lucide-react'
import { format } from 'date-fns'
import { HORAS_SELECT } from '@/utils/horasOpciones'
import { useNotifications } from '@/hooks/useNotifications'
import { useTheme } from '@/contexts/ThemeContext'
import { sanitizeString, sanitizeNumber } from '@/utils/sanitizeInput'
import Pagination from '@/components/common/Pagination'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import { TableSkeleton } from '@/components/common/Skeleton'
import SearchableSelect from '@/components/SearchableSelect'
import { codigosOperaciones, getGrupoFonasaByCodigo, insumoAplicaParaGrupo } from '@/data/codigosOperaciones'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:                'space-y-6',
  header:              'flex justify-between items-center',
  title:               'text-3xl font-bold text-gray-900',
  filterSelect:        'input-field w-auto',
  list:                'space-y-4',
  emptyCard:           'card text-center py-8',
  emptyText:           'text-gray-500',
  cardHeader:          'flex justify-between items-start mb-4',
  patientNameDark:     'text-lg font-bold text-white',
  patientNameLight:    'text-lg font-bold',
  patientMetaDark:     'text-sm text-slate-300',
  patientMetaLight:    'text-sm text-gray-600',
  stateBadge:          'px-3 py-1 rounded flex items-center gap-2',
  reagendNotice:       'text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2',
  reagendIcon:         'w-4 h-4 flex-shrink-0 text-amber-600',
  reagendDate:         'text-amber-600/80 text-xs',
  reagendRow:          'flex justify-end',
  reagendBtn:          'flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50',
  inlineRow:           'mb-2',
  inlineLabelDark:     'text-sm font-medium text-slate-300',
  inlineLabelLight:    'text-sm font-medium',
  inlineValDark:       'text-sm text-slate-200',
  inlineValLight:      'text-sm text-gray-600',
  insumosWrap:         'mt-1 flex flex-wrap gap-2',
  insumoTagDark:       'text-xs px-2 py-1 rounded border bg-slate-600/90 text-slate-100 border-slate-500',
  insumoTagLight:      'text-xs px-2 py-1 rounded border bg-gray-100 text-gray-800 border-gray-200',
  surgeryBox:          'mt-4 p-3 bg-green-50 rounded-lg',
  surgeryBoxTitle:     'text-sm font-medium text-green-800 mb-1',
  surgeryBoxText:      'text-sm text-green-700',
  surgeryReschNote:    'text-xs text-amber-700 mt-2 pt-2 border-t border-amber-200',
  cardFooter:          'mt-4 flex items-center justify-between',
  createdDark:         'text-xs text-slate-400',
  createdLight:        'text-xs text-gray-500',
  editBtn:             'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2',
  modalPatientInfo:    'text-sm text-slate-600 mb-4',
  modalHint:           'text-xs text-gray-500 mt-0.5',
  modalCharCount:      'text-xs text-gray-500 mt-1',
  modalInsumosTitle:   'text-lg font-bold mb-4 flex items-center gap-2',
  modalInsumosRow:     'flex gap-2 mb-4',
  modalInsumosQty:     'input-field w-24',
  modalInsumosAddBtn:  'btn-secondary',
  modalInsumosList:    'border rounded-lg p-4 space-y-2',
  modalInsumoItem:     'flex justify-between items-center p-2 bg-gray-50 rounded',
  modalInsumoRemove:   'text-red-600 hover:text-red-800',
  modalFooter:         'flex gap-4 justify-end',
  card:                'card',
  iconSm:              'w-4 h-4',
  iconMd:              'w-5 h-5',
  detailSection:       'mb-4 space-y-2',
  form:                'space-y-6',
  fontBold:            'font-bold',
  flex1:               'flex-1',
}

export default function Solicitudes() {
  const queryClient = useQueryClient()
  const { theme } = useTheme()
  const { showSuccess, showError } = useNotifications()
  const isDark = theme === 'dark'
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [solicitudEditando, setSolicitudEditando] = useState(null)
  const [formEdicion, setFormEdicion] = useState({
    codigo_operacion: '',
    hora_recomendada: '',
    observaciones: '',
    insumos: [],
  })
  const [insumoSeleccionado, setInsumoSeleccionado] = useState('')
  const [cantidadInsumo, setCantidadInsumo] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const { data: doctor } = useQuery({
    queryKey: ['doctor-actual'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
  })

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['solicitudes-doctor', filtroEstado],
    queryFn: async () => {
      if (!doctor) return []

      let query = supabase
        .from('surgery_requests')
        .select(`
          *,
          patients:patient_id(nombre, apellido, rut),
          surgery_request_supplies(
            cantidad,
            supplies:supply_id(nombre, codigo)
          ),
          surgeries(
            fecha,
            hora_inicio,
            hora_fin,
            estado_hora,
            fecha_anterior,
            hora_inicio_anterior,
            hora_fin_anterior,
            operating_rooms:operating_room_id(nombre)
          )
        `)
        .eq('doctor_id', doctor.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (filtroEstado !== 'todas') {
        query = query.eq('estado', filtroEstado)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!doctor,
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
    enabled: !!doctor,
  })

  // Insumos filtrados por grupo Fonasa de la cirugía (mallas solo en hernias, no en neuro)
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

  // Paginación
  const totalPages = Math.ceil(solicitudes.length / itemsPerPage)
  const solicitudesPaginadas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return solicitudes.slice(startIndex, startIndex + itemsPerPage)
  }, [solicitudes, currentPage, itemsPerPage])

  // Resetear página cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1)
  }, [filtroEstado])

  // Mutation para actualizar solicitud
  const actualizarSolicitud = useMutation({
    mutationFn: async ({ solicitudId, formData }) => {
      // Actualizar solicitud
      const { error: errorSolicitud } = await supabase
        .from('surgery_requests')
        .update({
          codigo_operacion: formData.codigo_operacion,
          hora_recomendada: formData.hora_recomendada || null,
          hora_fin_recomendada: formData.hora_fin_recomendada || null,
          fecha_preferida: formData.fecha_preferida || null,
          observaciones: formData.observaciones || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', solicitudId)
      
      if (errorSolicitud) throw errorSolicitud

      // Eliminar insumos existentes
      const { error: errorDelete } = await supabase
        .from('surgery_request_supplies')
        .delete()
        .eq('surgery_request_id', solicitudId)
      
      if (errorDelete) throw errorDelete

      // Insertar nuevos insumos
      if (formData.insumos && formData.insumos.length > 0) {
        const clinicaId = await getMyClinicaId()
        const insumosData = formData.insumos.map(insumo => ({
          surgery_request_id: solicitudId,
          supply_id: insumo.supply_id,
          cantidad: insumo.cantidad,
          clinica_id: clinicaId,
        }))

        const { error: errorInsumos } = await supabase
          .from('surgery_request_supplies')
          .insert(insumosData)

        if (errorInsumos) throw errorInsumos
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes-doctor'] })
      showSuccess('Solicitud actualizada exitosamente')
      setSolicitudEditando(null)
      setFormEdicion({
        codigo_operacion: '',
        hora_recomendada: '',
        hora_fin_recomendada: '',
        fecha_preferida: '',
        observaciones: '',
        insumos: [],
      })
    },
    onError: (error) => {
      const errorMessage = error.message || error.toString() || 'Error desconocido'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
      } else {
        showError('Error al actualizar la solicitud: ' + errorMessage)
      }
    },
  })

  const handleEditarClick = (solicitud) => {
    if (solicitud.estado !== 'pendiente') {
      showError('Solo se pueden editar solicitudes pendientes')
      return
    }
    
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
    if (!insumoSeleccionado) {
      showError('Por favor seleccione un insumo')
      return
    }

    const insumo = insumos.find(i => i.id === insumoSeleccionado)
    if (!insumo) {
      showError('Insumo no encontrado')
      return
    }

    if (formEdicion.insumos.some(i => i.supply_id === insumo.id)) {
      showError('Este insumo ya está agregado')
      return
    }

    // Validar cantidad mínima
    if (!cantidadInsumo || cantidadInsumo < 1) {
      showError('La cantidad debe ser al menos 1')
      return
    }

    setFormEdicion({
      ...formEdicion,
      insumos: [...formEdicion.insumos, {
        supply_id: insumo.id,
        nombre: insumo.nombre,
        codigo: insumo.codigo,
        cantidad: cantidadInsumo,
      }],
    })

    setInsumoSeleccionado('')
    setCantidadInsumo(1)
    showSuccess(`Insumo "${insumo.nombre}" agregado correctamente`)
  }

  const eliminarInsumo = (index) => {
    setFormEdicion({
      ...formEdicion,
      insumos: formEdicion.insumos.filter((_, i) => i !== index),
    })
  }

  const handleGuardarEdicion = (e) => {
    e.preventDefault()
    
    if (!formEdicion.codigo_operacion) {
      showError('El código de operación es requerido')
      return
    }

    const codigoValido = codigosOperaciones.some(c => c.codigo === formEdicion.codigo_operacion)
    if (!codigoValido) {
      showError('Código de operación inválido')
      return
    }

    actualizarSolicitud.mutate({
      solicitudId: solicitudEditando.id,
      formData: formEdicion,
    })
  }

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      aceptada: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
      rechazada: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      cancelada: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
    }
    return estados[estado] || estados.pendiente
  }

  // Notificar a pabellón que el paciente/doctor solicitó reagendamiento (vía RPC)
  const solicitarReagendamiento = useMutation({
    mutationFn: async (solicitud) => {
      const { data, error } = await supabase.rpc('notificar_reagendamiento_a_pabellon', {
        p_surgery_request_id: solicitud.id,
      })
      if (error) throw error
      if (!data?.success) throw new Error('No se pudo enviar la notificación')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes-doctor'] })
      showSuccess('Pabellón ha sido notificado de la solicitud de reagendamiento.')
    },
    onError: (error) => {
      showError(error.message || 'Error al notificar a pabellón.')
    },
  })

  if (isLoading) {
    return <TableSkeleton rows={6} />
  }

  return (
    <div className={STYLES.page}>
      <div className={STYLES.header}>
        <h1 className={STYLES.title}>Mis Solicitudes</h1>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(sanitizeString(e.target.value))}
          className={STYLES.filterSelect}
        >
          <option value="todas">Todas</option>
          <option value="pendiente">Pendientes</option>
          <option value="aceptada">Aceptadas</option>
          <option value="rechazada">Rechazadas</option>
        </select>
      </div>

      <div className={STYLES.list}>
        {solicitudes.length === 0 ? (
          <div className={STYLES.emptyCard}>
            <p className={STYLES.emptyText}>No hay solicitudes</p>
          </div>
        ) : (
          <>
            {solicitudesPaginadas.map(solicitud => {
              const estadoInfo = getEstadoBadge(solicitud.estado)
              const EstadoIcon = estadoInfo.icon

              return (
                <div key={solicitud.id} className={STYLES.card}>
                  <div className={STYLES.cardHeader}>
                    <div>
                      <h3 className={isDark ? STYLES.patientNameDark : STYLES.patientNameLight}>
                        {solicitud.patients?.nombre} {solicitud.patients?.apellido}
                      </h3>
                      <p className={isDark ? STYLES.patientMetaDark : STYLES.patientMetaLight}>RUT: {solicitud.patients?.rut}</p>
                      <p className={isDark ? STYLES.patientMetaDark : STYLES.patientMetaLight}>
                        Código Operación: {solicitud.codigo_operacion}
                      </p>
                    </div>
                    <span className={`${STYLES.stateBadge} ${estadoInfo.bg} ${estadoInfo.text}`}>
                      <EstadoIcon className={STYLES.iconSm} />
                      {solicitud.estado}
                    </span>
                  </div>

                  {(solicitud.estado === 'aceptada' || solicitud.estado === 'pendiente') && (
                    <div className={STYLES.detailSection}>
                      {solicitud.reagendamiento_notificado_at && (
                        <p className={STYLES.reagendNotice}>
                          <CheckCircle2 className={STYLES.reagendIcon} />
                          Ya se notificó sobre el reagendamiento
                          <span className={STYLES.reagendDate}>
                            ({format(new Date(solicitud.reagendamiento_notificado_at), 'dd/MM/yyyy HH:mm')})
                          </span>
                        </p>
                      )}
                      <div className={STYLES.reagendRow}>
                        <button
                          type="button"
                          onClick={() => solicitarReagendamiento.mutate(solicitud)}
                          disabled={solicitarReagendamiento.isPending}
                          className={STYLES.reagendBtn}
                          title="Notificar a pabellón que el paciente solicitó reagendamiento"
                        >
                          <CalendarClock className={STYLES.iconSm} />
                          Reagendar
                        </button>
                      </div>
                    </div>
                  )}

                  {(solicitud.hora_recomendada || solicitud.fecha_preferida) && (
                    <div className={STYLES.inlineRow}>
                      <span className={isDark ? STYLES.inlineLabelDark : STYLES.inlineLabelLight}>
                        {solicitud.fecha_preferida ? 'Horario solicitado (vacío, sin reservas ni bloqueos): ' : 'Hora recomendada: '}
                      </span>
                      <span className={isDark ? STYLES.inlineValDark : STYLES.inlineValLight}>
                        {solicitud.fecha_preferida && (
                          <>
                            {format(new Date(solicitud.fecha_preferida), 'dd/MM/yyyy')}
                            {solicitud.hora_recomendada && (
                              <> · {typeof solicitud.hora_recomendada === 'string' ? solicitud.hora_recomendada.slice(0, 5) : solicitud.hora_recomendada}
                                {solicitud.hora_fin_recomendada && `–${typeof solicitud.hora_fin_recomendada === 'string' ? solicitud.hora_fin_recomendada.slice(0, 5) : solicitud.hora_fin_recomendada}`}
                              </>
                            )}
                          </>
                        )}
                        {!solicitud.fecha_preferida && solicitud.hora_recomendada && (typeof solicitud.hora_recomendada === 'string' ? solicitud.hora_recomendada.slice(0, 5) : solicitud.hora_recomendada)}
                      </span>
                    </div>
                  )}

                  {solicitud.observaciones && (
                    <div className={STYLES.inlineRow}>
                      <span className={isDark ? STYLES.inlineLabelDark : STYLES.inlineLabelLight}>Observaciones: </span>
                      <span className={isDark ? STYLES.inlineValDark : STYLES.inlineValLight}>{solicitud.observaciones}</span>
                    </div>
                  )}

                  {solicitud.surgery_request_supplies && solicitud.surgery_request_supplies.length > 0 && (
                    <div className={STYLES.inlineRow}>
                      <span className={isDark ? STYLES.inlineLabelDark : STYLES.inlineLabelLight}>Insumos: </span>
                      <div className={STYLES.insumosWrap}>
                        {solicitud.surgery_request_supplies.map((item, idx) => (
                          <span key={idx} className={isDark ? STYLES.insumoTagDark : STYLES.insumoTagLight}>
                            {item.supplies?.nombre} (x{item.cantidad})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {solicitud.surgeries && solicitud.surgeries.length > 0 && (
                    <div className={STYLES.surgeryBox}>
                      <p className={STYLES.surgeryBoxTitle}>Cirugía Programada:</p>
                      <p className={STYLES.surgeryBoxText}>
                        {format(new Date(solicitud.surgeries[0].fecha), 'dd/MM/yyyy')} a las {typeof solicitud.surgeries[0].hora_inicio === 'string' ? solicitud.surgeries[0].hora_inicio.substring(0, 5) : solicitud.surgeries[0].hora_inicio}
                      </p>
                      <p className={STYLES.surgeryBoxText}>
                        Pabellón: {solicitud.surgeries[0].operating_rooms?.nombre}
                      </p>
                      {solicitud.surgeries[0].estado_hora === 'reagendado' && solicitud.surgeries[0].fecha_anterior && (
                        <p className={STYLES.surgeryReschNote}>
                          Fecha original (ya no aplica): {format(new Date(solicitud.surgeries[0].fecha_anterior), 'dd/MM/yyyy')} a las {typeof solicitud.surgeries[0].hora_inicio_anterior === 'string' ? solicitud.surgeries[0].hora_inicio_anterior.substring(0, 5) : solicitud.surgeries[0].hora_inicio_anterior}
                        </p>
                      )}
                    </div>
                  )}

                  <div className={STYLES.cardFooter}>
                    <div className={isDark ? STYLES.createdDark : STYLES.createdLight}>
                      Creada el {format(new Date(solicitud.created_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                    {solicitud.estado === 'pendiente' && (
                      <button onClick={() => handleEditarClick(solicitud)} className={STYLES.editBtn}>
                        <Edit className={STYLES.iconSm} />
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

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

      {/* Modal de Edición */}
      <Modal
        isOpen={!!solicitudEditando}
        onClose={() => {
          setSolicitudEditando(null)
          setFormEdicion({ codigo_operacion: '', hora_recomendada: '', observaciones: '', insumos: [] })
        }}
        title="Editar Solicitud"
      >
        {solicitudEditando && (
          <form onSubmit={handleGuardarEdicion} className={STYLES.form}>
            <div>
              <p className={STYLES.modalPatientInfo}>
                <span className={STYLES.fontBold}>Paciente:</span> {solicitudEditando.patients?.nombre} {solicitudEditando.patients?.apellido}
              </p>
            </div>

            <div>
              <label className="label-field">Código de Operación *</label>
              <SearchableSelect
                options={codigosOperaciones}
                value={formEdicion.codigo_operacion}
                onChange={(codigo) => setFormEdicion({ ...formEdicion, codigo_operacion: codigo })}
                placeholder="Buscar código de operación..."
                required
              />
            </div>

            <div>
              <label className="label-field">Hora Recomendada (Opcional)</label>
              <select
                value={formEdicion.hora_recomendada ? String(formEdicion.hora_recomendada).slice(0, 5) : ''}
                onChange={(e) => setFormEdicion({ ...formEdicion, hora_recomendada: e.target.value })}
                className="input-field"
              >
                <option value="">Sin preferencia</option>
                {HORAS_SELECT.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <p className={STYLES.modalHint}>Solo hora (sin minutos)</p>
            </div>

            <div>
              <label className="label-field">Observaciones</label>
              <textarea
                value={formEdicion.observaciones}
                onChange={(e) => setFormEdicion({ ...formEdicion, observaciones: sanitizeString(e.target.value) })}
                className="input-field"
                rows="3"
                maxLength={500}
              />
              <p className={STYLES.modalCharCount}>
                {formEdicion.observaciones?.length || 0}/500 caracteres
              </p>
            </div>

            <div>
              <h3 className={STYLES.modalInsumosTitle}>
                <Package className={STYLES.iconMd} />
                Insumos Requeridos
              </h3>
              <div className={STYLES.modalInsumosRow}>
                <div className={STYLES.flex1}>
                  <SearchableSelect
                    options={insumosDisponiblesEdicion}
                    value={insumoSeleccionado}
                    onChange={(id) => setInsumoSeleccionado(id)}
                    placeholder={grupoFonasaEdicion ? `Insumos para esta cirugía (grupo ${grupoFonasaEdicion})` : 'Buscar insumo...'}
                    valueKey="id"
                    displayFormat={(insumo) => `${insumo.codigo} - ${insumo.nombre}`}
                  />
                </div>
                <input
                  type="number"
                  value={cantidadInsumo}
                  onChange={(e) => setCantidadInsumo(parseInt(sanitizeNumber(e.target.value)) || 1)}
                  className={STYLES.modalInsumosQty}
                  min="1"
                  placeholder="Cant."
                />
                <button
                  type="button"
                  onClick={agregarInsumo}
                  className={STYLES.modalInsumosAddBtn}
                  disabled={!insumoSeleccionado}
                >
                  Agregar
                </button>
              </div>

              {formEdicion.insumos.length > 0 && (
                <div className={STYLES.modalInsumosList}>
                  {formEdicion.insumos.map((insumo, index) => (
                    <div key={index} className={STYLES.modalInsumoItem}>
                      <span>
                        {insumo.nombre} ({insumo.codigo}) - Cantidad: {insumo.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarInsumo(index)}
                        className={STYLES.modalInsumoRemove}
                      >
                        <X className={STYLES.iconSm} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={STYLES.modalFooter}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setSolicitudEditando(null)
                  setFormEdicion({ codigo_operacion: '', hora_recomendada: '', observaciones: '', insumos: [] })
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={actualizarSolicitud.isPending}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
