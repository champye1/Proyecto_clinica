import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCurrentUser } from '@/services/authService'
import { getDoctorByUserId } from '@/services/doctorService'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import {
  startOfYear, endOfYear, endOfMonth, isWithinInterval, format,
} from 'date-fns'
import CalendarioBreadcrumbs from './calendario/CalendarioBreadcrumbs'
import CalendarioMonthView from './calendario/CalendarioMonthView'
import CalendarioWeekView from './calendario/CalendarioWeekView'
import CalendarioDayView from './calendario/CalendarioDayView'

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

const S = {
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

export default function Calendario() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [view, setView] = useState('year')
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showConfirmCancelar, setShowConfirmCancelar] = useState(false)
  const [cirugiaACancelar, setCirugiaACancelar] = useState(null)

  const { data: doctor } = useQuery({
    queryKey: ['doctor-actual'],
    queryFn: async () => {
      const { user } = await getCurrentUser()
      if (!user) return null
      const { data, error } = await getDoctorByUserId(user.id)
      if (error) throw error
      return data
    },
  })

  const fechaInicioStr = startOfYear(new Date(anio, 0, 1)).toISOString().slice(0, 10)
  const fechaFinStr = endOfYear(new Date(anio, 0, 1)).toISOString().slice(0, 10)

  const { data: cirugias = [], isLoading: loadingCirugias } = useQuery({
    queryKey: ['calendario-doctor-cirugias', anio, doctor?.id],
    queryFn: async () => {
      if (!doctor) return []
      const { data, error } = await supabase
        .from('surgeries')
        .select(`id, fecha, operating_room_id, hora_inicio, hora_fin, estado, observaciones, patients:patient_id(nombre, apellido, rut), operating_rooms:operating_room_id(nombre)`)
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

  const cancelarCirugia = useMutation({
    mutationFn: async (cirugiaId) => {
      const { error } = await supabase
        .from('surgeries')
        .update({ estado: 'cancelada', updated_at: new Date().toISOString() })
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
      const msg = error.message || error.toString() || 'Error desconocido'
      showError(msg.includes('Failed to fetch') || msg.includes('NetworkError')
        ? 'Error de conexión. Verifique su conexión a internet e intente nuevamente.'
        : 'Error al cancelar la cirugía: ' + msg)
    },
  })

  const handleCancelarClick = (cirugia) => {
    setCirugiaACancelar(cirugia)
    setShowConfirmCancelar(true)
  }

  const confirmarCancelar = () => {
    if (cirugiaACancelar) cancelarCirugia.mutate(cirugiaACancelar.id)
  }

  const statsMeses = useMemo(() => {
    return MESES.map((mes) => {
      const inicioMes = new Date(anio, mes.indice, 1)
      const finMes = endOfMonth(inicioMes)
      const cirugiasMes = cirugias.filter(c => isWithinInterval(new Date(c.fecha), { start: inicioMes, end: finMes }))
      const totalDias = finMes.getDate()
      const diasConCirugias = new Set(cirugiasMes.map(c => c.fecha)).size
      const porcentajeOcupado = Math.round((diasConCirugias / totalDias) * 100)
      return { ...mes, cirugiasEstimadas: cirugiasMes.length, porcentajeOcupado, porcentajeLibre: 100 - porcentajeOcupado }
    })
  }, [anio, cirugias])

  const cargando = loadingCirugias || !doctor

  const handleNavigate = (targetView) => {
    if (targetView === 'year') { setView('year'); setSelectedMonth(null); setSelectedWeek(null); setSelectedDay(null) }
    else if (targetView === 'month') { setView('month'); setSelectedWeek(null); setSelectedDay(null) }
    else if (targetView === 'week') { setView('week'); setSelectedDay(null) }
  }

  return (
    <div className={S.page}>
      <div className={S.headerRow}>
        <div>
          <CalendarioBreadcrumbs
            anio={anio}
            view={view}
            selectedMonth={selectedMonth}
            selectedWeek={selectedWeek}
            selectedDay={selectedDay}
            onNavigate={handleNavigate}
          />
        </div>
        <div className={S.headerRight}>
          {view === 'year' && (
            <div className={S.yearSelector}>
              <button onClick={() => setAnio(anio - 1)} className={S.yearNavBtn}>
                <ChevronLeft className={S.yearNavIcon} />
              </button>
              <span className={S.yearLabel}>{anio}</span>
              <button onClick={() => setAnio(anio + 1)} className={S.yearNavBtn}>
                <ChevronRight className={S.yearNavIcon} />
              </button>
            </div>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="card flex items-center justify-center min-h-[400px]">
          <p className={S.loadingTxt}>Cargando datos...</p>
        </div>
      ) : (
        <>
          {view === 'year' && (
            <>
              <div className={S.legendRow}>
                <div className={S.legendItems}>
                  <div className="flex items-center gap-2">
                    <span className={S.legendDotBlue} />
                    <span>Con Cirugías</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={S.legendDotSlate} />
                    <span>Libre</span>
                  </div>
                </div>
              </div>
              <div className={S.monthGrid}>
                {statsMeses.map((mes) => (
                  <button
                    key={mes.indice}
                    onClick={() => { setSelectedMonth(mes.indice); setView('month') }}
                    className={S.monthCard}
                  >
                    <div className={S.monthCardTop}>
                      <div>
                        <p className={S.monthCirCount}>{mes.cirugiasEstimadas} cirugía{mes.cirugiasEstimadas !== 1 ? 's' : ''}</p>
                        <h2 className={S.monthName}>{mes.nombre}</h2>
                      </div>
                      <div className="text-right">
                        <p className={S.monthPct}>{mes.porcentajeOcupado}%</p>
                        <p className={S.monthOccupied}>Ocupado</p>
                      </div>
                    </div>
                    <div className="mt-4 w-full">
                      <div className={S.monthBarBg}>
                        <div className={S.monthBarFlex}>
                          {mes.porcentajeOcupado > 0 && <div className={S.monthBarBlue} style={{ width: `${mes.porcentajeOcupado}%` }} />}
                          {mes.porcentajeLibre > 0 && <div className={S.monthBarSlate} style={{ width: `${mes.porcentajeLibre}%` }} />}
                        </div>
                      </div>
                      <div className={S.monthBarBottom}>
                        <span>{mes.porcentajeLibre}% libre</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {view === 'month' && selectedMonth !== null && (
            <CalendarioMonthView
              anio={anio}
              monthIndex={selectedMonth}
              onWeekClick={(weekStart) => { setSelectedWeek(weekStart); setView('week') }}
            />
          )}

          {view === 'week' && selectedWeek && (
            <CalendarioWeekView
              weekStart={selectedWeek}
              cirugias={cirugias}
              pabellones={pabellones}
              onDayClick={(day) => { setSelectedDay(day); setView('day') }}
            />
          )}

          {view === 'day' && selectedDay && (
            <CalendarioDayView
              day={selectedDay}
              pabellones={pabellones}
              cirugias={cirugias}
              onCancelarClick={handleCancelarClick}
            />
          )}
        </>
      )}

      <Modal
        isOpen={showConfirmCancelar}
        onClose={() => { setShowConfirmCancelar(false); setCirugiaACancelar(null) }}
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
            <div className={S.cancelInfoBox}>
              <p className={S.cancelInfoTxt}><span className="font-bold">Fecha:</span> {format(new Date(cirugiaACancelar.fecha), 'dd/MM/yyyy')}</p>
              <p className={S.cancelInfoTxt}><span className="font-bold">Hora:</span> {cirugiaACancelar.hora_inicio} - {cirugiaACancelar.hora_fin}</p>
              <p className={S.cancelInfoTxt}><span className="font-bold">Pabellón:</span> {cirugiaACancelar.operating_rooms?.nombre}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => { setShowConfirmCancelar(false); setCirugiaACancelar(null) }}
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
