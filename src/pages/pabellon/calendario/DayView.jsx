import { useState, useEffect, useRef, useMemo } from 'react'
import { CheckCircle2, Clock, Info, Lock, XCircle, Activity } from 'lucide-react'
import { format, isSameDay, isPast, startOfDay } from 'date-fns'
import Button from '@/components/common/Button'
import Tooltip from '@/components/common/Tooltip'
import { codigosOperaciones } from '@/data/codigosOperaciones'
import { TIME_SLOTS } from './constants'

const S = {
  wrap:             'flex flex-col h-auto lg:h-[calc(100vh-250px)] lg:flex-row gap-4 sm:gap-5 lg:gap-6 xl:gap-8 animate-in fade-in duration-500 px-2 sm:px-0',
  histBanner:       'lg:hidden mb-2 sm:mb-3 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-2 sm:p-2.5 flex items-start gap-1.5 sm:gap-2',
  sidebar:          'w-full lg:w-72 flex-shrink-0 space-y-3 sm:space-y-4 lg:space-y-6',
  requestCard:      'bg-slate-900 p-4 sm:p-5 md:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group',
  legendCard:       'bg-white p-4 sm:p-5 md:p-6 lg:p-7 rounded-2xl sm:rounded-[2.5rem] border border-slate-200 shadow-sm',
  innerRow:         'flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6 xl:gap-8 flex-1 min-w-0',
  gridHeader:       'flex bg-slate-50 border-b-2 border-slate-200 shadow-sm overflow-x-auto -mx-2 sm:mx-0 scrollbar-hide',
  confirmBar:       'bg-slate-900 text-white p-3 sm:p-4 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in slide-in-from-bottom duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] sticky bottom-0 z-30',
  decorCircle:      'absolute -right-4 -top-4 w-24 h-24 bg-blue-500/20 rounded-full group-hover:scale-150 transition-transform duration-700',
  reqCardTitle:     'font-black text-[8px] sm:text-[9px] uppercase tracking-[0.4em] text-blue-400 mb-3 sm:mb-4 leading-relaxed',
  reqCardBody:      'space-y-3 sm:space-y-4 relative z-10',
  reqFieldLabel:    'text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed mb-0.5 sm:mb-1',
  reqPatientName:   'text-base sm:text-lg md:text-xl font-black uppercase tracking-wide leading-relaxed break-words',
  reqOpRow:         'flex items-center gap-2 sm:gap-3 bg-white/5 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/10',
  reqOpIcon:        'sm:w-4 sm:h-4 text-blue-500 flex-shrink-0',
  reqOpName:        'text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-relaxed truncate min-w-0 flex-1',
  reqEmptyTxt:      'text-[9px] sm:text-[10px] text-slate-500 italic',
  legendTitle:      'text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 sm:mb-4 flex items-center gap-2 leading-relaxed',
  legendQBadge:     'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md bg-blue-50 flex items-center justify-center text-blue-500 text-[10px] sm:text-xs flex-shrink-0',
  legendItems:      'space-y-2 sm:space-y-3',
  legendItem:       'flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors',
  legendText:       'text-xs font-bold text-slate-700 uppercase tracking-wide',
  legendTextLong:   'text-xs font-bold text-slate-700 uppercase tracking-wide leading-relaxed',
  gridTimeHead:     'w-16 sm:w-20 lg:w-24 border-r-2 border-slate-200 flex-shrink-0 flex items-center justify-center py-3 sm:py-4 lg:py-6 sticky left-0 bg-slate-50 z-20',
  clockIcon:        'sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px] text-slate-400',
  emptyPabCol:      'flex-1 min-w-[100px] sm:min-w-[120px] text-center py-3 sm:py-4 lg:py-6 border-r-2 last:border-r-0 border-slate-200 bg-slate-50/50 px-2',
  emptyPabTitle:    'font-black text-slate-800 text-[9px] sm:text-[10px] lg:text-[11px] uppercase tracking-[0.3em] leading-relaxed truncate',
  emptyPabSub:      'text-[7px] sm:text-[8px] lg:text-[9px] font-black text-slate-400 uppercase mt-1 sm:mt-1.5',
  pabCol:           'flex-1 min-w-[100px] sm:min-w-[120px] text-center py-3 sm:py-4 lg:py-6 border-r-2 last:border-r-0 border-slate-200 hover:bg-slate-100/50 transition-colors px-2',
  pabColTitle:      'font-black text-slate-800 text-[9px] sm:text-[10px] lg:text-[11px] uppercase tracking-[0.3em] leading-relaxed truncate',
  pabColFree:       'text-[7px] sm:text-[8px] lg:text-[9px] font-black text-green-500 uppercase mt-1 sm:mt-1.5',
  gridBody:         'flex-1 overflow-y-auto overflow-x-auto custom-scrollbar bg-slate-50/30 relative -mx-2 sm:mx-0 scrollbar-hide',
  naInner:          'h-full w-full flex items-center justify-center border-2 border-dashed rounded-xl border-slate-100 opacity-50 m-1',
  naText:           'text-sm text-slate-300 font-black uppercase tracking-widest',
  occupiedCell:     'w-full h-full bg-red-50 border-2 border-red-300 rounded-lg sm:rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-red-100 hover:border-red-400 hover:shadow-lg active:scale-95 transition-all group/occupied',
  occupiedAvatar:   'w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-500 flex items-center justify-center mb-1 sm:mb-2 group-hover/occupied:scale-110 transition-transform',
  blockedCell:      'w-full h-full bg-slate-800 border-2 border-amber-400/50 rounded-lg sm:rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center cursor-not-allowed hover:border-amber-400 transition-all',
  confirmBarLeft:   'flex items-center gap-3 sm:gap-4 lg:gap-6 flex-1 min-w-0 w-full sm:w-auto',
  confirmBarIcon:   'bg-blue-600 p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl flex-shrink-0',
  confirmBarLabel:  'text-[7px] sm:text-[8px] lg:text-[9px] text-blue-400 font-black uppercase tracking-[0.4em] mb-0.5 sm:mb-1 leading-relaxed',
  confirmBarContent:'flex-1 min-w-0',
  confirmBarTitle:  'text-sm sm:text-base lg:text-xl font-black uppercase tracking-wide leading-relaxed truncate',
  confirmBarSep:    'text-slate-400 mx-1.5 sm:mx-2 lg:mx-3',
  histBannerIcon:   'w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 flex-shrink-0 mt-0.5',
  histBannerTitle:  'text-[9px] sm:text-[10px] font-black text-blue-900 uppercase tracking-wide leading-tight',
  histBannerText:   'text-[8px] sm:text-[9px] text-blue-700 mt-0.5 leading-tight',
  histDesktopBlock: 'hidden lg:block bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-2 sm:p-2.5 flex items-start gap-1.5 sm:gap-2',
  legendIconAvail:  'w-4 h-4 rounded border-2 border-green-300 bg-green-50 flex items-center justify-center',
  legendIconOccup:  'w-4 h-4 rounded border-2 border-red-300 bg-red-50 flex items-center justify-center',
  legendIconBlock:  'w-4 h-4 rounded border-2 border-amber-400 bg-slate-800 flex items-center justify-center',
  legendIconSel:    'w-4 h-4 rounded border-2 border-blue-500 bg-blue-50 flex items-center justify-center',
  legendAvailIcon:  'text-green-600',
  legendOccupIcon:  'text-red-600',
  legendBlockIcon:  'text-amber-400',
  legendSelIcon:    'text-blue-600',
  naCell:           'flex-1 h-full border-r-2 last:border-r-0 border-slate-200 p-0 bg-slate-50/30',
  xcircleWhite:     'sm:w-4 sm:h-4 text-white',
  occupiedTxt:      'text-[10px] sm:text-xs font-black text-red-700 uppercase tracking-wider leading-relaxed text-center',
  occupiedPatient:  'text-[8px] sm:text-[9px] text-red-600 font-bold mt-0.5 sm:mt-1 truncate w-full text-center px-1',
  lockIcon:         'sm:w-5 sm:h-5 text-amber-400 mb-1 sm:mb-2',
  blockedTxt:       'text-[10px] sm:text-xs font-black text-amber-400 uppercase tracking-wider leading-relaxed text-center',
  checkBlue:        'sm:w-5 sm:h-5 text-blue-600 mb-0.5 sm:mb-1',
  selectedTxt:      'text-[10px] sm:text-xs font-black text-blue-600 uppercase tracking-wider text-center',
  checkGreen:       'sm:w-5 sm:h-5 text-green-600 mb-0.5 sm:mb-1',
  availableTxt:     'text-[10px] sm:text-xs font-black text-green-700 uppercase tracking-wider leading-relaxed text-center',
  naTxt:            'text-[10px] sm:text-xs text-slate-400 font-bold',
  infoBarIcon:      'sm:w-5 sm:h-5 lg:w-6 lg:h-6',
  hiddenSm:         'hidden sm:inline',
  smHidden:         'sm:hidden',
  tooltipBody:      'text-left',
  tooltipTitle:     'font-black mb-1 text-white',
  tooltipContent:   'text-xs text-slate-200',
  tooltipMt1:       'mt-1',
  tooltipMt2:       'mt-2 text-[10px] text-blue-300',
}

export default function DayView({ day, pabellones, cirugias, bloqueos, onSlotSelect, selectedSlot, currentRequest, onConfirmSlot, onSlotClick, showError }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [gridWidth, setGridWidth]     = useState(800)
  const [isResizing, setIsResizing]   = useState(false)
  const scrollRef      = useRef(null)
  const gridRef        = useRef(null)
  const resizeHandleRef = useRef(null)

  const esDiaPasado = isPast(startOfDay(day)) && !isSameDay(day, new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollRef.current && isSameDay(day, new Date())) {
      const currentSlotIndex = Math.max(0, currentTime.getHours() - 8)
      scrollRef.current.scrollTop = currentSlotIndex * 160 - 140
    }
  }, [day, currentTime])

  const PAVILIONS = useMemo(() => {
    const primeros4 = pabellones.slice(0, 4)
    while (primeros4.length < 4) {
      primeros4.push({ id: `empty-${primeros4.length}`, nombre: `Pabellón ${primeros4.length + 1}` })
    }
    return primeros4.map(p => p.nombre)
  }, [pabellones])

  const pabellonesMostrar = useMemo(() => pabellones.slice(0, 4), [pabellones])

  const pabellon1Bloqueado = useMemo(() => {
    const pabellon1 = pabellonesMostrar[0]
    if (!pabellon1) return false
    return !!cirugias.find(c =>
      c.operating_room_id === pabellon1.id &&
      c.fecha === format(day, 'yyyy-MM-dd') &&
      c.hora_inicio <= '08:00' && c.hora_fin > '08:00'
    )
  }, [pabellonesMostrar, cirugias, day])

  const getGridStatus = (tIdx, pIdx) => {
    const time     = TIME_SLOTS[tIdx]
    const pabellon = pabellonesMostrar[pIdx]
    if (!pabellon) return { status: 'free' }
    if (pIdx === 0 && pabellon1Bloqueado) return { status: 'blocked_agreement', data: { motivo: 'Pabellón 1 ocupado a las 8:00' } }

    const cirugia = cirugias.find(c =>
      c.operating_room_id === pabellon.id &&
      c.fecha === format(day, 'yyyy-MM-dd') &&
      c.hora_inicio <= time + ':00' && c.hora_fin > time + ':00'
    )
    if (cirugia) return { status: 'occupied', data: cirugia }

    const fechaDia = format(day, 'yyyy-MM-dd')
    const slotTime = time.length === 5 ? time : time + ':00'
    const bloqueo  = bloqueos.find(b => {
      const f = typeof b.fecha === 'string' ? b.fecha.slice(0, 10) : format(new Date(b.fecha), 'yyyy-MM-dd')
      if (b.operating_room_id !== pabellon.id || f !== fechaDia) return false
      if (b.vigencia_hasta) {
        const vig = typeof b.vigencia_hasta === 'string' ? b.vigencia_hasta.slice(0, 10) : format(new Date(b.vigencia_hasta), 'yyyy-MM-dd')
        if (vig < fechaDia) return false
      }
      const hin = b.hora_inicio?.toString().slice(0, 5)
      const hfn = b.hora_fin?.toString().slice(0, 5)
      if (!hin || !hfn) return true
      return hin <= slotTime && hfn > slotTime
    })
    if (bloqueo) return { status: 'blocked_agreement', data: bloqueo }
    return { status: 'free' }
  }

  const gridData = useMemo(() =>
    TIME_SLOTS.map((_, tIdx) => PAVILIONS.map((_, pIdx) => getGridStatus(tIdx, pIdx))),
    [day, bloqueos, cirugias, pabellonesMostrar, pabellon1Bloqueado]
  )

  return (
    <div className={S.wrap}>
      {esDiaPasado && (
        <div className={S.histBanner}>
          <Info className={S.histBannerIcon} />
          <div className="min-w-0 flex-1">
            <p className={S.histBannerTitle}>Modo Consulta - Día Histórico</p>
            <p className={S.histBannerText}>Puede revisar las cirugías realizadas este día. No se pueden realizar modificaciones en fechas pasadas.</p>
          </div>
        </div>
      )}

      <div className={S.innerRow}>
        {/* Sidebar */}
        <div className={S.sidebar}>
          <div className={S.requestCard}>
            <div className={S.decorCircle} />
            <h6 className={S.reqCardTitle}>Solicitud en Curso</h6>
            {currentRequest ? (
              <div className={S.reqCardBody}>
                <div>
                  <div className={S.reqFieldLabel}>Paciente</div>
                  <div className={S.reqPatientName}>{currentRequest.patients?.nombre} {currentRequest.patients?.apellido}</div>
                </div>
                <div className={S.reqOpRow}>
                  <Activity size={14} className={S.reqOpIcon} />
                  <span className={S.reqOpName}>
                    {codigosOperaciones.find(c => c.codigo === currentRequest.codigo_operacion)?.nombre || currentRequest.codigo_operacion}
                  </span>
                </div>
              </div>
            ) : (
              <p className={S.reqEmptyTxt}>Navegación libre por disponibilidad.</p>
            )}
          </div>

          <div className={S.legendCard}>
            <h4 className={S.legendTitle}>
              <span className={S.legendQBadge}>?</span>
              <span className="truncate">Leyenda de Estados</span>
            </h4>
            <div className={S.legendItems}>
              {[
                { icon: <CheckCircle2 size={12} className={S.legendAvailIcon} />, wrap: S.legendIconAvail, label: 'Disponible' },
                { icon: <XCircle size={12} className={S.legendOccupIcon} />,     wrap: S.legendIconOccup, label: 'Ocupado' },
                { icon: <Lock size={12} className={S.legendBlockIcon} />,         wrap: S.legendIconBlock, label: 'Bloqueado / Convenio' },
                { icon: <CheckCircle2 size={12} className={S.legendSelIcon} />,  wrap: S.legendIconSel,   label: 'Seleccionado' },
              ].map(({ icon, wrap, label }) => (
                <div key={label} className={S.legendItem}>
                  <div className={wrap}>{icon}</div>
                  <span className={S.legendTextLong}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {esDiaPasado && (
            <div className={S.histDesktopBlock}>
              <Info className={S.histBannerIcon} />
              <div className="min-w-0 flex-1">
                <p className={S.histBannerTitle}>Modo Consulta - Día Histórico</p>
                <p className={S.histBannerText}>No se pueden realizar modificaciones en fechas pasadas.</p>
              </div>
            </div>
          )}
        </div>

        {/* Grid principal */}
        <div
          ref={gridRef}
          style={{ width: `${gridWidth}px`, minWidth: '600px', maxWidth: '90%' }}
          className={`relative bg-white rounded-xl sm:rounded-2xl lg:rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col ${esDiaPasado ? 'opacity-90' : ''} ${isResizing ? 'select-none' : ''}`}
        >
          {/* Resize handle */}
          <div
            ref={resizeHandleRef}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!gridRef.current) return
              setIsResizing(true)
              const startX     = e.clientX
              const startWidth = gridRef.current.getBoundingClientRect().width
              document.body.style.userSelect = 'none'
              document.body.style.cursor     = 'col-resize'
              const handleMove = (ev) => {
                let newWidth = startWidth + (ev.clientX - startX)
                if (newWidth < 600) newWidth = 600
                if (newWidth > window.innerWidth * 0.9) newWidth = window.innerWidth * 0.9
                setGridWidth(newWidth)
              }
              const handleUp = () => {
                document.removeEventListener('mousemove', handleMove)
                document.removeEventListener('mouseup', handleUp)
                document.body.style.userSelect = ''
                document.body.style.cursor     = ''
                setIsResizing(false)
              }
              document.addEventListener('mousemove', handleMove)
              document.addEventListener('mouseup', handleUp)
            }}
            className={`absolute left-0 top-0 w-4 h-full cursor-col-resize z-30 group ${isResizing ? 'bg-blue-500/30' : 'bg-transparent hover:bg-blue-200/30'} transition-colors`}
            style={{ touchAction: 'none', userSelect: 'none', marginLeft: '-16px', paddingLeft: '16px' }}
            title="Arrastra para redimensionar"
          >
            <div className={`absolute top-1/2 left-2 transform -translate-y-1/2 w-1 h-32 rounded-full transition-all pointer-events-none ${isResizing ? 'bg-blue-600 opacity-100 w-2' : 'bg-blue-400 opacity-0 group-hover:opacity-70 group-hover:w-1.5'}`} />
            <div className={`absolute top-0 left-0 w-0.5 h-full transition-all ${isResizing ? 'bg-blue-500 opacity-100' : 'bg-blue-300 opacity-0 group-hover:opacity-60'}`} />
          </div>

          {/* Cabecera pabellones */}
          <div className={S.gridHeader}>
            <div className={S.gridTimeHead}>
              <Clock size={14} className={S.clockIcon} />
            </div>
            {PAVILIONS.map((p, pIdx) => {
              const pabellon   = pabellonesMostrar[pIdx]
              if (!pabellon) {
                return (
                  <div key={`empty-${pIdx}`} className={S.emptyPabCol}>
                    <div className={S.emptyPabTitle}>{p}</div>
                    <div className={S.emptyPabSub}>No disponible</div>
                  </div>
                )
              }
              const slotsLibres = gridData.filter(r => r[pIdx].status === 'free').length
              return (
                <div key={pabellon.id} className={S.pabCol}>
                  <div className={S.pabColTitle}>{p}</div>
                  <div className={S.pabColFree}>{slotsLibres} {slotsLibres === 1 ? 'Libre' : 'Libres'}</div>
                </div>
              )
            })}
          </div>

          {/* Cuerpo */}
          <div ref={scrollRef} className={S.gridBody}>
            {TIME_SLOTS.map((time, tIdx) => {
              const isCurrentHour = isSameDay(day, new Date()) &&
                currentTime.getHours() === parseInt(time.split(':')[0]) &&
                currentTime.getHours() >= 8 && currentTime.getHours() < 20

              return (
                <div
                  key={time}
                  className={`flex border-b-2 border-slate-200 last:border-0 hover:bg-white/50 transition-all group relative min-h-[90px] sm:min-h-[100px] lg:min-h-[110px] ${isCurrentHour ? 'bg-gradient-to-r from-blue-50/40 to-transparent' : ''}`}
                >
                  <div className={`w-16 sm:w-20 lg:w-24 border-r-[3px] border-slate-500 flex-shrink-0 flex items-center justify-center h-full text-[9px] sm:text-[10px] lg:text-[11px] font-black uppercase tracking-widest leading-relaxed transition-all duration-300 relative z-10 bg-white sticky left-0 ${
                    isCurrentHour ? 'text-blue-600 bg-blue-50/30 shadow-sm' : 'text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50/20'
                  }`}>
                    {time}
                  </div>

                  {PAVILIONS.map((pav, pIdx) => {
                    const pabellon   = pabellonesMostrar[pIdx]
                    const info       = gridData[tIdx][pIdx]
                    const isSelected = selectedSlot?.pabellonId === pabellon?.id && selectedSlot?.time === time
                    const isAvailable = info.status === 'free' && pabellon

                    if (!pabellon) {
                      return (
                        <div key={`${time}-${pav}`} className={S.naCell}>
                          <div className={S.naInner}><span className={S.naText}>N/A</span></div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={`${time}-${pav}`}
                        onClick={() => {
                          if (esDiaPasado) {
                            if (info.status === 'occupied') {
                              onSlotClick({ type: 'occupied', data: info.data, pabellon: pabellon.nombre, time, date: day })
                            } else {
                              showError('Este día es histórico. Solo se pueden consultar cirugías realizadas.')
                            }
                            return
                          }
                          if (info.status === 'occupied') {
                            onSlotClick({ type: 'occupied', data: info.data, pabellon: pabellon.nombre, time, date: day })
                            return
                          }
                          if (info.status === 'blocked_agreement') {
                            showError('Este horario está bloqueado por convenio')
                            return
                          }
                          if (isAvailable && currentRequest) {
                            onSlotSelect({ pabellonId: pabellon.id, time, date: day })
                          } else if (isAvailable) {
                            onSlotClick({ type: 'available', pabellon: pabellon.nombre, time, date: day })
                          }
                        }}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && isAvailable && !esDiaPasado) {
                            e.preventDefault()
                            if (currentRequest) {
                              onSlotSelect({ pabellonId: pabellon.id, time, date: day })
                            } else {
                              onSlotClick({ type: 'available', pabellon: pabellon.nombre, time, date: day })
                            }
                          }
                        }}
                        className={`flex-1 h-full border-r-2 last:border-r-0 border-slate-200 pl-1.5 sm:pl-2 lg:pl-4 pr-1.5 sm:pr-2 lg:pr-3 py-1.5 sm:py-2 transition-all flex items-center justify-center bg-white min-w-[90px] sm:min-w-[100px] touch-manipulation ${
                          esDiaPasado
                            ? info.status === 'occupied' ? 'cursor-pointer hover:bg-blue-50/40 opacity-90' : 'cursor-not-allowed opacity-50'
                            : isAvailable || info.status === 'occupied'
                            ? 'cursor-pointer hover:bg-blue-50/40 active:bg-blue-100/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                            : 'cursor-not-allowed'
                        }`}
                        tabIndex={esDiaPasado ? (info.status === 'occupied' ? 0 : -1) : (isAvailable || info.status === 'occupied' ? 0 : -1)}
                      >
                        {info.status === 'occupied' ? (
                          <Tooltip content={
                            <div className={S.tooltipBody}>
                              <div className={S.tooltipTitle}>Cirugía Programada</div>
                              <div className={S.tooltipContent}>
                                <div>Dr. {info.data?.doctors?.apellido || info.data?.doctors?.nombre || 'General'}</div>
                                <div className={S.tooltipMt1}>{info.data?.hora_inicio?.substring(0, 5)} - {info.data?.hora_fin?.substring(0, 5)}</div>
                                {info.data?.patients?.nombre && (
                                  <div className={S.tooltipMt1}>{info.data.patients.nombre} {info.data.patients.apellido}</div>
                                )}
                                <div className={S.tooltipMt2}>Click para ver detalles</div>
                              </div>
                            </div>
                          }>
                            <div className={S.occupiedCell} role="button" tabIndex={0} aria-label="Horario ocupado">
                              <div className={S.occupiedAvatar}>
                                <XCircle size={12} className={S.xcircleWhite} />
                              </div>
                              <span className={S.occupiedTxt}>Ocupado</span>
                              {info.data?.patients?.nombre && (
                                <span className={S.occupiedPatient}>{info.data.patients.nombre.split(' ')[0]}</span>
                              )}
                            </div>
                          </Tooltip>
                        ) : info.status === 'blocked_agreement' ? (
                          <Tooltip content="Bloqueado por convenio - No disponible para agendar">
                            <div className={S.blockedCell} role="button" tabIndex={-1} aria-label="Horario bloqueado">
                              <Lock size={16} className={S.lockIcon} />
                              <span className={S.blockedTxt}>Bloqueado</span>
                            </div>
                          </Tooltip>
                        ) : (
                          <Tooltip content={currentRequest ? 'Click para seleccionar este horario' : 'Click para ver detalles del horario disponible'}>
                            <div
                              className={`w-full h-full border-2 rounded-lg sm:rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center transition-all active:scale-95 ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200/50 ring-4 ring-blue-500 animate-pulse'
                                  : isAvailable
                                  ? 'border-green-300 bg-green-50 hover:border-green-500 hover:bg-green-100 hover:shadow-md active:bg-green-200'
                                  : 'border-slate-200 bg-slate-50'
                              }`}
                              role="button"
                              tabIndex={isAvailable ? 0 : -1}
                              aria-label={isAvailable ? `Horario disponible ${time} en ${pabellon.nombre}` : 'Horario no disponible'}
                            >
                              {isSelected ? (
                                <><CheckCircle2 size={16} className={S.checkBlue} /><span className={S.selectedTxt}>Seleccionado</span></>
                              ) : isAvailable ? (
                                <><CheckCircle2 size={16} className={S.checkGreen} /><span className={S.availableTxt}>Disponible</span></>
                              ) : (
                                <span className={S.naTxt}>N/A</span>
                              )}
                            </div>
                          </Tooltip>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Barra de confirmación */}
          {selectedSlot && (
            <div className={S.confirmBar}>
              <div className={S.confirmBarLeft}>
                <div className={S.confirmBarIcon}>
                  <Info size={18} className={S.infoBarIcon} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={S.confirmBarLabel}>BLOQUE SELECCIONADO</p>
                  <h3 className={S.confirmBarTitle}>
                    {pabellonesMostrar.find(p => p.id === selectedSlot.pabellonId)?.nombre}
                    <span className={S.confirmBarSep}>•</span>
                    {selectedSlot.time}
                  </h3>
                </div>
              </div>
              <Button
                onClick={onConfirmSlot}
                className="w-full sm:w-auto px-6 sm:px-8 lg:px-12 py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base touch-manipulation"
              >
                <span className={S.hiddenSm}>PROCEDER AL AGENDAMIENTO</span>
                <span className={S.smHidden}>CONFIRMAR</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
