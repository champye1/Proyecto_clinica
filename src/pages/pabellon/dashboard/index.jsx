import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { getCurrentUser } from '@/services/authService'
import { format, subDays } from 'date-fns'
import { Inbox, PhoneCall, Download } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { es } from 'date-fns/locale'
import Modal from '@/components/common/Modal'
// exportExcel se carga dinámicamente al hacer clic para no bloquear el bundle inicial
const lazyExport = (args) =>
  import('../../../utils/exportExcel').then(m => m.exportDashboardReport(args))

import DashboardMetrics from './DashboardMetrics'
import DashboardChart from './DashboardChart'
import DashboardReminders from './DashboardReminders'
import DashboardPendingRequests from './DashboardPendingRequests'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:               'animate-in fade-in slide-in-from-bottom-4 duration-500',
  header:             'flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0 mb-6 sm:mb-8 lg:mb-10',
  titleDark:          'text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase text-white',
  titleLight:         'text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase text-slate-900',
  subtitle:           'font-bold text-[10px] sm:text-xs uppercase tracking-widest mt-1 text-slate-400',
  headerBtnDark:      'px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase flex items-center gap-2 shadow-sm transition-all touch-manipulation active:scale-95 w-full sm:w-auto border bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700',
  headerBtnMedical:   'px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase flex items-center gap-2 shadow-sm transition-all touch-manipulation active:scale-95 w-full sm:w-auto border bg-white border-blue-200 text-slate-700 hover:bg-blue-50',
  headerBtnLight:     'px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase flex items-center gap-2 shadow-sm transition-all touch-manipulation active:scale-95 w-full sm:w-auto border bg-white border-slate-200 text-slate-700 hover:bg-slate-50',
  bannerDark:         'mb-6 sm:mb-8 rounded-2xl border-2 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-orange-950/40 border-orange-700 text-orange-100',
  bannerLight:        'mb-6 sm:mb-8 rounded-2xl border-2 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-orange-50 border-orange-400 text-orange-900',
  bannerIconDark:     'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-orange-700/50',
  bannerIconLight:    'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100',
  bannerContent:      'flex-1 min-w-0',
  bannerTitle:        'font-black text-sm sm:text-base uppercase tracking-tight',
  bannerSubDark:      'text-xs sm:text-sm font-semibold mt-1 text-orange-300',
  bannerSubLight:     'text-xs sm:text-sm font-semibold mt-1 text-orange-700',
  bannerListDark:     'mt-2 space-y-0.5 text-orange-200',
  bannerListLight:    'mt-2 space-y-0.5 text-orange-800',
  bannerListItem:     'text-xs font-medium truncate',
  bannerListMore:     'text-xs font-bold',
  inboxIcon:          'sm:w-4 sm:h-4',
  fontSemibold:       'font-semibold',
  bannerActions:      'flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto',
  bannerViewBtn:      'px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase rounded-xl transition-colors touch-manipulation w-full sm:w-auto',
  bannerMarkDark:     'px-3 py-2 font-black text-xs uppercase rounded-xl transition-colors touch-manipulation w-full sm:w-auto bg-orange-900/50 hover:bg-orange-900 text-orange-300',
  bannerMarkLight:    'px-3 py-2 font-black text-xs uppercase rounded-xl transition-colors touch-manipulation w-full sm:w-auto bg-orange-100 hover:bg-orange-200 text-orange-700',
  bottomGrid:         'grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 min-h-[400px] sm:min-h-[450px] lg:h-[500px]',
  modalList:          'space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar',
  modalEmpty:         'text-sm text-slate-500 font-bold',
  modalItem:          'border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2',
  modalItemName:      'text-sm font-bold text-slate-900 truncate',
  modalItemMeta:      'text-xs font-semibold text-slate-500 mt-0.5',
  modalItemEstado:    'text-[11px] text-slate-500 mt-0.5',
  modalItemContent:   'min-w-0',
}

export default function Dashboard() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const [showCirugiasHoyModal, setShowCirugiasHoyModal] = useState(false)

  // === Queries ===

  const { data: solicitudesPendientes = [], isLoading: isLoadingSolicitudes } = useQuery({
    queryKey: ['solicitudes-pendientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surgery_requests')
        .select('*, doctors:doctor_id(nombre,apellido,especialidad), patients:patient_id(nombre,apellido,rut)')
        .eq('estado', 'pendiente')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data
    },
  })

  const { data: ordenesNotificaciones = [], refetch: refetchOrdenes } = useQuery({
    queryKey: ['ordenes-sin-agendar-notifs'],
    queryFn: async () => {
      const { user } = await getCurrentUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('id, mensaje, created_at, relacionado_con')
        .eq('user_id', user.id)
        .eq('tipo', 'orden_sin_agendar')
        .eq('vista', false)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) return []
      return data || []
    },
    refetchInterval: 30000,
  })

  const marcarOrdenesVistas = async () => {
    const { user } = await getCurrentUser()
    if (!user || ordenesNotificaciones.length === 0) return
    await supabase
      .from('notifications')
      .update({ vista: true })
      .eq('user_id', user.id)
      .eq('tipo', 'orden_sin_agendar')
      .eq('vista', false)
    refetchOrdenes()
  }

  const { data: cirugiasHoy = [] } = useQuery({
    queryKey: ['cirugias-hoy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surgeries')
        .select('*, doctors:doctor_id(nombre,apellido), patients:patient_id(nombre,apellido), operating_rooms:operating_room_id(nombre)')
        .eq('fecha', format(new Date(), 'yyyy-MM-dd'))
        .is('deleted_at', null)
        .order('hora_inicio', { ascending: true })
      if (error) throw error
      return data
    },
  })

  const { data: cirugiasSemana = [] } = useQuery({
    queryKey: ['cirugias-semana'],
    queryFn: async () => {
      const fechaInicio = format(subDays(new Date(), 6), 'yyyy-MM-dd')
      const fechaFin = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('surgeries')
        .select('fecha, operating_room_id, hora_inicio, hora_fin')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .is('deleted_at', null)
      if (error) throw error
      return data || []
    },
  })

  const { data: pabellonesActivos = [] } = useQuery({
    queryKey: ['pabellones-activos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operating_rooms')
        .select('id, nombre')
        .eq('activo', true)
        .is('deleted_at', null)
        .order('nombre', { ascending: true })
      if (error) throw error
      return data || []
    },
  })

  const hoy = format(new Date(), 'yyyy-MM-dd')
  const { data: ocupacion, isLoading: isLoadingOcupacion } = useQuery({
    queryKey: ['ocupacion-hoy', hoy],
    queryFn: async () => {
      const [{ data: cirugias }, { data: bloqueos }, { data: pabellones }] = await Promise.all([
        supabase.from('surgeries').select('operating_room_id').eq('fecha', hoy).is('deleted_at', null).in('estado', ['programada', 'en_proceso']),
        supabase.from('schedule_blocks').select('operating_room_id').eq('fecha', hoy).is('deleted_at', null).or(`vigencia_hasta.is.null,vigencia_hasta.gte.${hoy}`),
        supabase.from('operating_rooms').select('id').eq('activo', true).is('deleted_at', null),
      ])
      const totalPabellones = pabellones?.length || 0
      const ids = new Set([
        ...(cirugias?.map(c => c.operating_room_id) || []),
        ...(bloqueos?.map(b => b.operating_room_id) || []),
      ])
      const pabellonesOcupados = ids.size
      return {
        totalPabellones,
        pabellonesOcupados,
        porcentajeOcupacion: totalPabellones > 0 ? Math.round((pabellonesOcupados / totalPabellones) * 100) : 0,
        totalCirugias: cirugias?.length || 0,
      }
    },
  })

  const { data: tiempoPromedioCirugia } = useQuery({
    queryKey: ['tiempo-promedio-cirugia'],
    queryFn: async () => {
      const fechaInicio = format(subDays(new Date(), 30), 'yyyy-MM-dd')
      const { data: cirugias, error } = await supabase
        .from('surgeries')
        .select('hora_inicio, hora_fin')
        .gte('fecha', fechaInicio)
        .is('deleted_at', null)
        .in('estado', ['completada'])
      if (error) throw error
      if (!cirugias || cirugias.length === 0) return 0
      const tiempos = cirugias.map(c => {
        const inicio = new Date(`2000-01-01T${c.hora_inicio}`)
        const fin = new Date(`2000-01-01T${c.hora_fin}`)
        return (fin - inicio) / (1000 * 60)
      })
      return Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
    },
  })

  const { data: tasaUtilizacion } = useQuery({
    queryKey: ['tasa-utilizacion'],
    queryFn: async () => {
      const fechaInicio = format(subDays(new Date(), 6), 'yyyy-MM-dd')
      const fechaFin = format(new Date(), 'yyyy-MM-dd')
      const [{ data: cirugias }, { data: pabellones }] = await Promise.all([
        supabase.from('surgeries').select('operating_room_id, fecha').gte('fecha', fechaInicio).lte('fecha', fechaFin).is('deleted_at', null).in('estado', ['programada', 'en_proceso', 'completada']),
        supabase.from('operating_rooms').select('id').eq('activo', true).is('deleted_at', null),
      ])
      const totalPabellones = pabellones?.length || 0
      const slotsTotales = totalPabellones * 7 * 12
      const slotsOcupados = new Set(cirugias?.map(c => `${c.operating_room_id}-${c.fecha}`) || []).size
      return {
        porcentaje: slotsTotales > 0 ? Math.round((slotsOcupados / slotsTotales) * 100) : 0,
        slotsOcupados,
        slotsTotales,
      }
    },
  })

  const isLoading = isLoadingOcupacion || isLoadingSolicitudes

  const headerBtnClass = isDark ? STYLES.headerBtnDark : theme === 'medical' ? STYLES.headerBtnMedical : STYLES.headerBtnLight

  return (
    <div className={STYLES.page}>
      {/* Cabecera */}
      <div className={STYLES.header}>
        <div>
          <h2 className={isDark ? STYLES.titleDark : STYLES.titleLight}>Panel Administrativo</h2>
          <p className={STYLES.subtitle}>
            Gestión Clínica • {format(new Date(), 'MMMM yyyy', { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => lazyExport({
              cirugiasHoy,
              solicitudesPendientes,
              ocupacion,
              tiempoPromedio: tiempoPromedioCirugia,
              tasaUtilizacion,
            })}
            className={headerBtnClass}
            title="Exportar reporte a Excel"
          >
            <Download size={14} aria-hidden="true" /> Exportar
          </button>
          <button onClick={() => navigate('/pabellon/solicitudes')} className={headerBtnClass}>
            <Inbox size={14} className={STYLES.inboxIcon} aria-hidden="true" /> Solicitudes
          </button>
        </div>
      </div>

      {/* Banner órdenes sin agendar */}
      {ordenesNotificaciones.length > 0 && (
        <div className={isDark ? STYLES.bannerDark : STYLES.bannerLight} role="alert">
          <div className={isDark ? STYLES.bannerIconDark : STYLES.bannerIconLight}>
            <PhoneCall size={20} className={isDark ? 'text-orange-300' : 'text-orange-600'} aria-hidden="true" />
          </div>
          <div className={STYLES.bannerContent}>
            <p className={STYLES.bannerTitle}>
              {ordenesNotificaciones.length === 1
                ? '1 paciente con orden de hospitalización sin agendar'
                : `${ordenesNotificaciones.length} pacientes con orden de hospitalización sin agendar`}
            </p>
            <p className={isDark ? STYLES.bannerSubDark : STYLES.bannerSubLight}>
              Contactar al médico para ofrecer horas disponibles
            </p>
            <ul className={isDark ? STYLES.bannerListDark : STYLES.bannerListLight}>
              {ordenesNotificaciones.slice(0, 3).map(n => (
                <li key={n.id} className={STYLES.bannerListItem}>• {n.mensaje}</li>
              ))}
              {ordenesNotificaciones.length > 3 && (
                <li className={STYLES.bannerListMore}>+ {ordenesNotificaciones.length - 3} más...</li>
              )}
            </ul>
          </div>
          <div className={STYLES.bannerActions}>
            <button onClick={() => { marcarOrdenesVistas(); navigate('/pabellon/solicitudes') }} className={STYLES.bannerViewBtn}>
              Ver solicitudes
            </button>
            <button onClick={marcarOrdenesVistas} className={isDark ? STYLES.bannerMarkDark : STYLES.bannerMarkLight}>
              Marcar vistas
            </button>
          </div>
        </div>
      )}

      {/* Métricas KPI */}
      <DashboardMetrics
        solicitudesPendientes={solicitudesPendientes}
        cirugiasHoy={cirugiasHoy}
        ocupacion={ocupacion}
        tiempoPromedioCirugia={tiempoPromedioCirugia}
        tasaUtilizacion={tasaUtilizacion}
        isLoading={isLoading}
        onOpenCirugiasHoy={() => setShowCirugiasHoyModal(true)}
      />

      {/* Gráfico ocupación semanal */}
      <DashboardChart
        cirugiasSemana={cirugiasSemana}
        pabellonesActivos={pabellonesActivos}
        ocupacion={ocupacion}
      />

      {/* Panel inferior: solicitudes + recordatorios */}
      <div className={STYLES.bottomGrid}>
        <DashboardPendingRequests solicitudes={solicitudesPendientes} isLoading={isLoadingSolicitudes} />
        <DashboardReminders />
      </div>

      {/* Modal cirugías de hoy */}
      <Modal isOpen={showCirugiasHoyModal} onClose={() => setShowCirugiasHoyModal(false)} title="Cirugías programadas para hoy">
        <div className={STYLES.modalList}>
          {cirugiasHoy.length === 0 ? (
            <p className={STYLES.modalEmpty} role="status">No hay cirugías programadas para el día de hoy.</p>
          ) : (
            cirugiasHoy.map((cirugia) => (
              <div key={cirugia.id} className={STYLES.modalItem}>
                <div className={STYLES.modalItemContent}>
                  <p className={STYLES.modalItemName}>{cirugia.patients?.nombre} {cirugia.patients?.apellido}</p>
                  <p className={STYLES.modalItemMeta}>{cirugia.operating_rooms?.nombre || 'Pabellón'} • {cirugia.hora_inicio}–{cirugia.hora_fin}</p>
                  <p className={STYLES.modalItemEstado}>Estado: <span className={STYLES.fontSemibold}>{cirugia.estado}</span></p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
