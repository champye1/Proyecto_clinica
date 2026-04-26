import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart2, Download, FileText, TrendingUp, Users, Clock, Activity } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import KpiCard     from './KpiCard'
import ChartsGrid  from './ChartsGrid'
import SurgeryTable from './SurgeryTable'
import useReportesData from './useReportesData'
import { STYLES, PERIODOS, fmtDur } from './constants'

export default function Reportes() {
  const { theme } = useTheme()
  const t = tc(theme)
  const isDark = theme === 'dark'
  const themeKey = isDark ? 'Dark' : theme === 'medical' ? 'Medical' : 'Light'

  const {
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
  } = useReportesData()

  const btnClass = `${STYLES.btnBase} ${STYLES[`btn${themeKey}`]}`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className={STYLES.page} id="reportes-area">
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

      <div className={`${STYLES.periodRow} no-print`}>
        <div className={STYLES.toggleGroup}>
          {PERIODOS.map(p => (
            <button key={p.id} type="button" onClick={() => setPeriodo(p.id)}
              className={periodo === p.id ? STYLES.toggleActive : STYLES.toggleInactive}>
              {p.label}
            </button>
          ))}
        </div>
        {periodo === 'custom' && (
          <div className={STYLES.dateRow}>
            <span className={STYLES.dateLabel}>Desde</span>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className={STYLES.dateInput} max={customEnd || format(new Date(), 'yyyy-MM-dd')} />
            <span className={STYLES.dateLabel}>Hasta</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className={STYLES.dateInput} min={customStart || undefined} max={format(new Date(), 'yyyy-MM-dd')} />
          </div>
        )}
      </div>

      <div className={STYLES.kpiGrid}>
        <KpiCard label="Total Cirugías" value={kpis.total} sub="en el período seleccionado"
          icon={Activity} color="blue" loading={isLoading} isDark={isDark} />
        <KpiCard label="Tasa Completadas" value={`${kpis.tasa}%`} sub={`${kpis.completadas} de ${kpis.total} completadas`}
          icon={TrendingUp} color="green" loading={isLoading} isDark={isDark} />
        <KpiCard label="Horas Quirúrgicas" value={`${kpis.totalHoras}h`} sub="tiempo operado total"
          icon={Clock} color="amber" loading={isLoading} isDark={isDark} />
        <KpiCard label="Duración Promedio" value={fmtDur(kpis.avgMin)} sub="por cirugía completada"
          icon={Users} color="indigo" loading={isLoading} isDark={isDark} />
      </div>

      <ChartsGrid dailyData={dailyData} statusData={statusData} doctorData={doctorData} roomData={roomData} isDark={isDark} />

      <SurgeryTable
        filtered={filtered} data={data} isDark={isDark}
        filtroRoom={filtroRoom} setFiltroRoom={setFiltroRoom}
        filtroDoc={filtroDoc}   setFiltroDoc={setFiltroDoc}
        filtroEst={filtroEst}   setFiltroEst={setFiltroEst}
        page={page} setPage={setPage}
      />
    </div>
  )
}
