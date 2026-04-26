import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, Search, Link2 } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'
import { sanitizeString } from '@/utils/sanitizeInput'
import EmptyState from '@/components/common/EmptyState'
import Modal from '@/components/common/Modal'
import {
  fetchMessages, fetchMessageCounts,
  markAsRead, archiveMessage, saveNotes, deleteMessage,
} from '@/services/externalMessageService'
import CorreoCard from './correos/CorreoCard'

const S = {
  page:            'animate-in fade-in slide-in-from-right duration-500 max-w-5xl mx-auto px-4 sm:px-6 lg:px-0',
  header:          'mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4',
  titleDark:       'text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase mb-1 text-white',
  titleLight:      'text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900',
  subtitle:        'text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400',
  linkBtnDark:     'flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase transition-all border-slate-700 text-slate-300 hover:bg-slate-800',
  linkBtnLight:    'flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase transition-all border-slate-200 text-slate-600 hover:bg-slate-50',
  tabsWrapDark:    'flex gap-1 p-1 rounded-2xl mb-6 bg-slate-800',
  tabsWrapLight:   'flex gap-1 p-1 rounded-2xl mb-6 bg-slate-100',
  tabActive:       'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-blue-600 text-white shadow-md',
  tabInactiveDark: 'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-slate-400 hover:text-white',
  tabInactiveLight:'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-slate-500 hover:text-slate-800',
  tabBadgeActive:  'px-1.5 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white',
  tabBadgeInactive:'px-1.5 py-0.5 rounded-full text-[9px] font-black bg-slate-200 text-slate-600',
  searchWrap:      'relative mb-6',
  searchIcon:      'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400',
  searchDark:      'w-full pl-11 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium transition-all bg-slate-800 border-slate-700 text-white placeholder-slate-500',
  searchLight:     'w-full pl-11 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium transition-all bg-white border-slate-200 text-slate-700 placeholder-slate-400',
  skeletonDark:    'h-24 rounded-2xl animate-pulse bg-slate-800',
  skeletonLight:   'h-24 rounded-2xl animate-pulse bg-slate-100',
  modalText:       'text-sm text-slate-600',
  modalTextDark:   'text-sm text-slate-300',
  linkBoxDark:     'flex items-center gap-2 p-3 rounded-xl border bg-slate-800 border-slate-700',
  linkBoxLight:    'flex items-center gap-2 p-3 rounded-xl border bg-slate-50 border-slate-200',
  linkCodeDark:    'flex-1 text-xs break-all text-blue-300',
  linkCodeLight:   'flex-1 text-xs break-all text-blue-700',
  copyBtn:         'px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex-shrink-0',
  modalHintDark:   'text-xs text-slate-400',
  modalHintLight:  'text-xs text-slate-500',
  deleteFooter:    'flex gap-4 justify-end',
  cancelBtn:       'px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors',
  deleteBtn:       'px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors',
  iconSm:          'w-4 h-4',
}

export default function Correos() {
  const { theme } = useTheme()
  const t = tc(theme)
  const isDark = theme === 'dark'
  const { showSuccess, showError } = useNotifications()
  const queryClient = useQueryClient()

  const [filtro, setFiltro]               = useState('no_leidos')
  const [busqueda, setBusqueda]           = useState('')
  const [mensajeAbierto, setMensajeAbierto] = useState(null)
  const [notasEditando, setNotasEditando] = useState('')
  const [guardandoNotas, setGuardandoNotas] = useState(false)
  const [expandedId, setExpandedId]       = useState(null)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const { data: mensajes = [], isLoading } = useQuery({
    queryKey: ['external-messages', filtro],
    queryFn: () => fetchMessages(filtro).then(r => { if (r.error) throw r.error; return r.data }),
    refetchInterval: 30000,
  })

  const { data: contadores = { no_leidos: 0, todos: 0, archivados: 0 } } = useQuery({
    queryKey: ['external-messages-count'],
    queryFn: () => fetchMessageCounts().then(r => r.data),
    refetchInterval: 30000,
  })

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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['external-messages'] })
    queryClient.invalidateQueries({ queryKey: ['external-messages-count'] })
    queryClient.invalidateQueries({ queryKey: ['external-messages-unread'] })
  }

  const marcarLeido = useMutation({
    mutationFn: (id) => markAsRead(id).then(r => { if (r.error) throw r.error }),
    onSuccess: invalidateAll,
  })

  const archivar = useMutation({
    mutationFn: ({ id, archive }) => archiveMessage(id, archive).then(r => { if (r.error) throw r.error }),
    onSuccess: (_, { archive }) => { invalidateAll(); showSuccess(archive ? 'Mensaje archivado' : 'Mensaje restaurado') },
    onError: () => showError('Error al archivar el mensaje'),
  })

  const eliminar = useMutation({
    mutationFn: (id) => deleteMessage(id).then(r => { if (r.error) throw r.error }),
    onSuccess: () => { invalidateAll(); showSuccess('Mensaje eliminado'); if (mensajeAbierto) setMensajeAbierto(null) },
    onError: () => showError('Error al eliminar el mensaje'),
  })

  const handleGuardarNotas = async (id) => {
    setGuardandoNotas(true)
    try {
      const { error } = await saveNotes(id, notasEditando)
      if (error) throw error
      invalidateAll()
      showSuccess('Notas guardadas')
    } catch { showError('Error al guardar notas') }
    finally { setGuardandoNotas(false) }
  }

  const handleToggle = (m) => {
    const willExpand = expandedId !== m.id
    setExpandedId(willExpand ? m.id : null)
    if (willExpand) {
      setMensajeAbierto(m)
      setNotasEditando(m.notas_internas || '')
      if (!m.leido) marcarLeido.mutate(m.id)
    }
  }

  const urlContacto = `${window.location.origin}/contacto`

  return (
    <div className={S.page}>
      <div className={S.header}>
        <div>
          <h2 className={isDark ? S.titleDark : S.titleLight}>Bandeja de Correos</h2>
          <p className={S.subtitle}>Mensajes de médicos externos</p>
        </div>
        <button onClick={() => setShowLinkModal(true)} className={isDark ? S.linkBtnDark : S.linkBtnLight}>
          <Link2 className={S.iconSm} />
          Ver enlace de contacto
        </button>
      </div>

      <div className={isDark ? S.tabsWrapDark : S.tabsWrapLight}>
        {[
          { key: 'no_leidos', label: 'No leídos', count: contadores.no_leidos },
          { key: 'todos',     label: 'Todos',     count: contadores.todos },
          { key: 'archivados',label: 'Archivados',count: contadores.archivados },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFiltro(tab.key); setBusqueda('') }}
            className={filtro === tab.key ? S.tabActive : isDark ? S.tabInactiveDark : S.tabInactiveLight}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={filtro === tab.key ? S.tabBadgeActive : S.tabBadgeInactive}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={S.searchWrap}>
        <Search className={S.searchIcon} />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(sanitizeString(e.target.value))}
          placeholder="Buscar por nombre, asunto, paciente..."
          className={isDark ? S.searchDark : S.searchLight}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className={isDark ? S.skeletonDark : S.skeletonLight} />)}
        </div>
      ) : mensajesFiltrados.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={filtro === 'no_leidos' ? 'No hay mensajes sin leer' : 'No hay mensajes'}
          description={filtro === 'no_leidos' ? 'Todos los correos han sido revisados' : 'La bandeja está vacía'}
        />
      ) : (
        <div className="space-y-3">
          {mensajesFiltrados.map(m => (
            <CorreoCard
              key={m.id}
              m={m}
              isDark={isDark}
              isExpanded={expandedId === m.id}
              onToggle={() => handleToggle(m)}
              mensajeAbierto={mensajeAbierto}
              notasEditando={notasEditando}
              setNotasEditando={setNotasEditando}
              guardandoNotas={guardandoNotas}
              onGuardarNotas={handleGuardarNotas}
              onArchivar={(msg) => archivar.mutate({ id: msg.id, archive: !msg.archivado })}
              onDelete={(id) => setPendingDeleteId(id)}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} title="Enlace de contacto para médicos externos">
        <div className="space-y-4">
          <p className={isDark ? S.modalTextDark : S.modalText}>
            Comparte este enlace con médicos externos para que puedan enviar solicitudes de hora quirúrgica directamente al pabellón, sin necesidad de una cuenta en el sistema.
          </p>
          <div className={isDark ? S.linkBoxDark : S.linkBoxLight}>
            <code className={isDark ? S.linkCodeDark : S.linkCodeLight}>{urlContacto}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(urlContacto).then(() => showSuccess('Enlace copiado'))}
              className={S.copyBtn}
            >
              Copiar
            </button>
          </div>
          <p className={isDark ? S.modalHintDark : S.modalHintLight}>
            Los mensajes recibidos aparecerán en esta bandeja marcados como "No leídos". Recibirás un indicador visual en el menú lateral.
          </p>
        </div>
      </Modal>

      <Modal isOpen={!!pendingDeleteId} onClose={() => setPendingDeleteId(null)} title="Eliminar mensaje">
        <div className="space-y-6">
          <p className="text-slate-700">¿Eliminar este mensaje? Esta acción no se puede deshacer.</p>
          <div className={S.deleteFooter}>
            <button type="button" onClick={() => setPendingDeleteId(null)} className={S.cancelBtn}>Cancelar</button>
            <button
              type="button"
              onClick={() => { eliminar.mutate(pendingDeleteId); setExpandedId(null); setPendingDeleteId(null) }}
              className={S.deleteBtn}
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
