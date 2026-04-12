import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle2, Trash2, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../../../config/supabase'
import Card from '../../../components/common/Card'
import { useNotifications } from '../../../hooks/useNotifications'
import { useTheme } from '../../../contexts/ThemeContext'
import { sanitizeString } from '../../../utils/sanitizeInput'
import { logger } from '../../../utils/logger'

/**
 * Muro de recordatorios del Dashboard de Pabellón.
 * Gestiona su propio estado y queries de Supabase.
 */
export default function DashboardReminders() {
  const { theme } = useTheme()
  const { showSuccess, showError } = useNotifications()
  const queryClient = useQueryClient()
  const isDark = theme === 'dark'
  const isDarkOrMedical = isDark || theme === 'medical'

  const [nuevoRecordatorio, setNuevoRecordatorio] = useState(() => {
    try {
      const guardado = localStorage.getItem('recordatorio-temporal')
      if (guardado) return JSON.parse(guardado)
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data
    },
  })

  const crearRecordatorio = useMutation({
    mutationFn: async (data) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')
      const { error } = await supabase.from('reminders').insert({
        user_id: user.id,
        titulo: data.titulo,
        contenido: data.contenido,
        tipo: 'aviso',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recordatorios-pabellon'])
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
      const { error } = await supabase.from('reminders').update({ visto: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recordatorios-pabellon'])
      showSuccess('Recordatorio marcado como realizado')
    },
    onError: () => showError('Error al marcar recordatorio'),
  })

  const eliminar = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('reminders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recordatorios-pabellon'])
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
    <Card
      className={`flex flex-col relative overflow-hidden border ${
        isDarkOrMedical ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'
      }`}
    >
      <h3 className={`font-black uppercase text-[9px] sm:text-[10px] mb-4 sm:mb-6 flex items-center gap-2 relative z-10 ${
        isDarkOrMedical ? 'text-blue-400' : 'text-blue-600'
      }`}>
        <MessageSquare size={12} className="sm:w-[14px] sm:h-[14px]" aria-hidden="true" />
        Muro de Recordatorios
      </h3>

      <div className="flex-1 space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar mb-4 sm:mb-6 relative z-10">
        {recordatorios.length === 0 ? (
          <p className={`text-center py-4 text-[10px] sm:text-xs font-bold uppercase ${
            isDarkOrMedical ? 'text-slate-400' : 'text-slate-500'
          }`} role="status">
            No hay recordatorios
          </p>
        ) : (
          recordatorios.map((rec) => (
            <div
              key={rec.id}
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
                rec.visto
                  ? (isDarkOrMedical ? 'bg-green-900/20 border-green-500/40' : 'bg-green-50 border-green-200')
                  : (isDarkOrMedical ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')
              }`}
            >
              <p className={`text-[10px] sm:text-xs font-medium mb-2 sm:mb-3 break-words ${
                isDarkOrMedical ? 'text-slate-100' : 'text-slate-800'
              } ${rec.visto ? 'line-through opacity-80' : ''}`}>
                "{rec.contenido}"
              </p>
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <div className={`flex-1 min-w-0 text-[8px] sm:text-[9px] font-black uppercase ${
                  isDarkOrMedical ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  <span className="truncate">{rec.titulo}</span>
                  <span className="ml-2 flex-shrink-0">{format(new Date(rec.created_at), 'dd/MM HH:mm')}</span>
                </div>
                <div className="flex items-center gap-1">
                  {!rec.visto && (
                    <button
                      type="button"
                      onClick={() => marcarVisto.mutate(rec.id)}
                      disabled={marcarVisto.isPending}
                      className="p-1.5 sm:p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all touch-manipulation disabled:opacity-50"
                      aria-label="Marcar como realizado"
                    >
                      <CheckCircle2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => eliminar.mutate(rec.id)}
                    disabled={eliminar.isPending}
                    className="p-1.5 sm:p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all touch-manipulation disabled:opacity-50"
                    aria-label="Eliminar recordatorio"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="relative z-10">
        <form onSubmit={handleCrear} className="space-y-2 sm:space-y-3">
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
            className={`w-full rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-[10px] sm:text-xs outline-none h-14 sm:h-16 resize-none font-bold touch-manipulation border ${
              isDarkOrMedical
                ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
            }`}
          />
          <div className="flex justify-between items-center">
            <span className="text-[8px] sm:text-[9px] font-black text-slate-500">
              {nuevoRecordatorio.contenido.length}/150
            </span>
            <button
              type="submit"
              disabled={!nuevoRecordatorio.contenido.trim()}
              aria-label="Crear recordatorio"
              className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all touch-manipulation active:scale-95"
            >
              <Plus size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </form>
      </div>
    </Card>
  )
}
