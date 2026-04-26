export const PERIODOS = [
  { id: 'semana',    label: '7 días' },
  { id: 'mes',       label: '30 días' },
  { id: 'trimestre', label: '3 meses' },
  { id: 'año',       label: '1 año' },
  { id: 'custom',    label: 'Personalizado' },
]

export const ESTADO_COLORS = {
  programada: '#2563eb',
  completada: '#16a34a',
  cancelada:  '#dc2626',
  en_proceso: '#d97706',
}

export const ESTADO_LABELS = {
  programada: 'Programada',
  completada: 'Completada',
  cancelada:  'Cancelada',
  en_proceso: 'En Proceso',
}

export const PAGE_SIZE = 15

export function calcDuration(h1, h2) {
  if (!h1 || !h2) return 0
  const ini = new Date(`2000-01-01T${h1}`)
  const fin = new Date(`2000-01-01T${h2}`)
  return Math.max((fin - ini) / (1000 * 60), 0)
}

export function fmtDur(min) {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export const STYLES = {
  page:            'animate-in fade-in slide-in-from-bottom-4 duration-500',
  header:          'flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-8',
  titleDark:       'text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase text-white',
  titleLight:      'text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase text-slate-900',
  subtitle:        'font-bold text-[10px] sm:text-xs uppercase tracking-widest mt-1 text-slate-400',
  actionsRow:      'flex flex-wrap items-center gap-2',
  btnBase:         'px-4 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition-all touch-manipulation active:scale-95',
  btnDark:         'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700',
  btnLight:        'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm',
  btnMedical:      'bg-white border border-blue-200 text-slate-700 hover:bg-blue-50',
  periodRow:       'flex flex-wrap gap-2 mb-6 sm:mb-8',
  toggleGroup:     'inline-flex rounded-full bg-slate-100 text-[10px] sm:text-xs p-1',
  toggleActive:    'px-3 py-1.5 rounded-full font-bold uppercase tracking-tight transition-colors bg-blue-600 text-white shadow-sm',
  toggleInactive:  'px-3 py-1.5 rounded-full font-bold uppercase tracking-tight transition-colors bg-transparent text-slate-500 hover:text-slate-900',
  dateRow:         'flex flex-wrap items-center gap-2 text-xs mt-2',
  dateLabel:       'font-black uppercase text-[10px] text-slate-400',
  dateInput:       'text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
  kpiGrid:         'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8',
  chartsGrid:      'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8',
  chartTitle:      'font-black uppercase text-xs sm:text-sm flex items-center gap-2 mb-4',
  filterRow:       'flex flex-wrap gap-3 mb-4 items-end',
  filterGroup:     'flex flex-col gap-1',
  filterLabel:     'text-[10px] font-black uppercase text-slate-400',
  filterSelect:    'text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]',
  tableWrap:       'overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0',
  table:           'w-full text-xs border-collapse',
  th:              'text-left py-2.5 px-3 font-black uppercase tracking-wide text-slate-500 border-b-2 border-slate-100 whitespace-nowrap bg-slate-50/80',
  td:              'py-2.5 px-3 whitespace-nowrap text-slate-600',
  tdBold:          'py-2.5 px-3 whitespace-nowrap font-semibold text-slate-800',
  trRow:           'border-b border-slate-50 hover:bg-slate-50/60 transition-colors',
  pagination:      'flex items-center justify-between mt-4 pt-4 border-t border-slate-100',
  pageInfo:        'text-xs font-semibold text-slate-400',
  pageBtn:         'p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-600',
  emptyCell:       'text-center py-12 text-sm font-semibold text-slate-400',
  sectionLabel:    'font-black uppercase text-xs flex items-center gap-2',
  tableCardHeader: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4',
}
