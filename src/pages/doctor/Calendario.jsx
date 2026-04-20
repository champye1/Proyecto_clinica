import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle, Info, XCircle } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import {
  startOfYear,
  endOfYear,
  endOfMonth,
  isWithinInterval,
  startOfMonth,
  eachWeekOfInterval,
  endOfWeek,
  format,
  addDays,
  isSameDay,
  startOfWeek,
  eachDayOfInterval,
  setHours,
  setMinutes,
  addMinutes,
  isSameMonth,
  getWeek,
  parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'

const MESES = [
  { indice: 0, nombre: 'ENERO' },
  { indice: 1, nombre: 'FEBRERO' },
  { indice: 2, nombre: 'MARZO' },
  { indice: 3, nombre: 'ABRIL' },
  { indice: 4, nombre: 'MAYO' },
  { indice: 5, nombre: 'JUNIO' },
  { indice: 6, nombre: 'JULIO' },
  { indice: 7, nombre: 'AGOSTO' },
  { indice: 8, nombre: 'SEPTIEMBRE' },
  { indice: 9, nombre: 'OCTUBRE' },
  { indice: 10, nombre: 'NOVIEMBRE' },
  { indice: 11, nombre: 'DICIEMBRE' },
]

// ─── Estilos ──────────────────────────────────────────────────────────────────────────────
const STYLES_BC = {
  nav:     'flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6',
  sep:     'text-slate-300',
  current: 'text-slate-900',
}

const STYLES_MV = {
  wrapper:     'space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500',
  infoBanner:  'bg-blue-50 border border-blue-100 rounded-3xl p-6 flex items-center gap-4',
  infoIcon:    'w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600',
  infoSvg:     'w-5 h-5',
  infoTitle:   'text-sm font-black text-blue-900 uppercase tracking-wide',
  infoText:    'text-xs font-medium text-blue-600 mt-1',
  grid:        'grid gap-4',
  weekBtn:     'w-full bg-white border border-slate-100 rounded-3xl p-6 flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all group',
  weekIconBox: 'w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors',
  weekCalIcon: 'w-6 h-6 text-slate-400 group-hover:text-blue-600',
  weekTitle:   'text-sm font-black text-slate-900 uppercase tracking-wide',
  weekSub:     'text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider',
  weekChevron: 'w-5 h-5 text-slate-300 group-hover:text-blue-500',
}

const STYLES_WV = {
  grid:       'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 justify-items-center',
  dayCard:    'bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col h-full w-full max-w-[400px]',
  dayCardTop: 'flex items-center justify-between mb-6',
  dayName:    'text-sm sm:text-base font-black text-slate-900 uppercase whitespace-nowrap',
  dayDate:    'text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap',
  dayBody:    'space-y-4 flex-1',
  cirCard:    'bg-blue-50 border border-blue-100 rounded-xl p-3',
  cirTime:    'text-xs font-black text-blue-900 uppercase tracking-wider',
  cirPatient: 'text-xs font-bold text-slate-700 mb-1',
  cirRoom:    'text-[10px] text-slate-500',
  emptyTxt:   'text-xs text-slate-400 italic text-center py-4',
  detailBtn:  'mt-6 w-full py-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-wider hover:bg-blue-50 hover:text-blue-600 transition-colors',
}

const STYLES_DV = {
  wrapper:        'flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500',
  sidebar:        'w-80 flex-shrink-0 space-y-6',
  darkCard:       'bg-[#0f172a] rounded-[2rem] p-6 text-white overflow-hidden relative',
  darkTitle:      'text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-1',
  darkSub:        'text-sm font-medium opacity-50',
  blob:           'absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20 transform translate-x-10 -translate-y-10',
  cirList:        'bg-white rounded-[2rem] border border-slate-100 p-6 space-y-4',
  cirListTitle:   'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4',
  cirItem:        'bg-blue-50 border border-blue-100 rounded-xl p-4',
  cirTime:        'text-xs font-black text-blue-900 uppercase tracking-wider',
  cirPatient:     'text-sm font-bold text-slate-900 mb-1',
  cirRut:         'text-xs text-slate-600 mb-2',
  cirRoom:        'text-xs font-bold text-blue-600',
  cirObs:         'text-xs text-slate-500 mt-2 italic',
  cancelBtn:      'mt-3 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2',
  cancelIcon:     'w-4 h-4',
  emptyCard:      'bg-white rounded-[2rem] border border-slate-100 p-6 text-center',
  emptyTxt:       'text-xs text-slate-400',
  legendCard:     'bg-white rounded-[2rem] border border-slate-100 p-6',
  legendTitle:    'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2',
  legendIcon:     'w-4 h-4 rounded-md bg-blue-50 flex items-center justify-center text-blue-500 text-xs',
  legendDotAvail: 'w-3 h-3 rounded-full border-2 border-slate-200',
  legendTxt:      'text-xs font-bold text-slate-500 uppercase tracking-wide',
  legendDotMine:  'w-3 h-3 rounded-full bg-blue-50 border-2 border-blue-100',
  main:           'flex-1 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm overflow-hidden relative',
  gridHeader:     'grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-4 mb-4',
  timeSpacer:     'w-12',
  pabName:        'text-xs font-black text-slate-900 uppercase tracking-wider',
  pabCount:       'text-[10px] font-bold text-green-600 uppercase tracking-wider',
  gridRow:        'grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-4 items-center group',
  timeLabel:      'w-12 text-[10px] font-bold text-slate-400 text-right',
  occupied:       'h-16 rounded-2xl bg-blue-50 border border-blue-200 p-3 flex flex-col justify-center',
  occupiedLabel:  'text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1',
  occupiedName:   'text-xs font-bold text-blue-900 truncate',
  available:      'h-16 rounded-2xl border-2 border-dashed border-slate-100',
}

const STYLES = {
  page:           'space-y-8',
  headerRow:      'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
  headerRight:    'flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4',
  yearSelector:   'flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2',
  yearNavBtn:     'p-1 rounded-lg hover:bg-slate-100',
  yearNavIcon:    'w-4 h-4 text-slate-400',
  yearLabel:      'text-sm font-bold text-slate-700',
  loadingTxt:     'text-slate-400 text-sm font-bold animate-pulse',
  legendRow:      'flex justify-end mb-4',
  legendItems:    'flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400',
  legendDotBlue:  'w-3 h-3 rounded-full bg-blue-500',
  legendDotSlate: 'w-3 h-3 rounded-full bg-slate-300',
  monthGrid:      'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500',
  monthCard:      'bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 flex flex-col justify-between text-left hover:border-blue-300 hover:shadow-md transition-all group',
  monthCardTop:   'flex items-start justify-between mb-4 w-full',
  monthCirCount:  'text-xs font-black text-slate-400 uppercase tracking-[0.2em]',
  monthName:      'text-xl font-black text-slate-900 mt-1 group-hover:text-blue-600 transition-colors',
  monthPct:       'text-xl font-black text-blue-600',
  monthOccupied:  'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]',
  monthBarBg:     'h-2 w-full bg-slate-100 rounded-full overflow-hidden',
  monthBarFlex:   'h-full flex',
  monthBarBlue:   'bg-blue-500',
  monthBarSlate:  'bg-slate-300',
  monthBarBottom: 'flex items-center justify-between mt-3 text-[11px] font-bold text-slate-500',
  cancelInfoBox:  'bg-slate-50 rounded-xl p-4 space-y-2',
  cancelInfoTxt:  'text-sm text-slate-600',
}

// Componente Breadcrumbs
const Breadcrumbs = ({ anio, view, selectedMonth, selectedWeek, selectedDay, onNavigate }) => {
  const monthName = selectedMonth !== null ? MESES[selectedMonth].nombre : ''
  const weekNumber = selectedWeek ? getWeek(selectedWeek, { weekStartsOn: 1 }) - getWeek(startOfMonth(selectedWeek), { weekStartsOn: 1 }) + 1 : ''
  
  return (
    <div className={STYLES_BC.nav}>
      <button 
        onClick={() => onNavigate('year')} 
        className={`hover:text-blue-600 ${view === 'year' ? 'text-slate-900' : ''}`}
      >
        Calendario {anio}
      </button>
      
      {(view === 'month' || view === 'week' || view === 'day') && (
        <>
          <span className={STYLES_BC.sep}>/</span>
          <button 
            onClick={() => onNavigate('month')}
            className={`hover:text-blue-600 ${view === 'month' ? 'text-slate-900' : ''}`}
          >
            {monthName}
          </button>
        </>
      )}
      
      {(view === 'week' || view === 'day') && (
        <>
          <span className={STYLES_BC.sep}>/</span>
          <button 
            onClick={() => onNavigate('week')}
            className={`hover:text-blue-600 ${view === 'week' ? 'text-slate-900' : ''}`}
          >
            Semana {weekNumber}
          </button>
        </>
      )}

      {view === 'day' && selectedDay && (
        <>
          <span className={STYLES_BC.sep}>/</span>
          <span className={STYLES_BC.current}>
            {format(selectedDay, 'EEEE d', { locale: es })}
          </span>
        </>
      )}
    </div>
  )
}

// Componente MonthView (Lista de Semanas)
const MonthView = ({ anio, monthIndex, onWeekClick }) => {
  const weeks = useMemo(() => {
    const start = startOfMonth(new Date(anio, monthIndex))
    const end = endOfMonth(start)
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
  }, [anio, monthIndex])

  return (
    <div className={STYLES_MV.wrapper}>
      <div className={STYLES_MV.infoBanner}>
        <div className={STYLES_MV.infoIcon}>
          <Info className={STYLES_MV.infoSvg} />
        </div>
        <div>
          <h3 className={STYLES_MV.infoTitle}>Mis Cirugías Programadas</h3>
          <p className={STYLES_MV.infoText}>Semanas disponibles para {MESES[monthIndex].nombre}.</p>
        </div>
      </div>

      <div className={STYLES_MV.grid}>
        {weeks.map((weekStart, idx) => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
          const isCurrentMonth = isSameMonth(weekStart, new Date(anio, monthIndex)) || isSameMonth(weekEnd, new Date(anio, monthIndex))
          
          if (!isCurrentMonth) return null

          // Calcular número de semana relativo al mes
          const weekNum = idx + 1 

          return (
            <button
              key={weekStart.toISOString()}
              onClick={() => onWeekClick(weekStart)}
              className={STYLES_MV.weekBtn}
            >
              <div className="flex items-center gap-4">
                <div className={STYLES_MV.weekIconBox}>
                  <CalendarIcon className={STYLES_MV.weekCalIcon} />
                </div>
                <div className="text-left">
                  <h3 className={STYLES_MV.weekTitle}>
                    Semana 0{weekNum}
                  </h3>
                  <p className={STYLES_MV.weekSub}>
                    Del {format(weekStart, 'd', { locale: es })} al {format(weekEnd, 'd', { locale: es })} de {MESES[monthIndex].nombre}
                  </p>
                </div>
              </div>
              <ChevronRight className={STYLES_MV.weekChevron} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Componente WeekView (Grilla de Días)
const WeekView = ({ weekStart, cirugias, onDayClick, pabellones }) => {
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6) // Lunes a Domingo
    })
  }, [weekStart])

  return (
    <div className={STYLES_WV.grid}>
      {days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const cirugiasDia = cirugias.filter(c => c.fecha === dayStr)
        
        return (
          <div key={day.toISOString()} className={STYLES_WV.dayCard}>
            <div className={STYLES_WV.dayCardTop}>
              <div className="flex-1 min-w-0 pr-2">
                <h3 className={STYLES_WV.dayName}>
                  {format(day, 'EEEE', { locale: es })}
                </h3>
                <p className={STYLES_WV.dayDate}>
                  {format(day, 'd MMMM', { locale: es })}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                cirugiasDia.length > 0 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {cirugiasDia.length > 0 ? `${cirugiasDia.length} Cirugía${cirugiasDia.length > 1 ? 's' : ''}` : 'Disponible'}
              </span>
            </div>

            <div className={STYLES_WV.dayBody}>
              {cirugiasDia.length > 0 ? (
                cirugiasDia.map(cirugia => (
                  <div key={cirugia.id} className={STYLES_WV.cirCard}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={STYLES_WV.cirTime}>
                        {cirugia.hora_inicio} - {cirugia.hora_fin}
                      </span>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        cirugia.estado === 'programada' ? 'bg-blue-100 text-blue-800' :
                        cirugia.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' :
                        cirugia.estado === 'completada' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cirugia.estado}
                      </span>
                    </div>
                    <p className={STYLES_WV.cirPatient}>
                      {cirugia.patients?.nombre} {cirugia.patients?.apellido}
                    </p>
                    <p className={STYLES_WV.cirRoom}>
                      {cirugia.operating_rooms?.nombre}
                    </p>
                  </div>
                ))
              ) : (
                <p className={STYLES_WV.emptyTxt}>
                  No hay cirugías programadas
                </p>
              )}
            </div>

            <button
              onClick={() => onDayClick(day)}
              className={STYLES_WV.detailBtn}
            >
              Ver Detalles
            </button>
          </div>
        )
      })}
    </div>
  )
}

// Componente DayView (Slots Horarios)
const DayView = ({ day, pabellones, cirugias }) => {
  // Generar slots de 08:00 a 24:00 cada 1 hora (simplificado)
  const slots = useMemo(() => {
    const hours = []
    for (let i = 8; i < 24; i++) {
      hours.push(`${i.toString().padStart(2, '0')}:00`)
    }
    return hours
  }, [])

  const dayStr = format(day, 'yyyy-MM-dd')
  const cirugiasDia = cirugias.filter(c => c.fecha === dayStr)

  const getSlotStatus = (pabellonId, time) => {
    const cirugia = cirugiasDia.find(c => 
      c.operating_room_id === pabellonId && 
      c.hora_inicio <= time + ':00' && c.hora_fin > time + ':00'
    )
    
    if (cirugia) return { status: 'occupied', data: cirugia }
    return { status: 'available' }
  }

  return (
    <div className={STYLES_DV.wrapper}>
      {/* Sidebar Izquierdo - Info */}
      <div className={STYLES_DV.sidebar}>
        <div className={STYLES_DV.darkCard}>
          <div className="relative z-10">
             <h3 className={STYLES_DV.darkTitle}>Mis Cirugías</h3>
             <p className={STYLES_DV.darkSub}>Vista detallada del día</p>
          </div>
          <div className={STYLES_DV.blob} />
        </div>

        {/* Lista de cirugías del día */}
        {cirugiasDia.length > 0 ? (
          <div className={STYLES_DV.cirList}>
            <h4 className={STYLES_DV.cirListTitle}>
              Cirugías Programadas
            </h4>
            {cirugiasDia.map(cirugia => (
              <div key={cirugia.id} className={STYLES_DV.cirItem}>
                <div className="flex items-center justify-between mb-2">
                  <span className={STYLES_WV.cirTime}>
                    {cirugia.hora_inicio} - {cirugia.hora_fin}
                  </span>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    cirugia.estado === 'programada' ? 'bg-blue-100 text-blue-800' :
                    cirugia.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' :
                    cirugia.estado === 'completada' ? 'bg-green-100 text-green-800' :
                    cirugia.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {cirugia.estado}
                  </span>
                </div>
                <p className={STYLES_DV.cirPatient}>
                  {cirugia.patients?.nombre} {cirugia.patients?.apellido}
                </p>
                <p className={STYLES_DV.cirRut}>
                  RUT: {cirugia.patients?.rut}
                </p>
                <p className={STYLES_DV.cirRoom}>
                  {cirugia.operating_rooms?.nombre}
                </p>
                {cirugia.observaciones && (
                  <p className={STYLES_DV.cirObs}>
                    {cirugia.observaciones}
                  </p>
                )}
                {cirugia.estado === 'programada' && (
                  <button
                    onClick={() => handleCancelarClick(cirugia)}
                    className={STYLES_DV.cancelBtn}
                  >
                    <XCircle className={STYLES_DV.cancelIcon} />
                    Cancelar Cirugía
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={STYLES_DV.emptyCard}>
            <p className={STYLES_DV.emptyTxt}>No hay cirugías programadas para este día</p>
          </div>
        )}

        <div className={STYLES_DV.legendCard}>
           <h4 className={STYLES_DV.legendTitle}>
             <span className={STYLES_DV.legendIcon}>?</span>
             Leyenda
           </h4>
           <div className="space-y-3">
             <div className="flex items-center gap-3">
               <div className={STYLES_DV.legendDotAvail} />
               <span className={STYLES_DV.legendTxt}>Disponible</span>
             </div>
             <div className="flex items-center gap-3">
               <div className={STYLES_DV.legendDotMine} />
               <span className={STYLES_DV.legendTxt}>Mi Cirugía</span>
             </div>
           </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className={STYLES_DV.main}>
        <div className={STYLES_DV.gridHeader}>
          <div className={STYLES_DV.timeSpacer} /> {/* Espaciador hora */}
          {pabellones.map(p => (
            <div key={p.id} className="text-center">
              <h4 className={STYLES_DV.pabName}>{p.nombre}</h4>
              <span className={STYLES_DV.pabCount}>
                {cirugiasDia.filter(c => c.operating_room_id === p.id).length} Cirugía{cirugiasDia.filter(c => c.operating_room_id === p.id).length !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {slots.map(time => (
            <div key={time} className={STYLES_DV.gridRow}>
              <span className={STYLES_DV.timeLabel}>{time}</span>
              {pabellones.map(p => {
                const { status, data } = getSlotStatus(p.id, time)
                
                if (status === 'occupied') {
                   return (
                     <div key={p.id} className={STYLES_DV.occupied}>
                       <span className={STYLES_DV.occupiedLabel}>Mi Cirugía</span>
                       <span className={STYLES_DV.occupiedName}>
                         {data.patients?.nombre} {data.patients?.apellido}
                       </span>
                     </div>
                   )
                }

                return (
                  <div
                    key={p.id}
                    className={STYLES_DV.available}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Calendario() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()
  const [anio, setAnio] = useState(new Date().getFullYear())
  
  // Estados de navegación
  const [view, setView] = useState('year') // year, month, week, day
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  
  // Estados para cancelación
  const [showConfirmCancelar, setShowConfirmCancelar] = useState(false)
  const [cirugiaACancelar, setCirugiaACancelar] = useState(null)

  // Obtener doctor actual
  const { data: doctor } = useQuery({
    queryKey: ['doctor-actual'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
  })

  const inicioAnio = startOfYear(new Date(anio, 0, 1))
  const finAnio = endOfYear(new Date(anio, 0, 1))

  const fechaInicioStr = inicioAnio.toISOString().slice(0, 10)
  const fechaFinStr = finAnio.toISOString().slice(0, 10)

  const { data: cirugias = [], isLoading: loadingCirugias } = useQuery({
    queryKey: ['calendario-doctor-cirugias', anio, doctor?.id],
    queryFn: async () => {
      if (!doctor) return []

      const { data, error } = await supabase
        .from('surgeries')
        .select(`
          id, 
          fecha, 
          operating_room_id, 
          hora_inicio, 
          hora_fin,
          estado,
          observaciones,
          patients:patient_id(
            nombre,
            apellido,
            rut
          ),
          operating_rooms:operating_room_id(
            nombre
          )
        `)
        .eq('doctor_id', doctor.id)
        .gte('fecha', fechaInicioStr)
        .lte('fecha', fechaFinStr)
        .is('deleted_at', null)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!doctor,
  })

  const { data: pabellones = [] } = useQuery({
    queryKey: ['pabellones-calendario'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operating_rooms')
        .select('id, nombre')
        .eq('activo', true)
        .is('deleted_at', null)
        .order('nombre')

      if (error) throw error
      return data
    },
  })

  // Mutation para cancelar cirugía
  const cancelarCirugia = useMutation({
    mutationFn: async (cirugiaId) => {
      const { error } = await supabase
        .from('surgeries')
        .update({ 
          estado: 'cancelada',
          updated_at: new Date().toISOString()
        })
        .eq('id', cirugiaId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendario-doctor-cirugias'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-dia-detalle'] })
      showSuccess('Cirugía cancelada exitosamente')
      setShowConfirmCancelar(false)
      setCirugiaACancelar(null)
    },
    onError: (error) => {
      const errorMessage = error.message || error.toString() || 'Error desconocido'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
      } else {
        showError('Error al cancelar la cirugía: ' + errorMessage)
      }
    },
  })

  const handleCancelarClick = (cirugia) => {
    setCirugiaACancelar(cirugia)
    setShowConfirmCancelar(true)
  }

  const confirmarCancelar = () => {
    if (cirugiaACancelar) {
      cancelarCirugia.mutate(cirugiaACancelar.id)
    }
  }

  const statsMeses = useMemo(() => {
    return MESES.map((mes) => {
      const inicioMes = new Date(anio, mes.indice, 1)
      const finMes = endOfMonth(inicioMes)

      const cirugiasMes = cirugias.filter((c) => {
        const fechaCirugia = new Date(c.fecha)
        return isWithinInterval(fechaCirugia, { start: inicioMes, end: finMes })
      })

      const totalDias = finMes.getDate()
      const diasConCirugias = new Set(cirugiasMes.map(c => c.fecha)).size
      const porcentajeOcupado = Math.round((diasConCirugias / totalDias) * 100)

      return {
        ...mes,
        cirugiasEstimadas: cirugiasMes.length,
        porcentajeOcupado,
        porcentajeLibre: 100 - porcentajeOcupado,
      }
    })
  }, [anio, cirugias])

  const cargando = loadingCirugias || !doctor

  const handleNavigate = (targetView) => {
    if (targetView === 'year') {
      setView('year')
      setSelectedMonth(null)
      setSelectedWeek(null)
      setSelectedDay(null)
    } else if (targetView === 'month') {
      setView('month')
      setSelectedWeek(null)
      setSelectedDay(null)
    } else if (targetView === 'week') {
      setView('week')
      setSelectedDay(null)
    }
  }

  return (
    <div className={STYLES.page}>
      {/* Header General */}
      <div className={STYLES.headerRow}>
        <div>
          <Breadcrumbs 
             anio={anio} 
             view={view}
             selectedMonth={selectedMonth}
             selectedWeek={selectedWeek}
             selectedDay={selectedDay}
             onNavigate={handleNavigate}
          />
        </div>
        <div className={STYLES.headerRight}>
           {/* Selector de año solo visible en vista anual */}
           {view === 'year' && (
             <div className={STYLES.yearSelector}>
               <button
                 onClick={() => setAnio(anio - 1)}
                 className={STYLES.yearNavBtn}
               >
                 <ChevronLeft className={STYLES.yearNavIcon} />
               </button>
               <span className={STYLES.yearLabel}>{anio}</span>
               <button
                 onClick={() => setAnio(anio + 1)}
                 className={STYLES.yearNavBtn}
               >
                 <ChevronRight className={STYLES.yearNavIcon} />
               </button>
             </div>
           )}
        </div>
      </div>

      {cargando ? (
        <div className="card flex items-center justify-center min-h-[400px]">
          <p className={STYLES.loadingTxt}>Cargando datos...</p>
        </div>
      ) : (
        <>
          {view === 'year' && (
            <>
               <div className={STYLES.legendRow}>
                <div className={STYLES.legendItems}>
                  <div className="flex items-center gap-2">
                    <span className={STYLES.legendDotBlue} />
                    <span>Con Cirugías</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={STYLES.legendDotSlate} />
                    <span>Libre</span>
                  </div>
                </div>
              </div>
              <div className={STYLES.monthGrid}>
                {statsMeses.map((mes) => (
                  <button
                    key={mes.indice}
                    onClick={() => {
                      setSelectedMonth(mes.indice)
                      setView('month')
                    }}
                    className={STYLES.monthCard}
                  >
                    <div className={STYLES.monthCardTop}>
                      <div>
                        <p className={STYLES.monthCirCount}>
                          {mes.cirugiasEstimadas} cirugía{mes.cirugiasEstimadas !== 1 ? 's' : ''}
                        </p>
                        <h2 className={STYLES.monthName}>{mes.nombre}</h2>
                      </div>
                      <div className="text-right">
                        <p className={STYLES.monthPct}>{mes.porcentajeOcupado}%</p>
                        <p className={STYLES.monthOccupied}>
                          Ocupado
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 w-full">
                      <div className={STYLES.monthBarBg}>
                        <div className={STYLES.monthBarFlex}>
                          {mes.porcentajeOcupado > 0 && (
                            <div
                              className={STYLES.monthBarBlue}
                              style={{ width: `${mes.porcentajeOcupado}%` }}
                            />
                          )}
                          {mes.porcentajeLibre > 0 && (
                            <div
                              className={STYLES.monthBarSlate}
                              style={{ width: `${mes.porcentajeLibre}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <div className={STYLES.monthBarBottom}>
                        <span>{mes.porcentajeLibre}% libre</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {view === 'month' && selectedMonth !== null && (
            <MonthView 
              anio={anio} 
              monthIndex={selectedMonth} 
              onWeekClick={(weekStart) => {
                setSelectedWeek(weekStart)
                setView('week')
              }}
            />
          )}

          {view === 'week' && selectedWeek && (
            <WeekView 
              weekStart={selectedWeek} 
              cirugias={cirugias}
              pabellones={pabellones}
              onDayClick={(day) => {
                setSelectedDay(day)
                setView('day')
              }}
            />
          )}

          {view === 'day' && selectedDay && (
            <DayView 
              day={selectedDay}
              pabellones={pabellones}
              cirugias={cirugias}
            />
          )}
        </>
      )}

      {/* Modal de Confirmación de Cancelación */}
      <Modal
        isOpen={showConfirmCancelar}
        onClose={() => {
          setShowConfirmCancelar(false)
          setCirugiaACancelar(null)
        }}
        title="Cancelar Cirugía"
      >
        {cirugiaACancelar && (
          <div className="space-y-6">
            <p className="text-slate-700">
              ¿Está seguro de que desea cancelar la cirugía programada para{' '}
              <span className="font-bold">
                {cirugiaACancelar.patients?.nombre} {cirugiaACancelar.patients?.apellido}
              </span>?
            </p>
            <div className={STYLES.cancelInfoBox}>
              <p className={STYLES.cancelInfoTxt}>
                <span className="font-bold">Fecha:</span> {format(new Date(cirugiaACancelar.fecha), 'dd/MM/yyyy')}
              </p>
              <p className={STYLES.cancelInfoTxt}>
                <span className="font-bold">Hora:</span> {cirugiaACancelar.hora_inicio} - {cirugiaACancelar.hora_fin}
              </p>
              <p className={STYLES.cancelInfoTxt}>
                <span className="font-bold">Pabellón:</span> {cirugiaACancelar.operating_rooms?.nombre}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowConfirmCancelar(false)
                  setCirugiaACancelar(null)
                }}
                disabled={cancelarCirugia.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarCancelar}
                loading={cancelarCirugia.isPending}
                disabled={cancelarCirugia.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirmar Cancelación
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
