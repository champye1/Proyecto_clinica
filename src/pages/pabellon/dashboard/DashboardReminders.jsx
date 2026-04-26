import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle2, Trash2, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { fetchReminders, createReminder, markReminderRead, deleteReminder } from '@/services/reminderService'
import Card from '@/components/common/Card'
import { useNotifications } from '@/hooks/useNotifications'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'
import { sanitizeString, safeParseJSON } from '@/utils/sanitizeInput'
import { logger } from '@/utils/logger'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  cardDark:         'flex flex-col relative overflow-hidden border bg-slate-900 text-white border-slate-800',
  cardLight:        'flex flex-col relative overflow-hidden border bg-white text-slate-900 border-slate-200',
  titleDark:        'font-black uppercase text-[9px] sm:text-[10px] mb-4 sm:mb-6 flex items-center gap-2 relative z-10 text-blue-400',
  titleLight:       'font-black uppercase text-[9px] sm:text-[10px] mb-4 sm:mb-6 flex items-center gap-2 relative z-10 text-blue-600',
  list:             'flex-1 space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar mb-4 sm:mb-6 relative z-10',
  emptyDark:        'text-center py-4 text-[10px] sm:text-xs font-bold uppercase text-slate-400',
  emptyLight:       'text-center py-4 text-[10px] sm:text-xs font-bold uppercase text-slate-500',
  recCardBase:      'p-3 sm:p-4 rounded-xl sm:rounded-2xl border',
  recDoneLight:     'bg-green-50 border-green-200',
  recDoneDark:      'bg-green-900/20 border-green-500/40',
  recPendingLight:  'bg-slate-50 border-slate-200',
  recPendingDark:   'bg-white/5 border-white/10',
  recTextDark:      'text-[10px] sm:text-xs font-medium mb-2 sm:mb-3 break-words text-slate-100',
  recTextLight:     'text-[10px] sm:text-xs font-medium mb-2 sm:mb-3 break-words text-slate-800',
  recFooter:        'flex justify-between items-center gap-2 flex-wrap',
  recMetaDark:      'flex-1 min-w-0 text-[8px] sm:text-[9px] font-black uppercase text-blue-400',
  recMetaLight:     'flex-1 min-w-0 text-[8px] sm:text-[9px] font-black uppercase text-blue-600',
  recActions:       'flex items-center gap-1',
  doneBtn:          'p-1.5 sm:p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all touch-manipulation disabled:opacity-50',
  deleteBtn:        'p-1.5 sm:p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all touch-manipulation disabled:opacity-50',
  formWrap:         'relative z-10',
  form:             'space-y-2 sm:space-y-3',
  textareaDark:     'w-full rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-[10px] sm:text-xs outline-none h-14 sm:h-16 resize-none font-bold touch-manipulation border bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500',
  textareaLight:    'w-full rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-[10px] sm:text-xs outline-none h-14 sm:h-16 resize-none font-bold touch-manipulation border bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white',
  charCount:        'text-[8px] sm:text-[9px] font-black text-slate-500',
  submitBtn:        'bg-blue-600 text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all touch-manipulation active:scale-95',
  formFooter:       'flex justify-between items-center',
  recMetaInner:     'truncate',
  recMetaTime:      'ml-2 flex-shrink-0',
  msgIcon:          'sm:w-[14px] sm:h-[14px]',
  checkIcon:        'sm:w-4 sm:h-4',
  trashIcon:        'sm:w-4 sm:h-4',
  plusIcon:         'sm:w-4 sm:h-4',
}

/**
 * Muro de recordatorios del Dashboard de Pabellón.
 * Gestiona su propio estado y queries de Supabase.
 */
export default function DashboardReminders() {
  const { theme } = useTheme()
  const { showSuccess, showError } = useNotifications()
  const queryClient = useQueryClient()
  const t = tc(theme)
  const isDark = theme === 'dark'
  const isDarkOrMedical = theme !== 'light'

  const [nuevoRecordatorio, setNuevoRecordatorio] = useState(() => {
    try {
      const guardado = localStorage.getItem('recordatorio-temporal')
      if (guardado) return safeParseJSON(guardado) ?? { titulo: '', contenido: '' }
    } catch (e) {
      logger.errorWithContext('Error al cargar recordatorio temporal', e)
    }
    return { titulo: '', contenido: '' }
  })

  useEffect(() => {
    if (nuevoRecordatorio.contenido.trim()) {
      localStorage.setItem('recordatorio-temporal', JSON.stringify(nuevoRecordatorio))
    } else {
      localStorage.removeItem('recordatorio-temporal')
    }
  }, [nuevoRecordatorio])

  const { data: recordatorios = [] } = useQuery({
    queryKey: ['recordatorios-pabellon'],
    queryFn: async () => {
      const { data, error } = await fetchReminders({ limit: 10 })
      if (error) throw error
      return data
    },
  })

  const crearRecordatorio = useMutation({
    mutationFn: async (data) => {
      const { error } = await createReminder({ titulo: data.titulo, contenido: data.contenido, tipo: 'aviso' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordatorios-pabellon'] })
      setNuevoRecordatorio({ titulo: '', contenido: '' })
      localStorage.removeItem('recordatorio-temporal')
      showSuccess('Recordatorio creado exitosamente')
    },
    onError: (error) => {
      const msg = error.message || ''
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet.')
      } else {
        showError('Error al crear recordatorio: ' + msg)
      }
    },
  })

  const marcarVisto = useMutation({
    mutationFn: async (id) => {
      const { error } = await markReminderRead(id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordatorios-pabellon'] })
      showSuccess('Recordatorio marcado como realizado')
    },
    onError: () => showError('Error al marcar recordatorio'),
  })

  const eliminar = useMutation({
    mutationFn: async (id) => {
      const { error } = await deleteReminder(id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordatorios-pabellon'] })
      showSuccess('Recordatorio eliminado')
    },
    onError: () => showError('Error al eliminar recordatorio'),
  })

  const handleCrear = (e) => {
    e.preventDefault()
    if (nuevoRecordatorio.contenido.trim()) {
      crearRecordatorio.mutate({
        titulo: nuevoRecordatorio.contenido.substring(0, 50),
        contenido: nuevoRecordatorio.contenido,
      })
    }
  }

  return (
    <Card className={isDarkOrMedical ? STYLES.cardDark : STYLES.cardLight}>
      <h3 className={isDarkOrMedical ? STYLES.titleDark : STYLES.titleLight}>
        <MessageSquare size={12} className={STYLES.msgIcon} aria-hidden="true" />
        Muro de Recordatorios
      </h3>

      <div className={STYLES.list}>
        {recordatorios.length === 0 ? (
          <p className={isDarkOrMedical ? STYLES.emptyDark : STYLES.emptyLight} role="status">
            No hay recordatorios
          </p>
        ) : (
          recordatorios.map((rec) => {
            const recCardClass = rec.visto
              ? (isDarkOrMedical ? STYLES.recDoneDark : STYLES.recDoneLight)
              : (isDarkOrMedical ? STYLES.recPendingDark : STYLES.recPendingLight)
            return (
              <div key={rec.id} className={`${STYLES.recCardBase} ${recCardClass}`}>
                <p className={`${isDarkOrMedical ? STYLES.recTextDark : STYLES.recTextLight} ${rec.visto ? 'line-through opacity-80' : ''}`}>
                  "{rec.contenido}"
                </p>
                <div className={STYLES.recFooter}>
                  <div className={isDarkOrMedical ? STYLES.recMetaDark : STYLES.recMetaLight}>
                    <span className={STYLES.recMetaInner}>{rec.titulo}</span>
                    <span className={STYLES.recMetaTime}>{format(new Date(rec.created_at), 'dd/MM HH:mm')}</span>
                  </div>
                  <div className={STYLES.recActions}>
                    {!rec.visto && (
                      <button
                        type="button"
                        onClick={() => marcarVisto.mutate(rec.id)}
                        disabled={marcarVisto.isPending}
                        className={STYLES.doneBtn}
                        aria-label="Marcar como realizado"
                      >
                        <CheckCircle2 size={14} className={STYLES.checkIcon} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => eliminar.mutate(rec.id)}
                      disabled={eliminar.isPending}
                      className={STYLES.deleteBtn}
                      aria-label="Eliminar recordatorio"
                    >
                      <Trash2 size={14} className={STYLES.trashIcon} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className={STYLES.formWrap}>
        <form onSubmit={handleCrear} className={STYLES.form}>
          <textarea
            placeholder="Recordatorio..."
            value={nuevoRecordatorio.contenido}
            onChange={(e) => setNuevoRecordatorio({
              ...nuevoRecordatorio,
              contenido: sanitizeString(e.target.value, { maxLength: 150, trim: false }),
            })}
            maxLength={150}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (nuevoRecordatorio.contenido.trim()) handleCrear(e)
              }
            }}
            aria-label="Nuevo recordatorio"
            className={isDarkOrMedical ? STYLES.textareaDark : STYLES.textareaLight}
          />
          <div className={STYLES.formFooter}>
            <span className={STYLES.charCount}>{nuevoRecordatorio.contenido.length}/150</span>
            <button
              type="submit"
              disabled={!nuevoRecordatorio.contenido.trim()}
              aria-label="Crear recordatorio"
              className={STYLES.submitBtn}
            >
              <Plus size={14} className={STYLES.plusIcon} />
            </button>
          </div>
        </form>
      </div>
    </Card>
  )
}
