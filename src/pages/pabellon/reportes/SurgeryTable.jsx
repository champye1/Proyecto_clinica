import { format } from 'date-fns'
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import Card from '@/components/common/Card'
import { sanitizeString } from '@/utils/sanitizeInput'
import { STYLES, ESTADO_LABELS, PAGE_SIZE, calcDuration, fmtDur } from './constants'
import EstadoBadge from './EstadoBadge'

export default function SurgeryTable({
  filtered, data, isDark,
  filtroRoom, setFiltroRoom,
  filtroDoc, setFiltroDoc,
  filtroEst, setFiltroEst,
  page, setPage,
}) {
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const tableRows  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
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

      <div className={`${STYLES.filterRow} no-print`}>
        <div className={STYLES.filterGroup}>
          <label className={STYLES.filterLabel}>Pabellón</label>
          <select value={filtroRoom} onChange={e => setFiltroRoom(sanitizeString(e.target.value))} className={STYLES.filterSelect}>
            <option value="todos">Todos</option>
            {(data?.rooms ?? []).map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </div>
        <div className={STYLES.filterGroup}>
          <label className={STYLES.filterLabel}>Médico</label>
          <select value={filtroDoc} onChange={e => setFiltroDoc(sanitizeString(e.target.value))} className={STYLES.filterSelect}>
            <option value="todos">Todos</option>
            {(data?.doctors ?? []).map(d => <option key={d.id} value={d.id}>{d.apellido}, {d.nombre}</option>)}
          </select>
        </div>
        <div className={STYLES.filterGroup}>
          <label className={STYLES.filterLabel}>Estado</label>
          <select value={filtroEst} onChange={e => setFiltroEst(sanitizeString(e.target.value))} className={STYLES.filterSelect}>
            <option value="todos">Todos</option>
            {Object.entries(ESTADO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

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
            ) : tableRows.map(s => (
              <tr key={s.id} className={STYLES.trRow}>
                <td className={STYLES.tdBold}>
                  {s.fecha ? format(new Date(s.fecha + 'T12:00:00'), 'dd/MM/yy') : '—'}
                </td>
                <td className={STYLES.tdBold}>
                  {s.patients ? `${s.patients.nombre} ${s.patients.apellido}` : '—'}
                </td>
                <td className={STYLES.td}>{s.patients?.rut || '—'}</td>
                <td className={STYLES.td}>{s.doctors ? `${s.doctors.apellido}, ${s.doctors.nombre}` : '—'}</td>
                <td className={STYLES.td}>{s.doctors?.especialidad || '—'}</td>
                <td className={STYLES.td}>{s.operating_rooms?.nombre || '—'}</td>
                <td className={STYLES.td}>{s.hora_inicio || '—'}</td>
                <td className={STYLES.td}>{s.hora_fin || '—'}</td>
                <td className={STYLES.td}>{fmtDur(calcDuration(s.hora_inicio, s.hora_fin))}</td>
                <td className={STYLES.td}><EstadoBadge estado={s.estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={`${STYLES.pagination} no-print`}>
          <span className={STYLES.pageInfo}>
            Página {page + 1} de {totalPages} · {filtered.length} registros
          </span>
          <div className="flex items-center gap-1">
            <button className={STYLES.pageBtn} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} aria-label="Página anterior">
              <ChevronLeft size={16} />
            </button>
            <button className={STYLES.pageBtn} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} aria-label="Página siguiente">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
