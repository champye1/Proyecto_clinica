import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, eachDayOfInterval, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  BarChart2, Download, FileText, TrendingUp,
  Users, Clock, Activity, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import Card from '@/components/common/Card'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { fetchAnalyticsData, getPeriodDates } from '@/services/analyticsService'
import { exportAnalyticsReport } from '@/utils/exportExcel'
import { sanitizeString } from '@/utils/sanitizeInput'

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODOS = [
  { id: 'semana',    label: '7 días' },
  { id: 'mes',       label: '30 días' },
  { id: 'trimestre', label: '3 meses' },
  { id: 'año',       label: '1 año' },
  { id: 'custom',    label: 'Personalizado' },
]

const ESTADO_COLORS = {
  programada: '#2563eb',
  completada: '#16a34a',
  cancelada:  '#dc2626',
  en_proceso: '#d97706',
}

const ESTADO_LABELS = {
  programada: 'Programada',
  completada: 'Completada',
  cancelada:  'Cancelada',
  en_proceso: 'En Proceso',
}

const PAGE_SIZE = 15

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcDuration(h1, h2) {
  if (!h1 || !h2) return 0
  const ini = new Date(`2000-01-01T${h1}`)
  const fin = new Date(`2000-01-01T${h2}`)
  return Math.max((fin - ini) / (1000 * 60), 0)
}

function fmtDur(min) {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = {
  page:            'animate-in fade-in slide-in-from-bottom-4 duration-500',
  header:          'flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-8',
  titleDark:       'text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase text-white',
  titleLight:      'text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase text-slate-900',
  subtitle:        'font-bold text-[10px] sm:text-xs uppercase tracking-widest mt-1 text-slate-400',
  actionsRow:      'flex flex-wrap items-center gap-2',
  btnBase:         'px-4 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition-all touch-manipulation active:scale-95',
  btnDark:         'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700',
  btnLight:        'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm',
  btnMedical:      'bg-white border border-blue-200 text-slate-700 hover:bg-blue-50',
  periodRow:       'flex flex-wrap gap-2 mb-6 sm:mb-8',
  toggleGroup:     'inline-flex rounded-full bg-slate-100 text-[10px] sm:text-xs p-1',
  toggleActive:    'px-3 py-1.5 rounded-full font-bold uppercase tracking-tight transition-colors bg-blue-600 text-white shadow-sm',
  toggleInactive:  'px-3 py-1.5 rounded-full font-bold uppercase tracking-tight transition-colors bg-transparent text-slate-500 hover:text-slate-900',
  dateRow:         'flex flex-wrap items-center gap-2 text-xs mt-2',
  dateLabel:       'font-black uppercase text-[10px] text-slate-400',
  dateInput:       'text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
  kpiGrid:         'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8',
  chartsGrid:      'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8',
  chartTitle:      'font-black uppercase text-xs sm:text-sm flex items-center gap-2 mb-4',
  filterRow:       'flex flex-wrap gap-3 mb-4 items-end',
  filterGroup:     'flex flex-col gap-1',
  filterLabel:     'text-[10px] font-black uppercase text-slate-400',
  filterSelect:    'text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]',
  tableWrap:       'overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0',
  table:           'w-full text-xs border-collapse',
  th:              'text-left py-2.5 px-3 font-black uppercase tracking-wide text-slate-500 border-b-2 border-slate-100 whitespace-nowrap bg-slate-50/80',
  td:              'py-2.5 px-3 whitespace-nowrap text-slate-600',
  tdBold:          'py-2.5 px-3 whitespace-nowrap font-semibold text-slate-800',
  trRow:           'border-b border-slate-50 hover:bg-slate-50/60 transition-colors',
  pagination:      'flex items-center justify-between mt-4 pt-4 border-t border-slate-100',
  pageInfo:        'text-xs font-semibold text-slate-400',
  pageBtn:         'p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-600',
  emptyCell:       'text-center py-12 text-sm font-semibold text-slate-400',
  sectionLabel:    'font-black uppercase text-xs flex items-center gap-2',
  tableCardHeader: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4',
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color, loading, isDark }) {
  const bg = {
    blue:   isDark ? 'bg-blue-900/30 border-blue-800'     : 'bg-blue-50 border-blue-100',
    green:  isDark ? 'bg-green-900/30 border-green-800'   : 'bg-green-50 border-green-100',
    amber:  isDark ? 'bg-amber-900/30 border-amber-800'   : 'bg-amber-50 border-amber-100',
    indigo: isDark ? 'bg-indigo-900/30 border-indigo-800' : 'bg-indigo-50 border-indigo-100',
  }
  const ic = { blue: 'text-blue-500', green: 'text-green-500', amber: 'text-amber-500', indigo: 'text-indigo-500' }

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${bg[color]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg" />
          ) : (
            <p className={`text-2xl sm:text-3xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {value ?? '—'}
            </p>
          )}
          {sub && !loading && (
            <p className={`text-[10px] font-semibold mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{sub}</p>
          )}
        </div>
        <div className={`shrink-0 mt-1 ${ic[color]}`}><Icon size={22} /></div>
      </div>
    </div>
  )
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ isDark, ...rest }) {
  return (
    <Tooltip
      contentStyle={{
        borderRadius: '0.75rem',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        backgroundColor: isDark ? '#1e293b' : '#fff',
        fontSize: '11px',
        color: isDark ? '#fff' : '#0f172a',
        padding: '10px 14px',
      }}
      labelStyle={{ fontWeight: 700, marginBottom: 4, color: isDark ? '#fff' : '#0f172a' }}
      itemStyle={{ color: isDark ? '#cbd5e1' : '#475569' }}
      {...rest}
    />
  )
}

// ─── Estado Badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }) {
  const classes = {
    programada: 'text-blue-700 bg-blue-50 border-blue-200',
    completada: 'text-green-700 bg-green-50 border-green-200',
    cancelada:  'text-red-600 bg-red-50 border-red-200',
    en_proceso: 'text-amber-700 bg-amber-50 border-amber-200',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${classes[estado] || 'text-slate-600 bg-slate-50 border-slate-200'}`}>
      {ESTADO_LABELS[estado] || estado}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Reportes() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [periodo, setPeriodo]         = useState('mes')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd]     = useState('')
  const [filtroRoom, setFiltroRoom]   = useState('todos')
  const [filtroDoc, setFiltroDoc]     = useState('todos')
  const [filtroEst, setFiltroEst]     = useState('todos')
  const [page, setPage]               = useState(0)

  const { start, end } = useMemo(
    () => getPeriodDates(periodo, customStart, customEnd),
    [periodo, customStart, customEnd]
  )

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', start, end],
    queryFn:  () => fetchAnalyticsData(start, end),
    staleTime: 5 * 60 * 1000,
    enabled:   !!(start && end),
  })

  // Reset table page when filters change
  useEffect(() => { setPage(0) }, [filtroRoom, filtroDoc, filtroEst, start, end])

  // ── Filtered surgeries ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!data?.surgeries) return []
    return data.surgeries.filter(s => {
      if (filtroRoom !== 'todos' && s.operating_rooms?.id !== filtroRoom) return false
      if (filtroDoc  !== 'todos' && s.doctors?.id !== filtroDoc)          return false
      if (filtroEst  !== 'todos' && s.estado !== filtroEst)               return false
      return true
    })
  }, [data, filtroRoom, filtroDoc, filtroEst])

  // ── KPI computations ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total      = filtered.length
    const completadas = filtered.filter(s => s.estado === 'completada').length
    const tasa       = total > 0 ? Math.round((completadas / total) * 100) : 0
    const durations  = filtered.map(s => calcDuration(s.hora_inicio, s.hora_fin)).filter(Boolean)
    const totalMin   = durations.reduce((a, b) => a + b, 0)
    const avgMin     = durations.length > 0 ? Math.round(totalMin / durations.length) : 0
    const totalHoras = Math.round(totalMin / 60 * 10) / 10
    return { total, completadas, tasa, avgMin, totalHoras, totalRequests: data?.requests?.length ?? 0 }
  }, [filtered, data])

  // ── Daily area chart data ─────────────────────────────────────────────────
  const dailyData = useMemo(() => {
    if (!start || !end) return []
    const startD = new Date(start + 'T00:00:00')
    const endD   = new Date(end   + 'T00:00:00')
    const diffDays = Math.round((endD - startD) / (1000 * 60 * 60 * 24))

    const byDay = {}
    filtered.forEach(s => {
      if (!byDay[s.fecha]) byDay[s.fecha] = { total: 0, completadas: 0 }
      byDay[s.fecha].total++
      if (s.estado === 'completada') byDay[s.fecha].completadas++
    })

    if (diffDays > 60) {
      // Group by month for long periods
      const byMonth = {}
      filtered.forEach(s => {
        const key = s.fecha.substring(0, 7)
        if (!byMonth[key]) byMonth[key] = { total: 0, completadas: 0 }
        byMonth[key].total++
        if (s.estado === 'completada') byMonth[key].completadas++
      })
      return Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => ({
          fecha: format(new Date(key + '-15'), 'MMM yy', { locale: es }),
          ...val,
        }))
    }

    const days = eachDayOfInterval({ start: startD, end: endD })
    return days.map(d => {
      const key = format(d, 'yyyy-MM-dd')
      const val = byDay[key] || { total: 0, completadas: 0 }
      return {
        fecha: format(d, diffDays <= 14 ? 'dd/MM' : 'dd/MM', { locale: es }),
        ...val,
      }
    })
  }, [filtered, start, end])

  // ── Status pie data ───────────────────────────────────────────────────────
  const statusData = useMemo(() => {
    const counts = {}
    filtered.forEach(s => { counts[s.estado] = (counts[s.estado] || 0) + 1 })
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name:  ESTADO_LABELS[key] || key,
        value,
        color: ESTADO_COLORS[key] || '#94a3b8',
      }))
      .sort((a, b) => b.value - a.value)
  }, [filtered])

  // ── Top doctors bar data ──────────────────────────────────────────────────
  const doctorData = useMemo(() => {
    const map = {}
    filtered.forEach(s => {
      if (!s.doctors) return
      const k = s.doctors.id
      if (!map[k]) map[k] = { name: `${s.doctors.apellido}, ${s.doctors.nombre}`, cirugias: 0 }
      map[k].cirugias++
    })
    return Object.values(map).sort((a, b) => b.cirugias - a.cirugias).slice(0, 8)
  }, [filtered])

  // ── Room utilization data ─────────────────────────────────────────────────
  const roomData = useMemo(() => {
    const map = {}
    filtered.forEach(s => {
      if (!s.operating_rooms) return
      const k = s.operating_rooms.id
      if (!map[k]) map[k] = { nombre: s.operating_rooms.nombre, cirugias: 0, horas: 0 }
      map[k].cirugias++
      map[k].horas += calcDuration(s.hora_inicio, s.hora_fin) / 60
    })
    return Object.values(map)
      .sort((a, b) => b.horas - a.horas)
      .map(r => ({ ...r, horas: Math.round(r.horas * 10) / 10 }))
  }, [filtered])

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const tableRows  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // ── Exports ───────────────────────────────────────────────────────────────
  const handleExcel = useCallback(() => {
    exportAnalyticsReport({
      surgeries: filtered,
      requests:  data?.requests ?? [],
      kpis,
      periodo:   `${start} al ${end}`,
    })
  }, [filtered, data, kpis, start, end])

  const handlePrint = useCallback(() => {
    const style = document.createElement('style')
    style.id = '__print_rpt'
    style.textContent = `
      @media print {
        aside, [data-sidebar] { display: none !important; }
        .no-print { display: none !important; }
        body { font-size: 10pt; background: white !important; }
        @page { margin: 1.5cm; }
        .recharts-wrapper { break-inside: avoid; }
      }
    `
    document.head.appendChild(style)
    window.print()
    window.addEventListener('afterprint', () => {
      document.getElementById('__print_rpt')?.remove()
    }, { once: true })
  }, [])

  // ── Theme helpers ─────────────────────────────────────────────────────────
  const btnClass    = `${STYLES.btnBase} ${isDark ? STYLES.btnDark : theme === 'medical' ? STYLES.btnMedical : STYLES.btnLight}`
  const chartColor  = isDark ? '#94a3b8' : '#64748b'
  const gridColor   = isDark ? '#334155' : '#e2e8f0'
  const chartTitle  = `${STYLES.chartTitle} ${isDark ? 'text-white' : 'text-slate-800'}`
  const xInterval   = dailyData.length > 20 ? Math.floor(dailyData.length / 8) : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className={STYLES.page} id="reportes-area">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={STYLES.header}>
        <div>
          <h2 className={`${isDark ? STYLES.titleDark : STYLES.titleLight} flex items-center gap-3`}>
            <BarChart2 size={28} className="text-blue-500 shrink-0" />
            Reportes y Analytics
          </h2>
          <p className={STYLES.subtitle}>
            {format(new Date(start), "d 'de' MMMM", { locale: es })} —{' '}
            {format(new Date(end),   "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className={`${STYLES.actionsRow} no-print`}>
          <button onClick={handleExcel} className={btnClass} title="Exportar a Excel (.xlsx)">
            <Download size={14} /> Excel
          </button>
          <button onClick={handlePrint} className={btnClass} title="Imprimir / Guardar como PDF">
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* ── Period selector ──────────────────────────────────────────────── */}
      <div className={`${STYLES.periodRow} no-print`}>
        <div className={STYLES.toggleGroup}>
          {PERIODOS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodo(p.id)}
              className={periodo === p.id ? STYLES.toggleActive : STYLES.toggleInactive}
            >
              {p.label}
            </button>
          ))}
        </div>
        {periodo === 'custom' && (
          <div className={STYLES.dateRow}>
            <span className={STYLES.dateLabel}>Desde</span>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className={STYLES.dateInput}
              max={customEnd || format(new Date(), 'yyyy-MM-dd')}
            />
            <span className={STYLES.dateLabel}>Hasta</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className={STYLES.dateInput}
              min={customStart || undefined}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        )}
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className={STYLES.kpiGrid}>
        <KpiCard
          label="Total Cirugías"
          value={kpis.total}
          sub="en el período seleccionado"
          icon={Activity}
          color="blue"
          loading={isLoading}
          isDark={isDark}
        />
        <KpiCard
          label="Tasa Completadas"
          value={`${kpis.tasa}%`}
          sub={`${kpis.completadas} de ${kpis.total} completadas`}
          icon={TrendingUp}
          color="green"
          loading={isLoading}
          isDark={isDark}
        />
        <KpiCard
          label="Horas Quirúrgicas"
          value={`${kpis.totalHoras}h`}
          sub="tiempo operado total"
          icon={Clock}
          color="amber"
          loading={isLoading}
          isDark={isDark}
        />
        <KpiCard
          label="Duración Promedio"
          value={fmtDur(kpis.avgMin)}
          sub="por cirugía completada"
          icon={Users}
          color="indigo"
          loading={isLoading}
          isDark={isDark}
        />
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      <div className={STYLES.chartsGrid}>
        {/* Chart 1 — Cirugías por período */}
        <Card hover={false}>
          <h3 className={chartTitle}>
            <TrendingUp size={15} className="text-blue-500" />
            Cirugías por Período
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={dailyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="aTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="aComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="fecha"
                tick={{ fill: chartColor, fontSize: 10, fontWeight: 600 }}
                stroke={gridColor}
                interval={xInterval}
              />
              <YAxis
                tick={{ fill: chartColor, fontSize: 10, fontWeight: 600 }}
                stroke={gridColor}
                allowDecimals={false}
              />
              <ChartTooltip
                isDark={isDark}
                formatter={(v, n) => [v, n === 'total' ? 'Total' : 'Completadas']}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={v => v === 'total' ? 'Total' : 'Completadas'}
              />
              <Area type="monotone" dataKey="total"      stroke="#2563eb" fill="url(#aTotal)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="completadas" stroke="#16a34a" fill="url(#aComp)"  strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Chart 2 — Estado distribución */}
        <Card hover={false}>
          <h3 className={chartTitle}>
            <Activity size={15} className="text-blue-500" />
            Distribución por Estado
          </h3>
          {statusData.length === 0 ? (
            <p className={STYLES.emptyCell}>Sin datos en el período</p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip isDark={isDark} formatter={(v, n) => [v + ' cirugías', n]} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                  formatter={(v, entry) => `${v} (${entry.payload.value})`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Chart 3 — Top médicos */}
        <Card hover={false}>
          <h3 className={chartTitle}>
            <Users size={15} className="text-blue-500" />
            Top Médicos
          </h3>
          {doctorData.length === 0 ? (
            <p className={STYLES.emptyCell}>Sin datos en el período</p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={doctorData}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: chartColor, fontSize: 10, fontWeight: 600 }}
                  stroke={gridColor}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: chartColor, fontSize: 10, fontWeight: 600 }}
                  stroke={gridColor}
                  width={95}
                  tickFormatter={v => v.length > 15 ? v.slice(0, 15) + '…' : v}
                />
                <ChartTooltip isDark={isDark} formatter={(v) => [v, 'Cirugías']} />
                <Bar dataKey="cirugias" fill="#2563eb" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Chart 4 — Pabellones */}
        <Card hover={false}>
          <h3 className={chartTitle}>
            <Clock size={15} className="text-blue-500" />
            Horas Operadas por Pabellón
          </h3>
          {roomData.length === 0 ? (
            <p className={STYLES.emptyCell}>Sin datos en el período</p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={roomData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="nombre" tick={{ fill: chartColor, fontSize: 10, fontWeight: 600 }} stroke={gridColor} />
                <YAxis tick={{ fill: chartColor, fontSize: 10, fontWeight: 600 }} stroke={gridColor} />
                <ChartTooltip
                  isDark={isDark}
                  formatter={(v, n) => [n === 'horas' ? `${v} h` : v, n === 'horas' ? 'Horas operadas' : 'Cirugías']}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={v => v === 'horas' ? 'Horas' : 'Cirugías'} />
                <Bar dataKey="cirugias" fill="#2563eb" radius={[6, 6, 0, 0]} name="cirugias" />
                <Bar dataKey="horas"    fill="#16a34a" radius={[6, 6, 0, 0]} name="horas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Tabla detallada ───────────────────────────────────────────────── */}
      <Card hover={false}>
        <div className={STYLES.tableCardHeader}>
          <h3 className={`${STYLES.sectionLabel} ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <FileText size={15} className="text-blue-500" />
            Detalle de Cirugías
            <span className="text-slate-400 font-semibold normal-case text-xs">
              ({filtered.length} registros)
            </span>
          </h3>
        </div>

        {/* Filtros */}
        <div className={`${STYLES.filterRow} no-print`}>
          <div className={STYLES.filterGroup}>
            <label className={STYLES.filterLabel}>Pabellón</label>
            <select
              value={filtroRoom}
              onChange={e => setFiltroRoom(sanitizeString(e.target.value))}
              className={STYLES.filterSelect}
            >
              <option value="todos">Todos</option>
              {(data?.rooms ?? []).map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
          <div className={STYLES.filterGroup}>
            <label className={STYLES.filterLabel}>Médico</label>
            <select
              value={filtroDoc}
              onChange={e => setFiltroDoc(sanitizeString(e.target.value))}
              className={STYLES.filterSelect}
            >
              <option value="todos">Todos</option>
              {(data?.doctors ?? []).map(d => (
                <option key={d.id} value={d.id}>{d.apellido}, {d.nombre}</option>
              ))}
            </select>
          </div>
          <div className={STYLES.filterGroup}>
            <label className={STYLES.filterLabel}>Estado</label>
            <select
              value={filtroEst}
              onChange={e => setFiltroEst(sanitizeString(e.target.value))}
              className={STYLES.filterSelect}
            >
              <option value="todos">Todos</option>
              {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className={STYLES.tableWrap}>
          <table className={STYLES.table}>
            <thead>
              <tr>
                {['Fecha', 'Paciente', 'RUT', 'Doctor', 'Especialidad', 'Pabellón', 'Inicio', 'Fin', 'Duración', 'Estado'].map(col => (
                  <th key={col} className={STYLES.th}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className={STYLES.emptyCell}>
                    No hay cirugías que coincidan con los filtros aplicados
                  </td>
                </tr>
              ) : (
                tableRows.map(s => (
                  <tr key={s.id} className={STYLES.trRow}>
                    <td className={STYLES.tdBold}>
                      {s.fecha ? format(new Date(s.fecha + 'T12:00:00'), 'dd/MM/yy') : '—'}
                    </td>
                    <td className={STYLES.tdBold}>
                      {s.patients ? `${s.patients.nombre} ${s.patients.apellido}` : '—'}
                    </td>
                    <td className={STYLES.td}>{s.patients?.rut || '—'}</td>
                    <td className={STYLES.td}>
                      {s.doctors ? `${s.doctors.apellido}, ${s.doctors.nombre}` : '—'}
                    </td>
                    <td className={STYLES.td}>{s.doctors?.especialidad || '—'}</td>
                    <td className={STYLES.td}>{s.operating_rooms?.nombre || '—'}</td>
                    <td className={STYLES.td}>{s.hora_inicio || '—'}</td>
                    <td className={STYLES.td}>{s.hora_fin || '—'}</td>
                    <td className={STYLES.td}>{fmtDur(calcDuration(s.hora_inicio, s.hora_fin))}</td>
                    <td className={STYLES.td}><EstadoBadge estado={s.estado} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className={`${STYLES.pagination} no-print`}>
            <span className={STYLES.pageInfo}>
              Página {page + 1} de {totalPages} · {filtered.length} registros
            </span>
            <div className="flex items-center gap-1">
              <button
                className={STYLES.pageBtn}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className={STYLES.pageBtn}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                aria-label="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
