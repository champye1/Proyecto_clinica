import { useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, Info, Activity, X, Stethoscope, XCircle, AlertTriangle, Search } from 'lucide-react'
import {
  startOfYear, endOfYear, endOfMonth, isWithinInterval, startOfMonth,
  format, isSameDay, startOfWeek, parseISO, isPast, startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/config/supabase'
import { scheduleSurgery, rescheduleSurgery, cancelSurgery, fetchSurgeryById, fetchSurgeriesByDateRange, fetchSurgeriesByDay, fetchScheduleBlocksByDateRange } from '@/services/surgeryService'
import { getDoctorUserIdById } from '@/services/doctorService'
import { createNotification } from '@/services/notificationService'
import { fetchRooms } from '@/services/operatingRoomService'
import { useNotifications } from '@/hooks/useNotifications'
import { sanitizeString, safeParseJSON } from '@/utils/sanitizeInput'
import { useTheme } from '@/contexts/ThemeContext'
import { logger } from '@/utils/logger'
import Button from '@/components/common/Button'
import TimeInput from '@/components/TimeInput'
import Modal from '@/components/common/Modal'
import { codigosOperaciones } from '@/data/codigosOperaciones'
import { MESES, TIME_SLOTS } from './constants'
import Breadcrumbs from './Breadcrumbs'
import FullMonthView from './FullMonthView'
import DayDetailsModal from './DayDetailsModal'
import WeekView from './WeekView'
import DayView from './DayView'

const S = {
  page:               'space-y-3 sm:space-y-4 md:space-y-5 px-4 sm:px-5 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 max-w-7xl mx-auto',
  reagendAlertDark:   'rounded-xl border px-4 py-3 flex items-center gap-3 bg-amber-900/30 border-amber-700 text-amber-100',
  reagendAlertLight:  'rounded-xl border px-4 py-3 flex items-center gap-3 bg-amber-50 border-amber-200 text-amber-900',
  header:             'flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between mb-3 sm:mb-4 md:mb-5',
  controlsRow:        'flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto',
  yearSelectorDark:   'flex items-center gap-2 border rounded-xl sm:rounded-2xl px-3 py-2 w-full sm:w-auto justify-between sm:justify-start bg-slate-800 border-slate-700',
  yearSelectorMed:    'flex items-center gap-2 border rounded-xl sm:rounded-2xl px-3 py-2 w-full sm:w-auto justify-between sm:justify-start bg-white border-blue-100',
  yearSelectorLight:  'flex items-center gap-2 border rounded-xl sm:rounded-2xl px-3 py-2 w-full sm:w-auto justify-between sm:justify-start bg-white border-slate-200',
  yearBtnDark:        'p-2 sm:p-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation hover:bg-slate-700 active:bg-slate-600',
  yearBtnLight:       'p-2 sm:p-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation hover:bg-slate-100 active:bg-slate-200',
  yearBtnIconDark:    'w-5 h-5 sm:w-4 sm:h-4 text-slate-300',
  yearBtnIconLight:   'w-5 h-5 sm:w-4 sm:h-4 text-slate-400',
  yearTextDark:       'text-base sm:text-sm font-bold min-w-[80px] sm:min-w-[60px] text-center text-white',
  yearTextLight:      'text-base sm:text-sm font-bold min-w-[80px] sm:min-w-[60px] text-center text-slate-700',
  searchBar:          'bg-white border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 w-full sm:w-auto',
  filterMsgBanner:    'bg-blue-50 border-2 border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start sm:items-center gap-2 sm:gap-3',
  legendDark:         'flex flex-wrap items-center justify-center sm:justify-end gap-2 md:gap-2.5 lg:gap-3 text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed text-slate-300',
  legendLight:        'flex flex-wrap items-center justify-center sm:justify-end gap-2 md:gap-2.5 lg:gap-3 text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed text-slate-400',
  monthCardDark:      'rounded-xl border-2 shadow-sm p-3 md:p-4 lg:p-5 flex flex-col justify-between text-left hover:border-blue-500 hover:shadow-lg hover:scale-[1.02] transition-all group min-h-[95px] md:min-h-[110px] lg:min-h-[125px] active:scale-[0.98] touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-slate-800 border-slate-700',
  monthCardMed:       'rounded-xl border-2 shadow-sm p-3 md:p-4 lg:p-5 flex flex-col justify-between text-left hover:border-blue-500 hover:shadow-lg hover:scale-[1.02] transition-all group min-h-[95px] md:min-h-[110px] lg:min-h-[125px] active:scale-[0.98] touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white border-blue-100',
  monthCardLight:     'rounded-xl border-2 shadow-sm p-3 md:p-4 lg:p-5 flex flex-col justify-between text-left hover:border-blue-500 hover:shadow-lg hover:scale-[1.02] transition-all group min-h-[95px] md:min-h-[110px] lg:min-h-[125px] active:scale-[0.98] touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white border-slate-100',
  monthNameDark:      'text-base md:text-lg lg:text-xl font-black transition-colors uppercase truncate leading-normal tracking-wide text-white group-hover:text-blue-400',
  monthNameLight:     'text-base md:text-lg lg:text-xl font-black transition-colors uppercase truncate leading-normal tracking-wide text-slate-900 group-hover:text-blue-600',
  monthSubDark:       'text-[8px] md:text-[9px] lg:text-[10px] font-bold mt-1 leading-relaxed text-slate-300',
  monthSubLight:      'text-[8px] md:text-[9px] lg:text-[10px] font-bold mt-1 leading-relaxed text-slate-500',
  monthPctDark:       'text-base md:text-lg lg:text-xl font-black leading-normal text-blue-400',
  monthPctLight:      'text-base md:text-lg lg:text-xl font-black leading-normal text-blue-600',
  monthPctLabel:      'text-[7px] md:text-[8px] lg:text-[9px] font-black uppercase tracking-[0.3em] mt-0.5 leading-relaxed text-slate-400',
  progressBgDark:     'h-2 md:h-2.5 lg:h-3 w-full rounded-full overflow-hidden shadow-inner mb-1.5 bg-slate-700',
  progressBgLight:    'h-2 md:h-2.5 lg:h-3 w-full rounded-full overflow-hidden shadow-inner mb-1.5 bg-slate-100',
  progressStatsDark:  'flex items-center justify-between text-[8px] md:text-[9px] lg:text-[10px] font-bold mt-1 leading-relaxed text-slate-300',
  progressStatsLight: 'flex items-center justify-between text-[8px] md:text-[9px] lg:text-[10px] font-bold mt-1 leading-relaxed text-slate-500',
  alertIcon:          'w-5 h-5 flex-shrink-0 text-amber-600',
  alertContent:       'flex-1',
  alertTitle:         'font-semibold text-sm',
  alertText:          'text-xs opacity-90 mt-0.5',
  alertLink:          'text-xs font-bold underline hover:no-underline',
  searchIcon:         'w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0',
  searchInput:        'bg-transparent text-sm sm:text-base font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 rounded-xl px-2 py-1.5 sm:py-1 flex-1 min-w-0 placeholder:text-slate-400 placeholder:font-normal',
  clearBtn:           'p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors',
  xIcon:              'w-4 h-4',
  filterSelect:       'bg-transparent text-sm sm:text-base font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 rounded-xl px-2 py-1.5 sm:py-1 flex-1 sm:flex-none min-w-0',
  filterSearchIcon:   'w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0',
  filterClearBtn:     'p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors',
  loadingText:        'text-slate-400 text-sm sm:text-base font-bold animate-pulse',
  yearLegendRow:      'flex justify-center sm:justify-end mb-3 md:mb-4',
  yearMonthGrid:      'grid grid-cols-3 gap-3 md:gap-4 lg:gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500',
  legendDotItem:      'flex items-center gap-1.5 md:gap-2',
  legendDotBlue:      'w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-500 flex-shrink-0',
  legendDotYellow:    'w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400 flex-shrink-0',
  legendDotGray:      'w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300 flex-shrink-0',
  whitespacenowrap:   'whitespace-nowrap',
  confirmModalBody:   'space-y-4 sm:space-y-5 md:space-y-6',
  confirmGradBox:     'bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-blue-200',
  confirmAvatarRow:   'flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4',
  confirmAvatar:      'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl md:text-2xl shadow-lg bg-blue-600 flex-shrink-0',
  confirmPatientLabel:'text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5 sm:mb-1',
  confirmPatientName: 'font-black text-slate-900 text-base sm:text-lg md:text-xl uppercase leading-relaxed tracking-wide truncate',
  confirmPatientRut:  'text-[10px] sm:text-xs text-slate-600 font-bold mt-0.5 sm:mt-1',
  confirmProcBox:     'bg-white/60 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-blue-200',
  confirmProcLabelRow:'text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 sm:gap-2',
  confirmProcName:    'text-xs sm:text-sm font-black text-slate-800 break-words',
  confirmProcCode:    'text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5 sm:mt-1',
  confirmGrid:        'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
  confirmGridCell:    'bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200',
  confirmCellLabelRow:'text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2',
  confirmCellValue:   'text-sm sm:text-base font-black text-slate-900 break-words',
  horaFinLabel:       'text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block',
  horaFinInput:       'w-full bg-slate-50 border-2 border-slate-200 rounded-xl sm:rounded-2xl py-3 sm:py-3.5 px-4 sm:px-5 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-700 text-base touch-manipulation',
  overlapAlert:       'mt-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-pulse',
  overlapTitle:       'text-xs sm:text-sm text-red-700 font-black flex items-center gap-2',
  overlapText:        'text-[10px] sm:text-xs text-red-600 mt-1',
  confirmActions:     'flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-200',
  patientInfoBox:     'flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100',
  patientAvatar:      'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl md:text-2xl shadow-lg bg-red-600 flex-shrink-0',
  infoBoxLabel:       'text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5',
  infoBoxName:        'font-black text-slate-800 text-sm sm:text-base md:text-lg uppercase leading-none break-words',
  doctorBox:          'flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100',
  doctorAvatar:       'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg bg-blue-600 flex-shrink-0',
  doctorLabelBlue:    'text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5',
  procedureBox:       'p-3 sm:p-4 md:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100',
  detailBox:          'p-3 sm:p-4 md:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100',
  detailBoxBlue:      'p-3 sm:p-4 md:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100',
  detailBoxLabelRow:  'text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1',
  detailBoxValue:     'font-black text-slate-800 text-sm sm:text-base',
  cancelBtnWrap:      'p-3 sm:p-4 md:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100',
  historicoInfoBox:   'p-3 sm:p-4 md:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100',
  historicoRow:       'flex items-center gap-2 text-blue-700',
  availableBox:       'flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 bg-green-50 rounded-xl sm:rounded-2xl border border-green-100',
  availableAvatar:    'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg bg-green-600 flex-shrink-0',
  availLabelGreen:    'text-[8px] sm:text-[9px] font-black text-green-400 uppercase tracking-widest mb-0.5',
  availableInfoBox:   'p-3 sm:p-4 md:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100',
  availableInfoLabelRow:'text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1',
  availableInfoText:  'text-xs sm:text-sm text-slate-700 break-words',
  cancelWarningBox:   'flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-red-50 rounded-lg sm:rounded-xl border border-red-200',
  alertTriangleIcon:  'w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5',
  cancelWarningText:  'text-xs sm:text-sm text-slate-700 space-y-1',
  cancelActionRow:    'flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end',
  cancelNote:         'text-xs sm:text-sm text-slate-600',
  filterLabelSpan:    'text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap leading-relaxed',
  filterBannerTitle:  'text-xs sm:text-sm font-black text-blue-900 uppercase tracking-wide leading-relaxed',
  filterBannerText:   'text-[10px] sm:text-xs text-blue-700 mt-0.5 sm:mt-1',
  monthCardTop:       'flex items-start justify-between mb-2 md:mb-2.5 w-full gap-1.5 md:gap-2',
  monthCardPctWrap:   'text-right ml-1.5 md:ml-2 flex-shrink-0',
  monthCardBottom:    'mt-auto w-full',
  monthBarFlex:       'h-full flex',
  spaceY2:            'space-y-2',
  errorMsg:           'mt-2 text-xs sm:text-sm text-red-600 font-bold',
  successMsg:         'mt-2 text-xs sm:text-sm text-green-600 font-bold flex items-center gap-1',
  detailsProcLabel:   'text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2',
  detailsProcValue:   'font-black text-slate-800 text-sm sm:text-base break-words',
  stethIcon:          'sm:w-5 sm:h-5 md:w-6 md:h-6',
  checkSmall:         'sm:w-3 sm:h-3',
  checkBigGreen:      'sm:w-8 sm:h-8',
  cancelModalTitle:   'text-sm sm:text-base text-slate-900 font-bold mb-2',
  fontBold:           'font-bold',
  historicoInfo:      'text-xs sm:text-sm font-bold',
  infoMdIcon:         'sm:w-5 sm:h-5',
  xcircleCancelIcon:  'sm:w-[18px] sm:h-[18px]',
  flexOne:            'flex-1',
  monthBarBlue:       'bg-blue-500 transition-all',
  monthBarYellow:     'bg-yellow-400 transition-all',
  monthBarGray:       'bg-slate-300 transition-all',
  monthBloqSpan:      'truncate',
  monthBarOcio:       'ml-1.5 truncate',
  confirmSmIcon:      'sm:w-3 sm:h-3',
}

export default function Calendario() {
  const navigate     = useNavigate()
  const location     = useLocation()
  const queryClient  = useQueryClient()
  const { showSuccess, showError } = useNotifications()
  const { theme } = useTheme()

  const fromReagendamientoNotification = location.state?.fromReagendamientoNotification === true
  const isReagendarMode = location.state?.reagendar === true && (location.state?.surgeryRequestId || typeof sessionStorage !== 'undefined' && sessionStorage.getItem('reagendar_solicitud_id'))

  const [anio, setAnio]                         = useState(new Date().getFullYear())
  const [pabellonId, setPabellonId]             = useState('todos')
  const [filtroPaciente, setFiltroPaciente]     = useState('')
  const [view, setView]                         = useState('year')
  const [selectedMonth, setSelectedMonth]       = useState(null)
  const [selectedWeek, setSelectedWeek]         = useState(null)
  const [selectedDay, setSelectedDay]           = useState(null)
  const [selectedSlot, setSelectedSlot]         = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [horaFin, setHoraFin]                   = useState('')
  const [showDayDetailsModal, setShowDayDetailsModal]   = useState(false)
  const [showDetallesModal, setShowDetallesModal]       = useState(false)
  const [dayDetailsDate, setDayDetailsDate]             = useState(null)
  const [slotDetalle, setSlotDetalle]                   = useState(null)
  const [showConfirmCancelar, setShowConfirmCancelar]   = useState(false)
  const [cirugiaACancelar, setCirugiaACancelar]         = useState(null)
  const [cirugiaAReagendar, setCirugiaAReagendar]       = useState(null)

  const [currentRequest, setCurrentRequest] = useState(() => {
    try {
      const s = sessionStorage.getItem('solicitud_gestionando')
      if (s) return safeParseJSON(s)
    } catch (e) { logger.errorWithContext('Error al parsear solicitud', e) }
    return null
  })

  // Navegación rápida desde dashboard
  useEffect(() => {
    try {
      const modo = sessionStorage.getItem('calendario_ir_hoy')
      if (!modo) return
      sessionStorage.removeItem('calendario_ir_hoy')
      const hoy = new Date()
      setAnio(hoy.getFullYear())
      setSelectedMonth(hoy.getMonth())
      setSelectedDay(hoy)
      if (modo === 'week') {
        setSelectedWeek(startOfWeek(hoy, { weekStartsOn: 1 }))
        setView('week')
      } else {
        setView('day')
      }
    } catch (e) { /* ignorar */ }
  }, [])

  // Llegada desde "Aceptar horario médico"
  useEffect(() => {
    try {
      const fromAceptar = location.state?.fromAceptarHorarioMedico === true || location.state?.fromResume === true
      if (!fromAceptar) return
      const slot = safeParseJSON(sessionStorage.getItem('slot_seleccionado'))
      if (!slot) return
      const fecha = new Date(slot.date)
      if (isNaN(fecha.getTime())) return
      setAnio(fecha.getFullYear())
      setSelectedMonth(fecha.getMonth())
      setSelectedDay(fecha)
      setView('day')
    } catch (e) { logger.errorWithContext('Error al abrir vista día desde aceptar horario', e) }
  }, [location.state?.fromAceptarHorarioMedico, location.state?.fromResume])

  // Modo reagendar
  useEffect(() => {
    if (!isReagendarMode) return
    const requestId = location.state?.surgeryRequestId || sessionStorage.getItem('reagendar_solicitud_id')
    if (!requestId) return
    const load = async () => {
      try {
        const { data: cirugia, error: errCirugia } = await supabase
          .from('surgeries')
          .select('id, surgery_request_id, fecha, hora_inicio, hora_fin, operating_room_id')
          .eq('surgery_request_id', requestId)
          .is('deleted_at', null)
          .maybeSingle()
        if (errCirugia) { showError('No se encontró la cirugía a reagendar.'); return }
        if (!cirugia)   { showError('No hay cirugía programada para esta solicitud.'); return }

        const { data: solicitud, error: errSol } = await supabase
          .from('surgery_requests')
          .select('*, doctors:doctor_id(id, nombre, apellido, especialidad, estado), patients:patient_id(nombre, apellido, rut)')
          .eq('id', requestId)
          .is('deleted_at', null)
          .single()
        if (errSol || !solicitud) { showError('No se pudo cargar la solicitud.'); return }

        setCirugiaAReagendar(cirugia)
        setCurrentRequest(solicitud)
        setView('day')
        setSelectedDay(new Date(cirugia.fecha))
        setSelectedMonth(new Date(cirugia.fecha).getMonth())
        setAnio(new Date(cirugia.fecha).getFullYear())
      } catch (e) { showError('Error al cargar datos para reagendar.') }
    }
    load()
  }, [isReagendarMode, location.state?.surgeryRequestId])

  // Highlight desde notificación
  useEffect(() => {
    try {
      let hl = location.state?.highlight || safeParseJSON(sessionStorage.getItem('highlight_slot'))
      if (!hl) return
      const dateObj = parseISO(hl.date)
      if (isNaN(dateObj.getTime())) { showError('Fecha de la operación inválida.'); return }
      if (!TIME_SLOTS.includes(hl.time)) { showError('Hora de la operación fuera del rango disponible.'); return }
      setAnio(dateObj.getFullYear())
      setSelectedMonth(dateObj.getMonth())
      setSelectedDay(dateObj)
      setView('day')
      setSelectedSlot({ pabellonId: hl.pabellonId, time: hl.time, date: dateObj })
      navigate(location.pathname, { replace: true })
    } catch (e) { logger.errorWithContext('Error procesando highlight de calendario', e) }
  }, [location.state?.highlight])

  // Mutations
  const programarCirugia = useMutation({
    mutationFn: async ({ solicitudId, formData }) => {
      const normalize = (t) => {
        if (t?.match(/^\d{1,2}:\d{2}$/))       { const [h, m] = t.split(':'); return `${h.padStart(2,'0')}:${m.padStart(2,'0')}:00` }
        if (t?.match(/^\d{1,2}:\d{2}:\d{2}$/)) { const [h, m, s] = t.split(':'); return `${h.padStart(2,'0')}:${m.padStart(2,'0')}:${s.padStart(2,'0')}` }
        return t
      }
      const horaInicio = normalize(formData.hora_inicio)
      const horaFinVal = normalize(formData.hora_fin)
      if (!horaInicio?.match(/^\d{2}:\d{2}:\d{2}$/)) throw new Error(`Formato de hora de inicio inválido: ${horaInicio}`)
      if (!horaFinVal?.match(/^\d{2}:\d{2}:\d{2}$/)) throw new Error(`Formato de hora de fin inválido: ${horaFinVal}`)
      const { data, error } = await scheduleSurgery({
        surgeryRequestId: solicitudId,
        operatingRoomId:  formData.operating_room_id,
        fecha:            formData.fecha,
        horaInicio,
        horaFin:          horaFinVal,
        observaciones:    formData.observaciones || null,
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'Error desconocido al programar la cirugía')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      queryClient.invalidateQueries({ queryKey: ['solicitudes-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-hoy'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-calendario'] })
      queryClient.invalidateQueries({ queryKey: ['calendario-anual-cirugias'] })
      showSuccess('Cirugía programada exitosamente')
      sessionStorage.removeItem('solicitud_gestionando')
      sessionStorage.removeItem('slot_seleccionado')
      setShowConfirmModal(false)
      setSelectedSlot(null)
      setCurrentRequest(null)
      navigate('/pabellon/solicitudes')
    },
    onError: (error) => {
      const msg = error.message || error.toString() || 'Error desconocido'
      const details = error.details || ''
      const hint    = error.hint    || ''
      let mensaje = 'Error al programar la cirugía'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))                        mensaje = 'Error de conexión. Verifique su conexión a internet.'
      else if (msg.includes('solapamiento') || msg.includes('overlap') || msg.includes('Ya existe')) mensaje = 'Ya existe una cirugía en este horario. Seleccione otro.'
      else if (msg.includes('hora de fin') || msg.includes('hora de inicio'))                     mensaje = msg
      else if (msg.includes('tiempo de limpieza') || msg.includes('limpieza'))                    mensaje = msg
      else if (msg.includes('doctor debe estar activo'))                                           mensaje = 'El doctor debe estar activo para programar cirugías'
      else if (msg.includes('bloqueado') || msg.includes('blocked'))                              mensaje = 'El horario seleccionado está bloqueado'
      else if (msg.includes('fecha pasada'))                                                       mensaje = 'No se puede agendar en una fecha pasada'
      else if (msg.includes('solicitud') && msg.includes('pendiente'))                            mensaje = 'La solicitud debe estar en estado pendiente'
      else if (error.code === 'PGRST116' || error.code === '42883')                               mensaje = 'Error en la función de base de datos. Contacte al administrador.'
      else mensaje = msg + (details ? ` (${details})` : '') + (hint ? ` - ${hint}` : '')
      showError(mensaje)
    },
  })

  const reagendarCirugia = useMutation({
    mutationFn: async ({ cirugiaId, formData }) => {
      const norm = (t) => t?.match(/^\d{1,2}:\d{2}$/) ? (() => { const [h,m]=t.split(':'); return `${h.padStart(2,'0')}:${m.padStart(2,'0')}:00` })() : t
      const { error } = await rescheduleSurgery(cirugiaId, {
        fecha:           formData.fecha,
        horaInicio:      norm(formData.hora_inicio),
        horaFin:         norm(formData.hora_fin),
        operatingRoomId: formData.operating_room_id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-hoy'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-calendario'] })
      queryClient.invalidateQueries({ queryKey: ['calendario-anual-cirugias'] })
      showSuccess('Cirugía reagendada. Se notificó al doctor y al pabellón.')
      sessionStorage.removeItem('reagendar_solicitud_id')
      setShowConfirmModal(false); setSelectedSlot(null); setCurrentRequest(null); setCirugiaAReagendar(null)
      navigate('/pabellon/solicitudes')
    },
    onError: (error) => {
      const msg = error.message || error.toString()
      if (msg.includes('solapamiento') || msg.includes('Ya existe')) showError('Ya existe una cirugía en ese horario.')
      else if (msg.includes('bloqueado')) showError('El horario está bloqueado.')
      else showError('Error al reagendar: ' + msg)
    },
  })

  const cancelarCirugia = useMutation({
    mutationFn: async (cirugiaId) => {
      const { data: cirugia, error: errorCirugia } = await fetchSurgeryById(cirugiaId)
      if (errorCirugia) throw errorCirugia
      const { error } = await cancelSurgery(cirugiaId)
      if (error) throw error
      if (cirugia.doctor_id) {
        const { data: doctorUser } = await getDoctorUserIdById(cirugia.doctor_id)
        if (doctorUser?.user_id) {
          createNotification({
            user_id: doctorUser.user_id,
            tipo:    'operacion_programada',
            titulo:  'Cirugía Cancelada',
            mensaje: `La cirugía programada para ${cirugia.patients?.nombre} ${cirugia.patients?.apellido} el ${format(new Date(cirugia.fecha), 'dd/MM/yyyy')} a las ${cirugia.hora_inicio} ha sido cancelada por el pabellón.`,
            relacionado_con: cirugiaId,
          })
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendario-anual-cirugias'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-dia-detalle'] })
      queryClient.invalidateQueries({ queryKey: ['cirugias-fecha'] })
      showSuccess('Cirugía cancelada exitosamente. El doctor ha sido notificado.')
      setShowConfirmCancelar(false); setCirugiaACancelar(null); setShowDetallesModal(false); setShowDayDetailsModal(false); setSlotDetalle(null)
    },
    onError: (error) => {
      const msg = error.message || error.toString() || 'Error desconocido'
      showError(msg.includes('Failed to fetch') ? 'Error de conexión.' : 'Error al cancelar la cirugía: ' + msg)
    },
  })

  // Handlers
  const handleConfirmSlot = () => {
    if (selectedSlot && currentRequest) {
      const [h, m] = selectedSlot.time.split(':')
      const d = new Date()
      d.setHours(parseInt(h) + 1, parseInt(m), 0, 0)
      setHoraFin(`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`)
      setShowConfirmModal(true)
    }
  }

  const handleConfirmarCupo = () => {
    if (!selectedSlot || !currentRequest || !horaFin) return
    const [ih, im] = selectedSlot.time.split(':').map(Number)
    const [fh, fm] = horaFin.split(':').map(Number)
    if (fh * 60 + fm <= ih * 60 + im) { showError('La hora de fin debe ser mayor que la hora de inicio'); return }
    const formData = { fecha: format(selectedSlot.date, 'yyyy-MM-dd'), hora_inicio: selectedSlot.time, hora_fin: horaFin, operating_room_id: selectedSlot.pabellonId, observaciones: '' }
    if (cirugiaAReagendar) reagendarCirugia.mutate({ cirugiaId: cirugiaAReagendar.id, formData })
    else programarCirugia.mutate({ solicitudId: currentRequest.id, formData })
  }

  const handleSelectSlotFromModal = (slot) => {
    if (!dayDetailsDate) return
    setSelectedSlot({ pabellonId: slot.pabellon.id, time: slot.time, date: dayDetailsDate })
    setShowDayDetailsModal(false)
    const [h, m] = slot.time.split(':')
    const d = new Date()
    d.setHours(parseInt(h) + 1, parseInt(m), 0, 0)
    setHoraFin(`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`)
    setShowConfirmModal(true)
  }

  const handleNavigate = (targetView, newAnio = null, newMonth = null) => {
    if (targetView === 'year') {
      setView('year'); setSelectedMonth(null); setSelectedWeek(null); setSelectedDay(null); setSelectedSlot(null)
    } else if (targetView === 'month') {
      setView('month'); setSelectedWeek(null); setSelectedDay(null); setSelectedSlot(null)
      if (newAnio  !== null) setAnio(newAnio)
      if (newMonth !== null) setSelectedMonth(newMonth)
    } else if (targetView === 'week') {
      setView('week'); setSelectedDay(null); setSelectedSlot(null)
    }
  }

  // Queries
  const inicioAnio      = startOfYear(new Date(anio, 0, 1))
  const finAnio         = endOfYear(new Date(anio, 0, 1))
  const fechaInicioStr  = inicioAnio.toISOString().slice(0, 10)
  const fechaFinStr     = finAnio.toISOString().slice(0, 10)

  const { data: cirugias = [], isLoading: loadingCirugias } = useQuery({
    queryKey: ['calendario-anual-cirugias', anio, filtroPaciente],
    refetchInterval: 10000,
    queryFn: async () => {
      let inicio = fechaInicioStr
      let fin    = fechaFinStr
      if (filtroPaciente) {
        const inf = new Date(); inf.setFullYear(inf.getFullYear() - 5)
        const sup = new Date(); sup.setFullYear(sup.getFullYear() + 2)
        inicio = inf.toISOString().slice(0, 10)
        fin    = sup.toISOString().slice(0, 10)
      }
      const { data, error } = await fetchSurgeriesByDateRange(inicio, fin)
      if (error) throw error
      if (filtroPaciente && data) {
        const f = filtroPaciente.toLowerCase().trim()
        return data.filter(c => `${c.patients?.nombre || ''} ${c.patients?.apellido || ''}`.toLowerCase().includes(f))
      }
      return data
    },
  })

  const { data: bloqueos = [], isLoading: loadingBloqueos } = useQuery({
    queryKey: ['calendario-anual-bloqueos', anio],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await fetchScheduleBlocksByDateRange(fechaInicioStr, fechaFinStr)
      if (error) throw error
      return data
    },
  })

  const { data: cirugiasDetalle = [] } = useQuery({
    queryKey: ['cirugias-dia-detalle', selectedDay, filtroPaciente],
    refetchInterval: 10000,
    queryFn: async () => {
      if (!selectedDay) return []
      const { data, error } = await fetchSurgeriesByDay(format(selectedDay, 'yyyy-MM-dd'))
      if (error) throw error
      if (filtroPaciente && data) {
        const f = filtroPaciente.toLowerCase().trim()
        return data.filter(c => `${c.patients?.nombre || ''} ${c.patients?.apellido || ''}`.toLowerCase().includes(f))
      }
      return data
    },
    enabled: !!selectedDay && view === 'day',
  })

  const { data: pabellones = [] } = useQuery({
    queryKey: ['pabellones-calendario'],
    queryFn: async () => {
      const { data, error } = await fetchRooms()
      if (error) throw error
      return data
    },
  })

  const statsMeses = useMemo(() => {
    return MESES.map((mes) => {
      const inicioMes = new Date(anio, mes.indice, 1)
      const finMes    = endOfMonth(inicioMes)
      const cirugiasMes = cirugias.filter(c => {
        if (pabellonId !== 'todos' && c.operating_room_id !== pabellonId) return false
        return isWithinInterval(new Date(c.fecha), { start: inicioMes, end: finMes })
      })
      const bloqueosMes = bloqueos.filter(b => {
        if (pabellonId !== 'todos' && b.operating_room_id !== pabellonId) return false
        return isWithinInterval(new Date(b.fecha), { start: inicioMes, end: finMes })
      })
      const total = cirugiasMes.length + bloqueosMes.length
      const porcentajeAgendado  = total > 0 ? Math.round((cirugiasMes.length / total) * 100) : 0
      const porcentajeBloqueado = total > 0 ? Math.round((bloqueosMes.length / total) * 100) : 0
      return { ...mes, cirugiasEstimadas: cirugiasMes.length, porcentajeAgendado, porcentajeBloqueado, porcentajeLibre: Math.max(0, 100 - porcentajeAgendado - porcentajeBloqueado) }
    })
  }, [anio, pabellonId, cirugias, bloqueos])

  const isOverlap = useMemo(() => {
    if (!selectedSlot || !horaFin || !horaFin.match(/^\d{2}:\d{2}$/)) return false
    const fechaStr = format(selectedSlot.date, 'yyyy-MM-dd')
    return cirugias.some(c => {
      if (c.fecha !== fechaStr || c.operating_room_id !== selectedSlot.pabellonId || c.estado === 'cancelada') return false
      if (cirugiaAReagendar && c.id === cirugiaAReagendar.id) return false
      return selectedSlot.time < c.hora_fin && horaFin > c.hora_inicio
    })
  }, [selectedSlot, horaFin, cirugias, cirugiaAReagendar])

  const isDark    = theme === 'dark'
  const isMedical = theme === 'medical'
  const cargando  = loadingCirugias || loadingBloqueos

  return (
    <div className={S.page}>
      {/* Aviso reagendamiento */}
      {(fromReagendamientoNotification || (isReagendarMode && cirugiaAReagendar)) && (
        <div className={isDark ? S.reagendAlertDark : S.reagendAlertLight}>
          <Clock className={S.alertIcon} />
          <div className={S.flexOne}>
            <p className={S.alertTitle}>Reagendamiento</p>
            <p className={S.alertText}>
              {cirugiaAReagendar ? 'Seleccione el nuevo horario en el calendario y confirme. Se notificará al doctor y al pabellón.' : 'Seleccione un nuevo horario en el calendario o vaya a Solicitudes.'}
            </p>
          </div>
          <button type="button" onClick={() => { try { if (currentRequest) sessionStorage.setItem('solicitud_gestionando', JSON.stringify(currentRequest)) } catch {} navigate('/pabellon/solicitudes', { state: { openProgramacion: true } }) }} className={S.alertLink}>
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
            <div className={isDark ? S.yearSelectorDark : isMedical ? S.yearSelectorMed : S.yearSelectorLight} role="group" aria-label="Selector de año">
              <button onClick={() => setAnio(anio - 1)} className={isDark ? S.yearBtnDark : S.yearBtnLight} aria-label="Año anterior">
                <ChevronLeft className={isDark ? S.yearBtnIconDark : S.yearBtnIconLight} />
              </button>
              <span className={isDark ? S.yearTextDark : S.yearTextLight} aria-live="polite">{anio}</span>
              <button onClick={() => setAnio(anio + 1)} className={isDark ? S.yearBtnDark : S.yearBtnLight} aria-label="Año siguiente">
                <ChevronRight className={isDark ? S.yearBtnIconDark : S.yearBtnIconLight} />
              </button>
            </div>
          )}
          <div className={S.searchBar}>
            <Search className={S.searchIcon} />
            <input type="text" value={filtroPaciente} onChange={(e) => setFiltroPaciente(sanitizeString(e.target.value))} placeholder="Buscar por nombre de paciente..." className={S.searchInput} aria-label="Buscar por nombre de paciente" />
            {filtroPaciente && <button onClick={() => setFiltroPaciente('')} className={S.clearBtn} aria-label="Limpiar búsqueda"><X className={S.xIcon} /></button>}
          </div>
          <div className={S.searchBar}>
            <span className={S.filterLabelSpan}>Filtrar:</span>
            <select value={pabellonId} onChange={(e) => setPabellonId(sanitizeString(e.target.value))} className={S.filterSelect} aria-label="Filtrar por pabellón">
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
                <div className={isDark ? S.legendDark : S.legendLight}>
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
                    className={isDark ? S.monthCardDark : isMedical ? S.monthCardMed : S.monthCardLight}
                    aria-label={`Ver ${mes.nombre} - ${mes.cirugiasEstimadas} cirugías estimadas, ${mes.porcentajeAgendado}% ocupación`}
                  >
                    <div className={S.monthCardTop}>
                      <div className="flex-1 min-w-0">
                        <h2 className={isDark ? S.monthNameDark : S.monthNameLight}>{mes.nombre}</h2>
                        <p className={isDark ? S.monthSubDark : S.monthSubLight}>{mes.cirugiasEstimadas} cirugías est.</p>
                      </div>
                      <div className={S.monthCardPctWrap}>
                        <p className={isDark ? S.monthPctDark : S.monthPctLight}>{mes.porcentajeAgendado}%</p>
                        <p className={S.monthPctLabel}>Agendado</p>
                      </div>
                    </div>
                    <div className={S.monthCardBottom}>
                      <div className={isDark ? S.progressBgDark : S.progressBgLight}>
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
              showError={showError}
            />
          )}
        </>
      )}

      {/* Modal confirmar agendamiento */}
      {showConfirmModal && selectedSlot && currentRequest && (
        <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title={cirugiaAReagendar ? 'Confirmar Reagendamiento' : 'Confirmar Agendamiento'}>
          <div className={S.confirmModalBody}>
            <div className={S.confirmGradBox}>
              <div className={S.confirmAvatarRow}>
                <div className={S.confirmAvatar}>{currentRequest.patients?.nombre?.charAt(0).toUpperCase() || 'P'}</div>
                <div className="flex-1 min-w-0">
                  <div className={S.confirmPatientLabel}>Paciente</div>
                  <div className={S.confirmPatientName}>{currentRequest.patients?.nombre} {currentRequest.patients?.apellido}</div>
                  <div className={S.confirmPatientRut}>RUT: {currentRequest.patients?.rut}</div>
                </div>
              </div>
              <div className={S.confirmProcBox}>
                <div className={S.confirmProcLabelRow}><Activity size={10} className={S.confirmSmIcon} />Procedimiento</div>
                <div className={S.confirmProcName}>{codigosOperaciones.find(c => c.codigo === currentRequest.codigo_operacion)?.nombre || currentRequest.codigo_operacion}</div>
                <div className={S.confirmProcCode}>Código: {currentRequest.codigo_operacion}</div>
              </div>
            </div>

            <div className={S.confirmGrid}>
              {[
                { icon: <Clock size={10} className={S.confirmSmIcon} />, label: 'Horario', value: `${selectedSlot.time} - ${horaFin || '--:--'}` },
                { icon: <CalendarIcon size={10} className={S.confirmSmIcon} />, label: 'Pabellón', value: pabellones.find(p => p.id === selectedSlot.pabellonId)?.nombre || 'N/A' },
                { icon: <CalendarIcon size={10} className={S.confirmSmIcon} />, label: 'Fecha', value: format(selectedSlot.date, 'EEEE d', { locale: es }), sub: format(selectedSlot.date, 'MMMM yyyy', { locale: es }) },
                { icon: <Stethoscope size={10} className={S.confirmSmIcon} />, label: 'Cirujano', value: `Dr. ${currentRequest.doctors?.apellido || currentRequest.doctors?.nombre}` },
              ].map(({ icon, label, value, sub }) => (
                <div key={label} className={S.confirmGridCell}>
                  <div className={S.confirmCellLabelRow}>{icon}{label}</div>
                  <div className={S.confirmCellValue}>{value}</div>
                  {sub && <div className={S.confirmProcCode}>{sub}</div>}
                </div>
              ))}
            </div>

            <div className={S.spaceY2}>
              <label htmlFor="hora-fin" className={S.horaFinLabel}>Hora Fin *</label>
              <TimeInput id="hora-fin" value={horaFin} onChange={(e) => {
                const v = e.target.value
                if (selectedSlot && v?.match(/^\d{2}:\d{2}$/)) {
                  const [ih, im] = selectedSlot.time.split(':').map(Number)
                  const [fh, fm] = v.split(':').map(Number)
                  if (fh * 60 + fm <= ih * 60 + im) { showError('La hora de fin debe ser mayor que la hora de inicio'); return }
                }
                setHoraFin(v)
              }} min={selectedSlot?.time} className={S.horaFinInput} required aria-required="true" aria-label="Hora de fin de la cirugía" />
              {selectedSlot && horaFin && (() => {
                const [ih, im] = selectedSlot.time.split(':').map(Number)
                const [fh, fm] = horaFin.split(':').map(Number)
                const esValido = fh * 60 + fm > ih * 60 + im
                if (isOverlap) return <div className={S.overlapAlert}><p className={S.overlapTitle}><AlertTriangle size={16} />Conflicto de horario detectado</p><p className={S.overlapText}>El horario se solapa con otra cirugía existente en este pabellón.</p></div>
                return !esValido
                  ? <p className={S.errorMsg} role="alert">La hora de fin debe ser mayor que {selectedSlot.time}</p>
                  : <p className={S.successMsg}><CheckCircle2 size={14} />Duración: {Math.round((fh * 60 + fm - ih * 60 - im) / 60)} horas</p>
              })()}
            </div>

            <div className={S.confirmActions}>
              <Button variant="secondary" onClick={() => setShowConfirmModal(false)} className="flex-1 w-full sm:w-auto touch-manipulation" disabled={programarCirugia.isPending || reagendarCirugia.isPending}>Cancelar</Button>
              <Button loading={programarCirugia.isPending || reagendarCirugia.isPending} onClick={handleConfirmarCupo} disabled={!horaFin || programarCirugia.isPending || reagendarCirugia.isPending || isOverlap} className="flex-1 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed">
                {cirugiaAReagendar ? 'Confirmar Reagendamiento' : 'Confirmar Agendamiento'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal detalles del slot */}
      <Modal isOpen={showDetallesModal} onClose={() => { setShowDetallesModal(false); setSlotDetalle(null) }} title={slotDetalle?.type === 'occupied' ? 'Detalles de Cirugía' : 'Detalles del Horario'}>
        {slotDetalle && (
          <div className={S.confirmModalBody}>
            {slotDetalle.type === 'occupied' && slotDetalle.data ? (
              <>
                <div className={S.patientInfoBox}>
                  <div className={S.patientAvatar}>{slotDetalle.data.patients?.nombre?.charAt(0).toUpperCase() || 'P'}</div>
                  <div className="min-w-0 flex-1">
                    <div className={S.infoBoxLabel}>Paciente</div>
                    <div className={S.infoBoxName}>{slotDetalle.data.patients?.nombre || 'N/A'} {slotDetalle.data.patients?.apellido || ''}</div>
                    {slotDetalle.data.patients?.rut && <div className={S.confirmProcCode}>RUT: {slotDetalle.data.patients.rut}</div>}
                  </div>
                </div>
                <div className={S.doctorBox}>
                  <div className={S.doctorAvatar}><Stethoscope size={18} className={S.stethIcon} /></div>
                  <div className="min-w-0 flex-1">
                    <div className={S.doctorLabelBlue}>Cirujano</div>
                    <div className={S.infoBoxName}>Dr. {slotDetalle.data.doctors?.apellido || slotDetalle.data.doctors?.nombre || 'General'}</div>
                    {slotDetalle.data.doctors?.especialidad && <div className={S.confirmProcCode}>{slotDetalle.data.doctors.especialidad}</div>}
                  </div>
                </div>
                {(() => {
                  const cod = slotDetalle.data.surgery_requests?.codigo_operacion || slotDetalle.data.codigo_operacion
                  if (!cod) return null
                  const obj = codigosOperaciones.find(c => c.codigo === cod)
                  return (
                    <div className={S.procedureBox}>
                      <div className={S.detailsProcLabel}>Procedimiento</div>
                      <div className={S.detailsProcValue}>{obj?.nombre || cod}</div>
                      <div className={S.confirmProcCode}>Código: {cod}</div>
                    </div>
                  )
                })()}
                <div className={S.confirmGrid}>
                  <div className={S.detailBox}>
                    <div className={S.detailBoxLabelRow}><Clock size={9} className={S.confirmSmIcon} /> Horario</div>
                    <div className={S.detailBoxValue}>{slotDetalle.data.hora_inicio?.substring(0,5)} - {slotDetalle.data.hora_fin?.substring(0,5)}</div>
                  </div>
                  <div className={S.detailBox}>
                    <div className={S.detailBoxLabelRow}><CalendarIcon size={9} className={S.confirmSmIcon} /> Pabellón</div>
                    <div className={S.detailsProcValue}>{slotDetalle.pabellon}</div>
                  </div>
                </div>
                <div className={S.detailBox}>
                  <div className={S.detailBoxLabelRow}><CalendarIcon size={9} className={S.confirmSmIcon} /> Fecha</div>
                  <div className={S.detailsProcValue}>{format(slotDetalle.date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</div>
                </div>
                {slotDetalle.data.observaciones && <div className={S.procedureBox}><div className={S.detailsProcLabel}>Observaciones</div><div className={S.availableInfoText}>{slotDetalle.data.observaciones}</div></div>}
                <div className={S.detailBox}>
                  <div className={S.detailsProcLabel}>Estado</div>
                  <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold text-[10px] sm:text-xs ${slotDetalle.data.estado === 'programada' ? 'bg-green-100 text-green-700' : slotDetalle.data.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' : slotDetalle.data.estado === 'cancelada' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    <CheckCircle2 size={10} className={S.checkSmall} />
                    {slotDetalle.data.estado === 'programada' ? 'Programada' : slotDetalle.data.estado === 'en_proceso' ? 'En Proceso' : slotDetalle.data.estado}
                  </div>
                </div>
                {slotDetalle.data.estado === 'programada' && slotDetalle.date && !isPast(startOfDay(slotDetalle.date)) && (
                  <div className={S.detailBox}>
                    <button onClick={() => { setSlotDetalle({ ...slotDetalle, action: 'cancel' }); setShowDetallesModal(false); setShowConfirmCancelar(true); setCirugiaACancelar(slotDetalle.data) }}
                      className="w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-2 touch-manipulation">
                      <XCircle size={16} className={S.xcircleCancelIcon} />Cancelar Cirugía
                    </button>
                  </div>
                )}
                {slotDetalle.date && isPast(startOfDay(slotDetalle.date)) && (
                  <div className={S.detailBoxBlue}>
                    <div className={S.historicoRow}><Info size={16} className={S.infoMdIcon} /><p className={S.historicoInfo}>Esta cirugía pertenece a un día histórico. Solo se puede consultar información.</p></div>
                  </div>
                )}
              </>
            ) : slotDetalle.type === 'available' ? (
              <>
                <div className={S.availableBox}>
                  <div className={S.availableAvatar}><CheckCircle2 size={24} className={S.checkBigGreen} /></div>
                  <div className="min-w-0 flex-1">
                    <div className={S.availLabelGreen}>Horario Disponible</div>
                    <div className={S.infoBoxName}>{slotDetalle.pabellon}</div>
                    <div className={S.confirmProcCode}>{slotDetalle.time}</div>
                  </div>
                </div>
                <div className={S.confirmGrid}>
                  <div className={S.detailBox}><div className={S.detailBoxLabelRow}><Clock size={9} className={S.confirmSmIcon} /> Hora</div><div className={S.detailBoxValue}>{slotDetalle.time}</div></div>
                  <div className={S.detailBox}><div className={S.detailBoxLabelRow}><CalendarIcon size={9} className={S.confirmSmIcon} /> Fecha</div><div className={S.detailsProcValue}>{format(slotDetalle.date, "EEEE d 'de' MMMM", { locale: es })}</div></div>
                </div>
                <div className={S.availableInfoBox}>
                  <div className={S.availableInfoLabelRow}><Info size={9} className={S.confirmSmIcon} /> Información</div>
                  <div className={S.availableInfoText}>Este horario está disponible para agendar una nueva cirugía. Para proceder, primero debe seleccionar una solicitud desde la bandeja de solicitudes.</div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </Modal>

      {/* Modal confirmar cancelación */}
      <Modal isOpen={showConfirmCancelar} onClose={() => { setShowConfirmCancelar(false); setCirugiaACancelar(null) }} title="Confirmar Cancelación">
        {cirugiaACancelar && (
          <div className={S.confirmModalBody}>
            <div className={S.cancelWarningBox}>
              <AlertTriangle className={S.alertTriangleIcon} />
              <div className="min-w-0 flex-1">
                <p className={S.cancelModalTitle}>¿Está seguro de que desea cancelar esta cirugía?</p>
                <div className={S.cancelWarningText}>
                  <p><span className={S.fontBold}>Paciente:</span> {cirugiaACancelar.patients?.nombre} {cirugiaACancelar.patients?.apellido}</p>
                  <p><span className={S.fontBold}>Doctor:</span> Dr. {cirugiaACancelar.doctors?.apellido || cirugiaACancelar.doctors?.nombre}</p>
                  <p><span className={S.fontBold}>Fecha:</span> {format(new Date(cirugiaACancelar.fecha), 'dd/MM/yyyy')}</p>
                  <p><span className={S.fontBold}>Horario:</span> {cirugiaACancelar.hora_inicio?.substring(0,5)} - {cirugiaACancelar.hora_fin?.substring(0,5)}</p>
                  <p><span className={S.fontBold}>Pabellón:</span> {slotDetalle?.pabellon || 'N/A'}</p>
                </div>
              </div>
            </div>
            <p className={S.cancelNote}>Esta acción no se puede deshacer. El doctor será notificado automáticamente de la cancelación.</p>
            <div className={S.cancelActionRow}>
              <Button variant="secondary" onClick={() => { setShowConfirmCancelar(false); setCirugiaACancelar(null) }} disabled={cancelarCirugia.isPending} className="w-full sm:w-auto touch-manipulation">Cancelar</Button>
              <Button onClick={() => cirugiaACancelar && cancelarCirugia.mutate(cirugiaACancelar.id)} loading={cancelarCirugia.isPending} disabled={cancelarCirugia.isPending} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto touch-manipulation">Confirmar Cancelación</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
