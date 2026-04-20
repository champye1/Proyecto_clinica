import { ArrowRight, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/common/Card'
import { useTheme } from '@/contexts/ThemeContext'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  header:         'flex justify-between items-center mb-4 sm:mb-6 lg:mb-8',
  titleDark:      'font-black uppercase text-[10px] sm:text-xs flex items-center gap-2 text-white',
  titleLight:     'font-black uppercase text-[10px] sm:text-xs flex items-center gap-2 text-slate-800',
  viewAllBtn:     'text-[10px] sm:text-xs font-black text-blue-600 uppercase hover:underline touch-manipulation',
  list:           'space-y-3 sm:space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-1 sm:pr-2',
  skeletonDark:   'p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-800/50',
  skeletonLight:  'p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100',
  skeletonLineDark: 'h-4 rounded animate-pulse bg-slate-700',
  skeletonLineLight:'h-4 rounded animate-pulse bg-slate-200',
  empty:          'text-center py-4 text-[10px] sm:text-xs font-bold uppercase text-slate-400',
  itemDark:       'border-slate-700 hover:border-blue-600 bg-slate-800/50',
  itemMedical:    'border-blue-100 hover:border-blue-300 bg-white',
  itemLight:      'border-slate-100 hover:border-blue-100',
  itemBase:       'flex items-center justify-between p-4 sm:p-5 rounded-xl sm:rounded-2xl transition-all group cursor-pointer touch-manipulation active:scale-[0.98] border',
  itemInner:      'flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0 flex-1',
  itemAccent:     'w-1.5 sm:w-2 h-8 sm:h-10 rounded-full bg-blue-400 flex-shrink-0',
  itemNameDark:   'font-black text-sm sm:text-base truncate text-white',
  itemNameLight:  'font-black text-sm sm:text-base truncate text-slate-800',
  itemMeta:       'text-[9px] sm:text-[10px] font-bold uppercase truncate text-slate-400',
  itemArrow:      'opacity-0 group-hover:opacity-100 bg-blue-600 text-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all flex-shrink-0 ml-2',
  itemContent:    'min-w-0 flex-1',
  clipboardIcon:  'sm:w-4 sm:h-4 text-blue-500',
  arrowIcon:      'sm:w-[18px] sm:h-[18px]',
}

/**
 * Panel de solicitudes pendientes (top 5) del Dashboard de Pabellón.
 * Props:
 *   solicitudes  {Array}   — lista de solicitudes pendientes
 *   isLoading    {boolean}
 */
export default function DashboardPendingRequests({ solicitudes = [], isLoading = false }) {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const itemThemeClass = isDark ? STYLES.itemDark : theme === 'medical' ? STYLES.itemMedical : STYLES.itemLight

  return (
    <Card className="lg:col-span-2 flex flex-col">
      <div className={STYLES.header}>
        <h3 className={isDark ? STYLES.titleDark : STYLES.titleLight}>
          <ClipboardList size={14} className={STYLES.clipboardIcon} aria-hidden="true" />
          Solicitudes
        </h3>
        <button onClick={() => navigate('/pabellon/solicitudes')} className={STYLES.viewAllBtn}>
          Ver todas
        </button>
      </div>

      <div className={STYLES.list}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={isDark ? STYLES.skeletonDark : STYLES.skeletonLight}>
              <div className={`w-3/4 mb-2 ${isDark ? STYLES.skeletonLineDark : STYLES.skeletonLineLight}`} />
              <div className={`w-1/2 h-3 rounded ${isDark ? 'animate-pulse bg-slate-700' : 'animate-pulse bg-slate-200'}`} />
            </div>
          ))
        ) : solicitudes.length === 0 ? (
          <p className={STYLES.empty} role="status">No hay solicitudes pendientes</p>
        ) : (
          solicitudes.map((solicitud) => (
            <div
              key={solicitud.id}
              className={`${STYLES.itemBase} ${itemThemeClass}`}
              onClick={() => navigate('/pabellon/solicitudes')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/pabellon/solicitudes')}
            >
              <div className={STYLES.itemInner}>
                <div className={STYLES.itemAccent} aria-hidden="true" />
                <div className={STYLES.itemContent}>
                  <div className={isDark ? STYLES.itemNameDark : STYLES.itemNameLight}>
                    {solicitud.patients?.nombre} {solicitud.patients?.apellido}
                  </div>
                  <div className={STYLES.itemMeta}>
                    {solicitud.codigo_operacion} • Dr. {solicitud.doctors?.nombre} {solicitud.doctors?.apellido}
                  </div>
                </div>
              </div>
              <span className={STYLES.itemArrow}>
                <ArrowRight size={16} className={STYLES.arrowIcon} aria-hidden="true" />
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
