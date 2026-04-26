import { Activity, Inbox, TrendingUp, LayoutGrid, Timer, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/common/Card'
import Tooltip from '@/components/common/Tooltip'
import { MetricSkeleton } from '@/components/common/Skeleton'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  metricsGrid:  'grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-10',
  cardInner:    'p-4 sm:p-5 lg:p-6 flex items-center gap-3 sm:gap-4 lg:gap-5',
  iconBox:      'p-3 sm:p-3.5 lg:p-4 rounded-xl sm:rounded-2xl flex-shrink-0',
  statLabel:    'text-[9px] sm:text-[10px] font-black uppercase truncate text-slate-400',
  statValueDark:'text-lg sm:text-xl lg:text-2xl font-black truncate text-white',
  statValueLight:'text-lg sm:text-xl lg:text-2xl font-black truncate text-slate-800',
  statContent:   'min-w-0 flex-1',
  statIconSm:    'sm:w-5 sm:h-5 lg:w-6 lg:h-6',
}

/**
 * Las 6 tarjetas KPI del Dashboard de Pabellón.
 * Props:
 *   solicitudesPendientes   {Array}   — solicitudes con estado 'pendiente'
 *   cirugiasHoy             {Array}   — cirugías del día
 *   ocupacion               {object}  — { porcentajeOcupacion, pabellonesOcupados, totalPabellones }
 *   tiempoPromedioCirugia   {number}  — minutos promedio (últimos 30 días)
 *   tasaUtilizacion         {object}  — { porcentaje, slotsOcupados }
 *   isLoading               {boolean}
 *   onOpenCirugiasHoy       {Function} — abre el modal de cirugías de hoy
 */
export default function DashboardMetrics({
  solicitudesPendientes = [],
  cirugiasHoy = [],
  ocupacion,
  tiempoPromedioCirugia,
  tasaUtilizacion,
  isLoading = false,
  onOpenCirugiasHoy,
}) {
  const { theme } = useTheme()
  const navigate = useNavigate()

  const t = tc(theme)
  const isDark = theme === 'dark'

  const primaryStats = [
    {
      id: 'pendientes',
      label: 'Solicitudes pendientes',
      value: solicitudesPendientes.length.toString(),
      icon: Inbox,
      color: isDark ? 'text-blue-400' : 'text-blue-600',
      bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
      tooltip: 'Solicitudes de cirugía pendientes de revisión',
      onClick: () => navigate('/pabellon/solicitudes'),
    },
    {
      id: 'cirugias-hoy',
      label: 'Cirugías Hoy',
      value: cirugiasHoy.length.toString(),
      icon: Activity,
      color: isDark ? 'text-green-400' : 'text-green-600',
      bg: isDark ? 'bg-green-900/30' : 'bg-green-50',
      tooltip: 'Ver detalle de todas las cirugías programadas para hoy',
      onClick: onOpenCirugiasHoy,
    },
    {
      id: 'ocupacion-hoy',
      label: 'Ocupación',
      value: `${ocupacion?.porcentajeOcupacion || 0}%`,
      icon: TrendingUp,
      color: isDark ? 'text-amber-400' : 'text-amber-600',
      bg: isDark ? 'bg-amber-900/30' : 'bg-amber-50',
      tooltip: `Ver calendario de hoy (${ocupacion?.pabellonesOcupados || 0}/${ocupacion?.totalPabellones || 0} pabellones ocupados)`,
      onClick: () => {
        try { sessionStorage.setItem('calendario_ir_hoy', 'day') } catch (_) {}
        navigate('/pabellon/calendario')
      },
    },
  ]

  const secondaryStats = [
    {
      id: 'pabellones-libres',
      label: 'Bloques libres',
      value: `${(ocupacion?.totalPabellones ?? 0) - (ocupacion?.pabellonesOcupados ?? 0)}`,
      icon: LayoutGrid,
      color: isDark ? 'text-purple-400' : 'text-purple-600',
      bg: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
      tooltip: 'Ver disponibilidad de pabellones para hoy en el calendario',
      onClick: () => {
        try { sessionStorage.setItem('calendario_ir_hoy', 'day') } catch (_) {}
        navigate('/pabellon/calendario')
      },
    },
    {
      id: 'tiempo-promedio',
      label: 'Tiempo promedio por paciente',
      value: tiempoPromedioCirugia
        ? `${Math.floor(tiempoPromedioCirugia / 60)}h ${tiempoPromedioCirugia % 60}m`
        : 'N/A',
      icon: Timer,
      color: isDark ? 'text-indigo-400' : 'text-indigo-600',
      bg: isDark ? 'bg-indigo-900/30' : 'bg-indigo-50',
      tooltip: 'Tiempo promedio de cirugía por paciente (últimos 30 días)',
      onClick: undefined,
    },
    {
      id: 'utilizacion-7d',
      label: 'Utilización 7d',
      value: `${tasaUtilizacion?.porcentaje || 0}%`,
      icon: BarChart3,
      color: isDark ? 'text-teal-400' : 'text-teal-600',
      bg: isDark ? 'bg-teal-900/30' : 'bg-teal-50',
      tooltip: `Ver detalle de ocupación semanal (${tasaUtilizacion?.slotsOcupados || 0} días con uso)`,
      onClick: () => {
        document.getElementById('ocupacion-semanal')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      },
    },
  ]

  const StatCard = ({ stat }) => (
    <Tooltip content={stat.tooltip}>
      <Card
        hover={!!stat.onClick}
        onClick={stat.onClick}
        className={`${STYLES.cardInner} ${stat.onClick ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className={`${STYLES.iconBox} ${stat.bg} ${stat.color}`}>
          <stat.icon size={18} className={STYLES.statIconSm} />
        </div>
        <div className={STYLES.statContent}>
          <div className={STYLES.statLabel}>{stat.label}</div>
          <div className={isDark ? STYLES.statValueDark : STYLES.statValueLight}>{stat.value}</div>
        </div>
      </Card>
    </Tooltip>
  )

  if (isLoading) {
    return (
      <>
        <div className={STYLES.metricsGrid}>
          {Array.from({ length: 3 }).map((_, i) => <MetricSkeleton key={i} />)}
        </div>
        <div className={STYLES.metricsGrid}>
          {Array.from({ length: 3 }).map((_, i) => <MetricSkeleton key={i} />)}
        </div>
      </>
    )
  }

  return (
    <>
      <div className={STYLES.metricsGrid}>
        {primaryStats.map(stat => <StatCard key={stat.id} stat={stat} />)}
      </div>
      <div className={STYLES.metricsGrid}>
        {secondaryStats.map(stat => <StatCard key={stat.id} stat={stat} />)}
      </div>
    </>
  )
}
