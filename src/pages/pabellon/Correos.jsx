import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Mail, MailOpen, Archive, Trash2, Clock, AlertTriangle,
  Search, User, Phone, Building2, ChevronDown, ChevronUp,
  StickyNote, Link2, CheckCircle2
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useTheme } from '@/contexts/ThemeContext'
import { sanitizeString } from '@/utils/sanitizeInput'
import EmptyState from '@/components/common/EmptyState'
import Modal from '@/components/common/Modal'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:             'animate-in fade-in slide-in-from-right duration-500 max-w-5xl mx-auto px-4 sm:px-6 lg:px-0',
  header:           'mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4',
  titleDark:        'text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase mb-1 text-white',
  titleLight:       'text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900',
  subtitle:         'text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400',
  linkBtnDark:      'flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase transition-all border-slate-700 text-slate-300 hover:bg-slate-800',
  linkBtnLight:     'flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase transition-all border-slate-200 text-slate-600 hover:bg-slate-50',
  tabsWrapDark:     'flex gap-1 p-1 rounded-2xl mb-6 bg-slate-800',
  tabsWrapLight:    'flex gap-1 p-1 rounded-2xl mb-6 bg-slate-100',
  tabActive:        'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-blue-600 text-white shadow-md',
  tabInactiveDark:  'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-slate-400 hover:text-white',
  tabInactiveLight: 'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-slate-500 hover:text-slate-800',
  tabBadgeActive:   'px-1.5 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white',
  tabBadgeInactive: 'px-1.5 py-0.5 rounded-full text-[9px] font-black bg-slate-200 text-slate-600',
  searchWrap:       'relative mb-6',
  searchIcon:       'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400',
  searchDark:       'w-full pl-11 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium transition-all bg-slate-800 border-slate-700 text-white placeholder-slate-500',
  searchLight:      'w-full pl-11 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium transition-all bg-white border-slate-200 text-slate-700 placeholder-slate-400',
  skeletonWrap:     'space-y-3',
  skeletonDark:     'h-24 rounded-2xl animate-pulse bg-slate-800',
  skeletonLight:    'h-24 rounded-2xl animate-pulse bg-slate-100',
  list:             'space-y-3',
  cardUnreadDark:   'rounded-2xl border transition-all bg-blue-950/40 border-blue-700',
  cardUnreadLight:  'rounded-2xl border transition-all bg-blue-50 border-blue-200',
  cardReadDark:     'rounded-2xl border transition-all bg-slate-800 border-slate-700',
  cardReadLight:    'rounded-2xl border transition-all bg-white border-slate-200',
  cardRow:          'flex items-start gap-4 p-4 sm:p-5 cursor-pointer',
  iconUnread:       'flex-shrink-0 mt-0.5 text-blue-500',
  iconReadDark:     'flex-shrink-0 mt-0.5 text-slate-500',
  iconReadLight:    'flex-shrink-0 mt-0.5 text-slate-300',
  cardContent:      'flex-1 min-w-0',
  cardMeta:         'flex flex-wrap items-center gap-2 mb-1',
  sourceBadgeGmailDark:  'text-[9px] font-black px-1.5 py-0.5 rounded-md border bg-red-900/40 text-red-300 border-red-700',
  sourceBadgeGmailLight: 'text-[9px] font-black px-1.5 py-0.5 rounded-md border bg-red-50 text-red-600 border-red-200',
  sourceBadgeFormDark:   'text-[9px] font-black px-1.5 py-0.5 rounded-md border bg-slate-700 text-slate-400 border-slate-600',
  sourceBadgeFormLight:  'text-[9px] font-black px-1.5 py-0.5 rounded-md border bg-slate-100 text-slate-500 border-slate-200',
  senderUnreadDark:  'font-black text-sm truncate text-white',
  senderUnreadLight: 'font-black text-sm truncate text-slate-900',
  senderReadDark:    'font-black text-sm truncate text-slate-300',
  senderReadLight:   'font-black text-sm truncate text-slate-600',
  unreadDot:        'w-2 h-2 rounded-full bg-blue-500 flex-shrink-0',
  subjectDark:      'text-sm font-bold truncate text-slate-200',
  subjectLight:     'text-sm font-bold truncate text-slate-800',
  previewDark:      'text-xs mt-0.5 truncate text-slate-400',
  previewLight:     'text-xs mt-0.5 truncate text-slate-500',
  cardRight:        'flex-shrink-0 flex flex-col items-end gap-2 ml-2',
  dateDark:         'text-[10px] font-bold text-slate-400',
  dateLight:        'text-[10px] font-bold text-slate-400',
  detailDark:       'border-t px-4 sm:px-5 pb-5 pt-4 space-y-4 border-slate-700',
  detailLight:      'border-t px-4 sm:px-5 pb-5 pt-4 space-y-4 border-slate-100',
  infoGridDark:     'grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 rounded-xl bg-slate-700/50',
  infoGridLight:    'grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 rounded-xl bg-slate-50',
  infoRow:          'flex items-center gap-2',
  infoIcon:         'w-3.5 h-3.5 text-blue-500 flex-shrink-0',
  infoTextDark:     'text-slate-300',
  infoTextLight:    'text-slate-700',
  patientBoxDark:   'text-xs p-3 rounded-xl border bg-slate-700/30 border-slate-600',
  patientBoxLight:  'text-xs p-3 rounded-xl border bg-blue-50 border-blue-100',
  patientLabelDark: 'font-black uppercase text-[10px] mb-2 text-slate-400',
  patientLabelLight:'font-black uppercase text-[10px] mb-2 text-slate-400',
  patientTextDark:  'text-slate-200',
  patientTextLight: 'text-slate-700',
  sectionLabel:     'text-[10px] font-black uppercase mb-2 text-slate-400',
  sectionLabelRow:  'text-[10px] font-black uppercase mb-2 flex items-center gap-1.5 text-slate-400',
  msgTextDark:      'text-sm whitespace-pre-wrap leading-relaxed text-slate-200',
  msgTextLight:     'text-sm whitespace-pre-wrap leading-relaxed text-slate-700',
  textareaDark:     'w-full px-3 py-2 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500',
  textareaLight:    'w-full px-3 py-2 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-slate-200 text-slate-700 placeholder-slate-400',
  notesFooter:      'flex justify-end mt-2',
  saveNotesBtn:     'px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50',
  actionsRow:       'flex flex-wrap gap-2 pt-2',
  replyBtn:         'flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors',
  archiveBtnDark:   'flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors border-slate-600 text-slate-300 hover:bg-slate-700',
  archiveBtnLight:  'flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors border-slate-200 text-slate-600 hover:bg-slate-50',
  deleteBtn:        'flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors',
  modalText:        'text-sm text-slate-600',
  modalTextDark:    'text-sm text-slate-300',
  linkBoxDark:      'flex items-center gap-2 p-3 rounded-xl border bg-slate-800 border-slate-700',
  linkBoxLight:     'flex items-center gap-2 p-3 rounded-xl border bg-slate-50 border-slate-200',
  linkCodeDark:     'flex-1 text-xs break-all text-blue-300',
  linkCodeLight:    'flex-1 text-xs break-all text-blue-700',
  copyBtn:          'px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex-shrink-0',
  modalHintDark:    'text-xs text-slate-400',
  modalHintLight:   'text-xs text-slate-500',
  deleteModalText:  'text-slate-700',
  deleteModalFooter:'flex gap-4 justify-end',
  cancelBtn:        'px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors',
  confirmDeleteBtn: 'px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors',
  iconSm:           'w-4 h-4',
  iconMd:           'w-5 h-5',
  iconXs:           'w-3.5 h-3.5',
  iconUrgency:      'inline w-3 h-3 mr-0.5 -mt-0.5',
  chevronIcon:      'w-4 h-4 text-slate-400',
  boldLabel:        'font-black',
  boldText:         'font-bold',
  emailLink:        'text-blue-500 hover:underline truncate',
  spaceY4:          'space-y-4',
  spaceY6:          'space-y-6',
}

const URGENCIA_CONFIG = {
  urgente: { label: 'Urgente', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: AlertTriangle },
  normal:  { label: 'Normal',  bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: Clock },
  electiva:{ label: 'Electiva',bg: 'bg-green-100',text: 'text-green-800',border: 'border-green-200',icon: CheckCircle2 },
}

export default function Correos() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { showSuccess, showError } = useNotifications()
  const queryClient = useQueryClient()

  const [filtro, setFiltro] = useState('no_leidos') // no_leidos | todos | archivados
  const [busqueda, setBusqueda] = useState('')
  const [mensajeAbierto, setMensajeAbierto] = useState(null)
  const [notasEditando, setNotasEditando] = useState('')
  const [guardandoNotas, setGuardandoNotas] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  // ──────────────── QUERY ────────────────
  const { data: mensajes = [], isLoading } = useQuery({
    queryKey: ['external-messages', filtro],
    queryFn: async () => {
      let query = supabase
        .from('external_messages')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (filtro === 'no_leidos') {
        query = query.eq('leido', false).eq('archivado', false)
      } else if (filtro === 'todos') {
        query = query.eq('archivado', false)
      } else if (filtro === 'archivados') {
        query = query.eq('archivado', true)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    refetchInterval: 30000,
  })

  // Contadores para los tabs
  const { data: contadores = { no_leidos: 0, todos: 0, archivados: 0 } } = useQuery({
    queryKey: ['external-messages-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_messages')
        .select('leido, archivado')
        .is('deleted_at', null)
      if (error) return { no_leidos: 0, todos: 0, archivados: 0 }
      return {
        no_leidos: data.filter(m => !m.leido && !m.archivado).length,
        todos: data.filter(m => !m.archivado).length,
        archivados: data.filter(m => m.archivado).length,
      }
    },
    refetchInterval: 30000,
  })

  // Búsqueda local
  const mensajesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return mensajes
    const b = busqueda.toLowerCase()
    return mensajes.filter(m =>
      m.nombre_remitente?.toLowerCase().includes(b) ||
      m.asunto?.toLowerCase().includes(b) ||
      m.mensaje?.toLowerCase().includes(b) ||
      m.nombre_paciente?.toLowerCase().includes(b) ||
      m.email_remitente?.toLowerCase().includes(b)
    )
  }, [mensajes, busqueda])

  // ──────────────── MUTATIONS ────────────────
  const marcarLeido = useMutation({
    mutationFn: async (id) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('external_messages')
        .update({ leido: true, leido_at: new Date().toISOString(), leido_por: user?.id })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-messages'] })
      queryClient.invalidateQueries({ queryKey: ['external-messages-count'] })
      queryClient.invalidateQueries({ queryKey: ['external-messages-unread'] })
    },
  })

  const archivar = useMutation({
    mutationFn: async ({ id, archivar: val }) => {
      const { error } = await supabase
        .from('external_messages')
        .update({ archivado: val })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { archivar: val }) => {
      queryClient.invalidateQueries({ queryKey: ['external-messages'] })
      queryClient.invalidateQueries({ queryKey: ['external-messages-count'] })
      queryClient.invalidateQueries({ queryKey: ['external-messages-unread'] })
      showSuccess(val ? 'Mensaje archivado' : 'Mensaje restaurado')
    },
    onError: () => showError('Error al archivar el mensaje'),
  })

  const eliminar = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('external_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-messages'] })
      queryClient.invalidateQueries({ queryKey: ['external-messages-count'] })
      queryClient.invalidateQueries({ queryKey: ['external-messages-unread'] })
      showSuccess('Mensaje eliminado')
      if (mensajeAbierto) setMensajeAbierto(null)
    },
    onError: () => showError('Error al eliminar el mensaje'),
  })

  const guardarNotas = async (id) => {
    setGuardandoNotas(true)
    try {
      const { error } = await supabase
        .from('external_messages')
        .update({ notas_internas: notasEditando })
        .eq('id', id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['external-messages'] })
      showSuccess('Notas guardadas')
    } catch {
      showError('Error al guardar notas')
    } finally {
      setGuardandoNotas(false)
    }
  }

  const handleAbrirMensaje = (m) => {
    setMensajeAbierto(m)
    setNotasEditando(m.notas_internas || '')
    if (!m.leido) marcarLeido.mutate(m.id)
  }

  const urlContacto = `${window.location.origin}/contacto`

  // ──────────────── RENDER ────────────────
  return (
    <div className={STYLES.page}>
      {/* Header */}
      <div className={STYLES.header}>
        <div>
          <h2 className={isDark ? STYLES.titleDark : STYLES.titleLight}>
            Bandeja de Correos
          </h2>
          <p className={STYLES.subtitle}>Mensajes de médicos externos</p>
        </div>
        <button
          onClick={() => setShowLinkModal(true)}
          className={isDark ? STYLES.linkBtnDark : STYLES.linkBtnLight}
        >
          <Link2 className={STYLES.iconSm} />
          Ver enlace de contacto
        </button>
      </div>

      {/* Tabs */}
      <div className={isDark ? STYLES.tabsWrapDark : STYLES.tabsWrapLight}>
        {[
          { key: 'no_leidos', label: 'No leídos', count: contadores.no_leidos },
          { key: 'todos',     label: 'Todos',     count: contadores.todos },
          { key: 'archivados',label: 'Archivados',count: contadores.archivados },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFiltro(tab.key); setBusqueda('') }}
            className={filtro === tab.key ? STYLES.tabActive : isDark ? STYLES.tabInactiveDark : STYLES.tabInactiveLight}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={filtro === tab.key ? STYLES.tabBadgeActive : STYLES.tabBadgeInactive}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className={STYLES.searchWrap}>
        <Search className={STYLES.searchIcon} />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(sanitizeString(e.target.value))}
          placeholder="Buscar por nombre, asunto, paciente..."
          className={isDark ? STYLES.searchDark : STYLES.searchLight}
        />
      </div>

      {/* Lista de mensajes */}
      {isLoading ? (
        <div className={STYLES.skeletonWrap}>
          {[1,2,3].map(i => (
            <div key={i} className={isDark ? STYLES.skeletonDark : STYLES.skeletonLight} />
          ))}
        </div>
      ) : mensajesFiltrados.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={filtro === 'no_leidos' ? 'No hay mensajes sin leer' : 'No hay mensajes'}
          description={filtro === 'no_leidos' ? 'Todos los correos han sido revisados' : 'La bandeja está vacía'}
        />
      ) : (
        <div className={STYLES.list}>
          {mensajesFiltrados.map(m => {
            const urgCfg = URGENCIA_CONFIG[m.urgencia] || URGENCIA_CONFIG.normal
            const UrgIcon = urgCfg.icon
            const isExpanded = expandedId === m.id
            const cardClass = !m.leido
              ? (isDark ? STYLES.cardUnreadDark : STYLES.cardUnreadLight)
              : (isDark ? STYLES.cardReadDark   : STYLES.cardReadLight)

            return (
              <div key={m.id} className={cardClass}>
                {/* Fila principal */}
                <div
                  className={STYLES.cardRow}
                  onClick={() => {
                    handleAbrirMensaje(m)
                    setExpandedId(isExpanded ? null : m.id)
                  }}
                >
                  <div className={!m.leido ? STYLES.iconUnread : isDark ? STYLES.iconReadDark : STYLES.iconReadLight}>
                    {!m.leido ? <Mail className={STYLES.iconMd} /> : <MailOpen className={STYLES.iconMd} />}
                  </div>

                  <div className={STYLES.cardContent}>
                    <div className={STYLES.cardMeta}>
                      {m.fuente === 'gmail' ? (
                        <span className={isDark ? STYLES.sourceBadgeGmailDark : STYLES.sourceBadgeGmailLight}>Gmail</span>
                      ) : (
                        <span className={isDark ? STYLES.sourceBadgeFormDark : STYLES.sourceBadgeFormLight}>Formulario web</span>
                      )}
                      <span className={!m.leido ? (isDark ? STYLES.senderUnreadDark : STYLES.senderUnreadLight) : (isDark ? STYLES.senderReadDark : STYLES.senderReadLight)}>
                        {m.nombre_remitente}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${urgCfg.bg} ${urgCfg.text} ${urgCfg.border}`}>
                        <UrgIcon className={STYLES.iconUrgency} />
                        {urgCfg.label}
                      </span>
                      {!m.leido && <span className={STYLES.unreadDot} />}
                    </div>
                    <p className={isDark ? STYLES.subjectDark : STYLES.subjectLight}>{m.asunto}</p>
                    <p className={isDark ? STYLES.previewDark : STYLES.previewLight}>{m.mensaje}</p>
                  </div>

                  <div className={STYLES.cardRight}>
                    <span className={isDark ? STYLES.dateDark : STYLES.dateLight}>
                      {format(new Date(m.created_at), "d MMM", { locale: es })}
                    </span>
                    {isExpanded ? <ChevronUp className={STYLES.chevronIcon} /> : <ChevronDown className={STYLES.chevronIcon} />}
                  </div>
                </div>

                {/* Detalle expandido */}
                {isExpanded && (
                  <div className={isDark ? STYLES.detailDark : STYLES.detailLight}>
                    {/* Info remitente */}
                    <div className={isDark ? STYLES.infoGridDark : STYLES.infoGridLight}>
                      <div className={STYLES.infoRow}>
                        <User className={STYLES.infoIcon} />
                        <span className={isDark ? STYLES.infoTextDark : STYLES.infoTextLight}>
                          <span className={STYLES.boldLabel}>Dr. </span>{m.nombre_remitente}
                          {m.especialidad_remitente && ` · ${m.especialidad_remitente}`}
                        </span>
                      </div>
                      <div className={STYLES.infoRow}>
                        <Mail className={STYLES.infoIcon} />
                        <a href={`mailto:${m.email_remitente}`} className={STYLES.emailLink} onClick={e => e.stopPropagation()}>
                          {m.email_remitente}
                        </a>
                      </div>
                      {m.telefono_remitente && (
                        <div className={STYLES.infoRow}>
                          <Phone className={STYLES.infoIcon} />
                          <span className={isDark ? STYLES.infoTextDark : STYLES.infoTextLight}>{m.telefono_remitente}</span>
                        </div>
                      )}
                      {m.institucion_remitente && (
                        <div className={STYLES.infoRow}>
                          <Building2 className={STYLES.infoIcon} />
                          <span className={isDark ? STYLES.infoTextDark : STYLES.infoTextLight}>{m.institucion_remitente}</span>
                        </div>
                      )}
                    </div>

                    {/* Datos paciente */}
                    {(m.nombre_paciente || m.tipo_cirugia) && (
                      <div className={isDark ? STYLES.patientBoxDark : STYLES.patientBoxLight}>
                        <p className={isDark ? STYLES.patientLabelDark : STYLES.patientLabelLight}>Paciente</p>
                        {m.nombre_paciente && (
                          <p className={isDark ? STYLES.patientTextDark : STYLES.patientTextLight}>
                            Nombre: <span className={STYLES.boldText}>{m.nombre_paciente}</span>
                            {m.rut_paciente && ` · RUT: ${m.rut_paciente}`}
                          </p>
                        )}
                        {m.tipo_cirugia && (
                          <p className={`mt-1 ${isDark ? STYLES.infoTextDark : 'text-slate-600'}`}>
                            Cirugía: <span className={STYLES.boldText}>{m.tipo_cirugia}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Mensaje completo */}
                    <div>
                      <p className={STYLES.sectionLabel}>Mensaje</p>
                      <p className={isDark ? STYLES.msgTextDark : STYLES.msgTextLight}>{m.mensaje}</p>
                    </div>

                    {/* Notas internas */}
                    <div>
                      <p className={STYLES.sectionLabelRow}>
                        <StickyNote className={STYLES.iconXs} /> Notas internas (solo pabellón)
                      </p>
                      <textarea
                        value={mensajeAbierto?.id === m.id ? notasEditando : (m.notas_internas || '')}
                        onChange={e => { if (mensajeAbierto?.id === m.id) setNotasEditando(e.target.value) }}
                        onFocus={() => {
                          if (mensajeAbierto?.id !== m.id) {
                            setMensajeAbierto(m)
                            setNotasEditando(m.notas_internas || '')
                          }
                        }}
                        placeholder="Agregar notas de seguimiento, recordatorios, etc."
                        rows={3}
                        className={isDark ? STYLES.textareaDark : STYLES.textareaLight}
                        maxLength={1000}
                        onClick={e => e.stopPropagation()}
                      />
                      <div className={STYLES.notesFooter}>
                        <button
                          type="button"
                          disabled={guardandoNotas}
                          onClick={e => { e.stopPropagation(); guardarNotas(m.id) }}
                          className={STYLES.saveNotesBtn}
                        >
                          {guardandoNotas ? 'Guardando...' : 'Guardar notas'}
                        </button>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className={STYLES.actionsRow}>
                      <a
                        href={`mailto:${m.email_remitente}?subject=Re: ${encodeURIComponent(m.asunto)}`}
                        className={STYLES.replyBtn}
                        onClick={e => e.stopPropagation()}
                      >
                        <Mail className={STYLES.iconXs} /> Responder por email
                      </a>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); archivar.mutate({ id: m.id, archivar: !m.archivado }) }}
                        className={isDark ? STYLES.archiveBtnDark : STYLES.archiveBtnLight}
                      >
                        <Archive className={STYLES.iconXs} />
                        {m.archivado ? 'Restaurar' : 'Archivar'}
                      </button>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setPendingDeleteId(m.id) }}
                        className={STYLES.deleteBtn}
                      >
                        <Trash2 className={STYLES.iconXs} /> Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: enlace de contacto */}
      <Modal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} title="Enlace de contacto para médicos externos">
        <div className={STYLES.spaceY4}>
          <p className={isDark ? STYLES.modalTextDark : STYLES.modalText}>
            Comparte este enlace con médicos externos para que puedan enviar solicitudes de hora quirúrgica directamente al pabellón, sin necesidad de una cuenta en el sistema.
          </p>
          <div className={isDark ? STYLES.linkBoxDark : STYLES.linkBoxLight}>
            <code className={isDark ? STYLES.linkCodeDark : STYLES.linkCodeLight}>{urlContacto}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(urlContacto).then(() => showSuccess('Enlace copiado'))}
              className={STYLES.copyBtn}
            >
              Copiar
            </button>
          </div>
          <p className={isDark ? STYLES.modalHintDark : STYLES.modalHintLight}>
            Los mensajes recibidos aparecerán en esta bandeja marcados como "No leídos". Recibirás un indicador visual en el menú lateral.
          </p>
        </div>
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal isOpen={!!pendingDeleteId} onClose={() => setPendingDeleteId(null)} title="Eliminar mensaje">
        <div className={STYLES.spaceY6}>
          <p className={STYLES.deleteModalText}>¿Eliminar este mensaje? Esta acción no se puede deshacer.</p>
          <div className={STYLES.deleteModalFooter}>
            <button type="button" onClick={() => setPendingDeleteId(null)} className={STYLES.cancelBtn}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => { eliminar.mutate(pendingDeleteId); setExpandedId(null); setPendingDeleteId(null) }}
              className={STYLES.confirmDeleteBtn}
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
