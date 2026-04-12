import { useState, useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import Card from '../../../components/common/Card'
import OcupacionChart from '../../../components/charts/OcupacionChart'
import { useTheme } from '../../../contexts/ThemeContext'
import { sanitizeString } from '../../../utils/sanitizeInput'

/**
 * Gráfico de ocupación semanal del Dashboard de Pabellón.
 * Props:
 *   cirugiasSemana     {Array}  — cirugías de los últimos 7 días
 *   pabellonesActivos  {Array}  — salas activas para el filtro
 *   ocupacion          {object} — { totalPabellones }
 */
export default function DashboardChart({ cirugiasSemana = [], pabellonesActivos = [], ocupacion }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [filtroTipo, setFiltroTipo] = useState('porcentaje')
  const [filtroPabellon, setFiltroPabellon] = useState('todos')

  const datosOcupacion = useMemo(() => {
    const ultimos7Dias = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() })
    const totalPabellonesBase = pabellonesActivos.length || ocupacion?.totalPabellones || 4
    const horasPorDia = 12

    return ultimos7Dias.map(dia => {
      const fechaStr = format(dia, 'yyyy-MM-dd')
      const cirugiasDelDia = cirugiasSemana.filter(c => {
        if (c.fecha !== fechaStr) return false
        if (filtroPabellon !== 'todos' && String(c.operating_room_id) !== String(filtroPabellon)) return false
        return true
      })

      const minutosOcupados = cirugiasDelDia.reduce((total, c) => {
        if (!c.hora_inicio || !c.hora_fin) return total
        const inicio = new Date(`2000-01-01T${c.hora_inicio}`)
        const fin = new Date(`2000-01-01T${c.hora_fin}`)
        const minutos = (fin - inicio) / (1000 * 60)
        return minutos > 0 ? total + minutos : total
      }, 0)

      const pabellonesConsiderados = filtroPabellon === 'todos' ? totalPabellonesBase : 1
      const minutosTotales = pabellonesConsiderados * horasPorDia * 60
      const porcentaje = minutosTotales > 0 ? Math.round((minutosOcupados / minutosTotales) * 100) : 0
      const ocupadasHoras = minutosOcupados / 60
      const libresHoras = minutosTotales > 0 ? Math.max(minutosTotales / 60 - ocupadasHoras, 0) : 0

      return {
        dia: format(dia, 'EEE', { locale: es }),
        porcentaje: Math.min(porcentaje, 100),
        ocupadasHoras: Math.max(ocupadasHoras, 0),
        libresHoras: Math.max(libresHoras, 0),
      }
    })
  }, [cirugiasSemana, ocupacion, filtroPabellon, pabellonesActivos])

  const opciones = [
    { id: 'porcentaje', label: 'Ocupación %' },
    { id: 'horas_ocupadas', label: 'Horas ocupadas' },
    { id: 'horas_libres', label: 'Horas libres' },
  ]

  return (
    <Card id="ocupacion-semanal" className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h3 className={`font-black uppercase text-xs sm:text-sm flex items-center gap-2 ${
          isDark ? 'text-white' : 'text-slate-800'
        }`}>
          <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px] text-blue-500" />
          Ocupación Semanal
        </h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="inline-flex rounded-full bg-slate-100 text-[10px] sm:text-xs p-1">
            {opciones.map(op => (
              <button
                key={op.id}
                type="button"
                onClick={() => setFiltroTipo(op.id)}
                className={`px-2.5 sm:px-3 py-1 rounded-full font-bold uppercase tracking-tight transition-colors ${
                  filtroTipo === op.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Pabellón</span>
            <select
              value={filtroPabellon}
              onChange={(e) => setFiltroPabellon(sanitizeString(e.target.value))}
              className="text-[10px] sm:text-xs font-bold border border-slate-200 rounded-full px-2.5 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filtrar por pabellón"
            >
              <option value="todos">Todos</option>
              {pabellonesActivos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <OcupacionChart data={datosOcupacion} mode={filtroTipo} />
      </div>
    </Card>
  )
}
