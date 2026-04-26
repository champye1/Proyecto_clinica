import SkeletonLoader from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  card:      'bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8',
  metric:    'bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 flex items-center gap-5',
  flex1:     'flex-1',
  tableWrap: 'space-y-3',
  tableRow:  'flex gap-4',
}

/** Placeholder de tarjeta genérica mientras carga contenido largo (texto + CTA). */
export function CardSkeleton() {
  return (
    <div className={STYLES.card} role="status" aria-label="Cargando...">
      <SkeletonLoader height={24} width="60%" className="mb-4" />
      <SkeletonLoader height={16} count={3} className="mb-2" />
      <SkeletonLoader height={40} width="40%" />
    </div>
  )
}

/** Placeholder de tarjeta de métrica KPI (círculo + título + valor). */
export function MetricSkeleton() {
  return (
    <div className={STYLES.metric} role="status" aria-label="Cargando métrica...">
      <SkeletonLoader circle width={56} height={56} />
      <div className={STYLES.flex1}>
        <SkeletonLoader height={12} width="40%" className="mb-2" />
        <SkeletonLoader height={28} width="60%" />
      </div>
    </div>
  )
}

/**
 * Placeholder de tabla/lista mientras cargan las filas.
 * @param {number} [rows=5] - Número de filas de placeholder a mostrar
 */
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className={STYLES.tableWrap} role="status" aria-label="Cargando tabla...">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={STYLES.tableRow}>
          <SkeletonLoader height={60} width="100%" />
        </div>
      ))}
    </div>
  )
}

export default CardSkeleton
