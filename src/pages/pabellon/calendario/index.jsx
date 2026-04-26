import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'
import { sanitizeString } from '@/utils/sanitizeInput'
import { ChevronLeft, ChevronRight, Clock, Info, Search, X } from 'lucide-react'
import { MESES } from './constants'
import { S } from './styles'
import useCalendario from './useCalendario'
import Breadcrumbs from './Breadcrumbs'
import FullMonthView from './FullMonthView'
import DayDetailsModal from './DayDetailsModal'
import WeekView from './WeekView'
import DayView from './DayView'
import CalendarioConfirmModal from './CalendarioConfirmModal'
import CalendarioSlotDetailsModal from './CalendarioSlotDetailsModal'
import CalendarioCancelModal from './CalendarioCancelModal'

export default function Calendario() {
  const { theme } = useTheme()
  const t = tc(theme)
  const isDark    = theme === 'dark'
  const isMedical = theme === 'medical'
  const themeKey  = isDark ? 'Dark' : isMedical ? 'Med' : 'Light'

  const {
    anio, setAnio,
    pabellonId, setPabellonId,
    filtroPaciente, setFiltroPaciente,
    view, setView,
    selectedMonth, setSelectedMonth,
    selectedWeek,
    selectedDay, setSelectedDay,
    selectedSlot, setSelectedSlot,
    showConfirmModal, setShowConfirmModal,
    horaFin, setHoraFin,
    showDayDetailsModal, setShowDayDetailsModal,
    showDetallesModal, setShowDetallesModal,
    dayDetailsDate, setDayDetailsDate,
    slotDetalle, setSlotDetalle,
    showConfirmCancelar, setShowConfirmCancelar,
    cirugiaACancelar,
    cirugiaAReagendar,
    currentRequest, setCurrentRequest,
    programarCirugia, reagendarCirugia, cancelarCirugia,
    handleConfirmSlot, handleConfirmarCupo, handleSelectSlotFromModal, handleNavigate,
    cirugias, bloqueos, cirugiasDetalle, pabellones,
    loadingCirugias, loadingBloqueos,
    statsMeses, isOverlap,
    fromReagendamientoNotification, isReagendarMode,
    navigate, location,
  } = useCalendario()

  const cargando = loadingCirugias || loadingBloqueos

  return (
    <div className={S.page}>
      {/* Aviso reagendamiento */}
      {(fromReagendamientoNotification || (isReagendarMode && cirugiaAReagendar)) && (
        <div className={S[`reagendAlert${isDark ? 'Dark' : 'Light'}`]}>
          <Clock className={S.alertIcon} />
          <div className={S.flexOne}>
            <p className={S.alertTitle}>Reagendamiento</p>
            <p className={S.alertText}>
              {cirugiaAReagendar
                ? 'Seleccione el nuevo horario en el calendario y confirme. Se notificará al doctor y al pabellón.'
                : 'Seleccione un nuevo horario en el calendario o vaya a Solicitudes.'}
            </p>
          </div>
          <button type="button"
            onClick={() => {
              try { if (currentRequest) sessionStorage.setItem('solicitud_gestionando', JSON.stringify(currentRequest)) } catch {}
              navigate('/pabellon/solicitudes', { state: { openProgramacion: true } })
            }}
            className={S.alertLink}>
            Ver el agendamiento
          </button>
        </div>
      )}

      {/* Header */}
      <div className={S.header}>
        <div>
          <Breadcrumbs anio={anio} view={view} selectedMonth={selectedMonth} selectedWeek={selectedWeek} selectedDay={selectedDay} onNavigate={handleNavigate} />
        </div>
        <div className={S.controlsRow}>
          {view === 'year' && (
            <div className={S[`yearSelector${themeKey}`]} role="group" aria-label="Selector de año">
              <button onClick={() => setAnio(anio - 1)} className={S[`yearBtn${isDark ? 'Dark' : 'Light'}`]} aria-label="Año anterior">
                <ChevronLeft className={S[`yearBtnIcon${isDark ? 'Dark' : 'Light'}`]} />
              </button>
              <span className={S[`yearText${isDark ? 'Dark' : 'Light'}`]} aria-live="polite">{anio}</span>
              <button onClick={() => setAnio(anio + 1)} className={S[`yearBtn${isDark ? 'Dark' : 'Light'}`]} aria-label="Año siguiente">
                <ChevronRight className={S[`yearBtnIcon${isDark ? 'Dark' : 'Light'}`]} />
              </button>
            </div>
          )}
          <div className={S.searchBar}>
            <Search className={S.searchIcon} />
            <input type="text" value={filtroPaciente} onChange={e => setFiltroPaciente(sanitizeString(e.target.value))}
              placeholder="Buscar por nombre de paciente..." className={S.searchInput} aria-label="Buscar por nombre de paciente" />
            {filtroPaciente && <button onClick={() => setFiltroPaciente('')} className={S.clearBtn} aria-label="Limpiar búsqueda"><X className={S.xIcon} /></button>}
          </div>
          <div className={S.searchBar}>
            <span className={S.filterLabelSpan}>Filtrar:</span>
            <select value={pabellonId} onChange={e => setPabellonId(sanitizeString(e.target.value))} className={S.filterSelect} aria-label="Filtrar por pabellón">
              <option value="todos">Todos los pabellones</option>
              {pabellones.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filtroPaciente && (
        <div className={S.filterMsgBanner}>
          <Info className={S.filterSearchIcon} />
          <div className="min-w-0 flex-1">
            <p className={S.filterBannerTitle}>Búsqueda activa: "{filtroPaciente}"</p>
            <p className={S.filterBannerText}>Mostrando {cirugias.length} cirugía{cirugias.length !== 1 ? 's' : ''} que coinciden con el nombre del paciente.</p>
          </div>
          <button onClick={() => setFiltroPaciente('')} className={S.filterClearBtn} aria-label="Limpiar búsqueda"><X className={S.xIcon} /></button>
        </div>
      )}

      {cargando ? (
        <div className="card flex items-center justify-center min-h-[300px] sm:min-h-[400px] px-4 py-8">
          <p className={S.loadingText}>Cargando datos...</p>
        </div>
      ) : (
        <>
          {view === 'year' && (
            <>
              <div className={S.yearLegendRow}>
                <div className={S[`legend${isDark ? 'Dark' : 'Light'}`]}>
                  {[['blue','Agendado'],['yellow','Bloqueado'],['gray','Libre']].map(([color, label]) => (
                    <div key={label} className={S.legendDotItem}>
                      <span className={color === 'blue' ? S.legendDotBlue : color === 'yellow' ? S.legendDotYellow : S.legendDotGray} />
                      <span className={S.whitespacenowrap}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={S.yearMonthGrid}>
                {statsMeses.map((mes) => (
                  <button key={mes.indice} onClick={() => { setSelectedMonth(mes.indice); setView('month') }}
                    className={S[`monthCard${themeKey}`]}
                    aria-label={`Ver ${mes.nombre} - ${mes.cirugiasEstimadas} cirugías estimadas, ${mes.porcentajeAgendado}% ocupación`}
                  >
                    <div className={S.monthCardTop}>
                      <div className="flex-1 min-w-0">
                        <h2 className={S[`monthName${isDark ? 'Dark' : 'Light'}`]}>{mes.nombre}</h2>
                        <p className={S[`monthSub${isDark ? 'Dark' : 'Light'}`]}>{mes.cirugiasEstimadas} cirugías est.</p>
                      </div>
                      <div className={S.monthCardPctWrap}>
                        <p className={S[`monthPct${isDark ? 'Dark' : 'Light'}`]}>{mes.porcentajeAgendado}%</p>
                        <p className={S.monthPctLabel}>Agendado</p>
                      </div>
                    </div>
                    <div className={S.monthCardBottom}>
                      <div className={S[`progressBg${isDark ? 'Dark' : 'Light'}`]}>
                        <div className={S.monthBarFlex}>
                          {mes.porcentajeAgendado  > 0 && <div className={S.monthBarBlue}   style={{ width: `${mes.porcentajeAgendado}%` }}  />}
                          {mes.porcentajeBloqueado > 0 && <div className={S.monthBarYellow} style={{ width: `${mes.porcentajeBloqueado}%` }} />}
                          {mes.porcentajeLibre     > 0 && <div className={S.monthBarGray}   style={{ width: `${mes.porcentajeLibre}%` }}     />}
                        </div>
                      </div>
                      <div className={isDark ? S.progressStatsDark : S.progressStatsLight}>
                        <span className={S.monthBloqSpan}>{mes.porcentajeBloqueado}% bloqueado</span>
                        <span className={S.monthBarOcio}>{mes.porcentajeLibre}% ocioso</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {view === 'month' && selectedMonth !== null && (
            <FullMonthView anio={anio} monthIndex={selectedMonth} cirugias={cirugias} pabellones={pabellones} onNavigate={handleNavigate}
              onDayClick={(day) => { setDayDetailsDate(day); setShowDayDetailsModal(true) }}
            />
          )}

          <DayDetailsModal isOpen={showDayDetailsModal} onClose={() => setShowDayDetailsModal(false)} day={dayDetailsDate} cirugias={cirugias} pabellones={pabellones} onSelectSlot={handleSelectSlotFromModal} />

          {view === 'week' && selectedWeek && (
            <WeekView weekStart={selectedWeek} cirugias={cirugias} pabellonId={pabellonId} pabellones={pabellones} selectedDay={selectedDay}
              onDayClick={(day) => { setSelectedDay(day); setView('day') }}
            />
          )}

          {view === 'day' && selectedDay && (
            <DayView day={selectedDay} pabellones={pabellones} cirugias={cirugiasDetalle} bloqueos={bloqueos}
              onSlotSelect={setSelectedSlot} selectedSlot={selectedSlot} currentRequest={currentRequest}
              onConfirmSlot={handleConfirmSlot}
              onSlotClick={(slotInfo) => { setSlotDetalle(slotInfo); setShowDetallesModal(true) }}
              showError={() => {}}
            />
          )}
        </>
      )}

      <CalendarioConfirmModal
        isOpen={showConfirmModal && !!selectedSlot && !!currentRequest}
        onClose={() => setShowConfirmModal(false)}
        cirugiaAReagendar={cirugiaAReagendar}
        currentRequest={currentRequest}
        selectedSlot={selectedSlot}
        horaFin={horaFin}
        setHoraFin={setHoraFin}
        isOverlap={isOverlap}
        pabellones={pabellones}
        isSubmitting={programarCirugia.isPending || reagendarCirugia.isPending}
        onConfirmar={handleConfirmarCupo}
        showError={() => {}}
      />

      <CalendarioSlotDetailsModal
        isOpen={showDetallesModal}
        onClose={() => { setShowDetallesModal(false); setSlotDetalle(null) }}
        slotDetalle={slotDetalle}
        onCancelar={(cirugia) => { setShowDetallesModal(false); setShowConfirmCancelar(true); setCirugiaACancelar(cirugia) }}
      />

      <CalendarioCancelModal
        isOpen={showConfirmCancelar}
        onClose={() => { setShowConfirmCancelar(false); setCirugiaACancelar(null) }}
        cirugiaACancelar={cirugiaACancelar}
        slotDetalle={slotDetalle}
        isSubmitting={cancelarCirugia.isPending}
        onConfirmar={(id) => cancelarCirugia.mutate(id)}
      />
    </div>
  )
}
