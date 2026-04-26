import { Activity } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { STYLES, TIPO_ACTIVIDAD } from './constants'

export default function TabActividad({ actividad }) {
  if (!actividad.length) return (
    <div className={STYLES.emptyState}>
      <Activity className={STYLES.emptyIcon} />
      <p className={STYLES.emptyTextSm}>No hay actividad registrada aún</p>
      <p className={STYLES.emptyTextXs}>Aquí aparecerán las acciones del equipo: cirugías aceptadas, bloqueos de horario, etc.</p>
    </div>
  )

  return (
    <div className={STYLES.tableWrap}>
      <table className={STYLES.table}>
        <thead>
          <tr className={STYLES.tableHead}>
            {['Fecha', 'Usuario', 'Acción', 'Descripción'].map(h => (
              <th key={h} className={STYLES.tableTh}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={STYLES.tableTbody}>
          {actividad.map(a => {
            const tipo = TIPO_ACTIVIDAD[a.tipo] || { label: a.tipo, cls: 'bg-slate-100 text-slate-500' }
            return (
              <tr key={a.id} className={STYLES.tableTr}>
                <td className={`${STYLES.tableCellSm} whitespace-nowrap`}>
                  {format(new Date(a.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                </td>
                <td className={STYLES.tableTd}>
                  <div className={STYLES.userNameCell}>{a.user?.nombre || '—'}</div>
                  <div className={STYLES.userEmailCell}>{a.user?.email || ''}</div>
                </td>
                <td className={STYLES.tableTd}>
                  <span className={`${STYLES.badge} ${tipo.cls}`}>{tipo.label}</span>
                </td>
                <td className={STYLES.tableCellMuted}>{a.descripcion}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
