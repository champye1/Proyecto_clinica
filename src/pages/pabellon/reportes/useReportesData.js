import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { fetchAnalyticsData, getPeriodDates } from '@/services/analyticsService'
import { exportAnalyticsReport } from '@/utils/exportExcel'
import { ESTADO_COLORS, ESTADO_LABELS, calcDuration } from './constants'

export default function useReportesData() {
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

  useEffect(() => { setPage(0) }, [filtroRoom, filtroDoc, filtroEst, start, end])

  const filtered = useMemo(() => {
    if (!data?.surgeries) return []
    return data.surgeries.filter(s => {
      if (filtroRoom !== 'todos' && s.operating_rooms?.id !== filtroRoom) return false
      if (filtroDoc  !== 'todos' && s.doctors?.id !== filtroDoc)          return false
      if (filtroEst  !== 'todos' && s.estado !== filtroEst)               return false
      return true
    })
  }, [data, filtroRoom, filtroDoc, filtroEst])

  const kpis = useMemo(() => {
    const total       = filtered.length
    const completadas = filtered.filter(s => s.estado === 'completada').length
    const tasa        = total > 0 ? Math.round((completadas / total) * 100) : 0
    const durations   = filtered.map(s => calcDuration(s.hora_inicio, s.hora_fin)).filter(Boolean)
    const totalMin    = durations.reduce((a, b) => a + b, 0)
    const avgMin      = durations.length > 0 ? Math.round(totalMin / durations.length) : 0
    const totalHoras  = Math.round(totalMin / 60 * 10) / 10
    return { total, completadas, tasa, avgMin, totalHoras, totalRequests: data?.requests?.length ?? 0 }
  }, [filtered, data])

  const dailyData = useMemo(() => {
    if (!start || !end) return []
    const startD    = new Date(start + 'T00:00:00')
    const endD      = new Date(end   + 'T00:00:00')
    const diffDays  = Math.round((endD - startD) / (1000 * 60 * 60 * 24))

    const byDay = {}
    filtered.forEach(s => {
      if (!byDay[s.fecha]) byDay[s.fecha] = { total: 0, completadas: 0 }
      byDay[s.fecha].total++
      if (s.estado === 'completada') byDay[s.fecha].completadas++
    })

    if (diffDays > 60) {
      const byMonth = {}
      filtered.forEach(s => {
        const key = s.fecha.substring(0, 7)
        if (!byMonth[key]) byMonth[key] = { total: 0, completadas: 0 }
        byMonth[key].total++
        if (s.estado === 'completada') byMonth[key].completadas++
      })
      return Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => ({ fecha: format(new Date(key + '-15'), 'MMM yy', { locale: es }), ...val }))
    }

    const days = eachDayOfInterval({ start: startD, end: endD })
    return days.map(d => {
      const key = format(d, 'yyyy-MM-dd')
      const val = byDay[key] || { total: 0, completadas: 0 }
      return { fecha: format(d, 'dd/MM', { locale: es }), ...val }
    })
  }, [filtered, start, end])

  const statusData = useMemo(() => {
    const counts = {}
    filtered.forEach(s => { counts[s.estado] = (counts[s.estado] || 0) + 1 })
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({ name: ESTADO_LABELS[key] || key, value, color: ESTADO_COLORS[key] || '#94a3b8' }))
      .sort((a, b) => b.value - a.value)
  }, [filtered])

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

  const handleExcel = useCallback(() => {
    exportAnalyticsReport({ surgeries: filtered, requests: data?.requests ?? [], kpis, periodo: `${start} al ${end}` })
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
    window.addEventListener('afterprint', () => { document.getElementById('__print_rpt')?.remove() }, { once: true })
  }, [])

  return {
    periodo, setPeriodo,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    filtroRoom, setFiltroRoom,
    filtroDoc, setFiltroDoc,
    filtroEst, setFiltroEst,
    page, setPage,
    start, end,
    data, isLoading,
    filtered, kpis,
    dailyData, statusData, doctorData, roomData,
    handleExcel, handlePrint,
  }
}
