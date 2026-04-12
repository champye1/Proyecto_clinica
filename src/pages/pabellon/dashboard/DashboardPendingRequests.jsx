import { ArrowRight, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/common/Card'
import { useTheme } from '../../../contexts/ThemeContext'

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

  return (
    <Card className="lg:col-span-2 flex flex-col">
      <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
        <h3 className={`font-black uppercase text-[10px] sm:text-xs flex items-center gap-2 ${
          isDark ? 'text-white' : 'text-slate-800'
        }`}>
          <ClipboardList size={14} className="sm:w-4 sm:h-4 text-blue-500" aria-hidden="true" />
          Solicitudes
        </h3>
        <button
          onClick={() => navigate('/pabellon/solicitudes')}
          className="text-[10px] sm:text-xs font-black text-blue-600 uppercase hover:underline touch-manipulation"
        >
          Ver todas
        </button>
      </div>

      <div className="space-y-3 sm:space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-1 sm:pr-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border ${
                isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100'
              }`}
            >
              <div className={`h-4 rounded w-3/4 mb-2 animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
              <div className={`h-3 rounded w-1/2 animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            </div>
          ))
        ) : solicitudes.length === 0 ? (
          <p className={`text-center py-4 text-[10px] sm:text-xs font-bold uppercase ${
            isDark ? 'text-slate-400' : 'text-slate-400'
          }`} role="status">
            No hay solicitudes pendientes
          </p>
        ) : (
          solicitudes.map((solicitud) => (
            <div
              key={solicitud.id}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-xl sm:rounded-2xl transition-all group cursor-pointer touch-manipulation active:scale-[0.98] border ${
                isDark
                  ? 'border-slate-700 hover:border-blue-600 bg-slate-800/50'
                  : theme === 'medical'
                    ? 'border-blue-100 hover:border-blue-300 bg-white'
                    : 'border-slate-100 hover:border-blue-100'
              }`}
              onClick={() => navigate('/pabellon/solicitudes')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/pabellon/solicitudes')}
            >
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0 flex-1">
                <div className="w-1.5 sm:w-2 h-8 sm:h-10 rounded-full bg-blue-400 flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className={`font-black text-sm sm:text-base truncate ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}>
                    {solicitud.patients?.nombre} {solicitud.patients?.apellido}
                  </div>
                  <div className={`text-[9px] sm:text-[10px] font-bold uppercase truncate ${
                    isDark ? 'text-slate-400' : 'text-slate-400'
                  }`}>
                    {solicitud.codigo_operacion} • Dr. {solicitud.doctors?.nombre} {solicitud.doctors?.apellido}
                  </div>
                </div>
              </div>
              <span className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all flex-shrink-0 ml-2">
                <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
