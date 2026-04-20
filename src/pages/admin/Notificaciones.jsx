import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell, Plus, Send, Trash2, RefreshCw, Users, Stethoscope,
  Building2, Globe, Info, AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react'
import { supabase } from '@/config/supabase'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const TIPO_CONFIG = {
  info:    { label: 'Información', icon: Info,           color: 'bg-blue-900/40 text-blue-400 border-blue-800',     bar: 'bg-blue-500' },
  warning: { label: 'Aviso',       icon: AlertTriangle,  color: 'bg-amber-900/40 text-amber-400 border-amber-800',  bar: 'bg-amber-500' },
  success: { label: 'Novedad',     icon: CheckCircle2,   color: 'bg-emerald-900/40 text-emerald-400 border-emerald-800', bar: 'bg-emerald-500' },
  error:   { label: 'Urgente',     icon: XCircle,        color: 'bg-red-900/40 text-red-400 border-red-800',        bar: 'bg-red-500' },
}

const DIRIGIDO_CONFIG = {
  todos:         { label: 'Todos',         icon: Globe },
  pabellon:      { label: 'Pabellón',      icon: Building2 },
  doctor:        { label: 'Médicos',       icon: Stethoscope },
  admin_clinica: { label: 'Admin Clínica', icon: Users },
}

const S = {
  page:         'space-y-8 max-w-5xl',
  header:       'flex items-center justify-between',
  title:        'text-2xl font-black text-white uppercase tracking-tighter',
  subtitle:     'text-slate-400 text-sm mt-1',
  grid:         'grid lg:grid-cols-[1fr_1.4fr] gap-8',
  card:         'bg-slate-800 border border-slate-700 rounded-2xl',
  cardHeader:   'px-6 py-4 border-b border-slate-700 flex items-center gap-3',
  cardTitle:    'font-black text-white text-sm uppercase tracking-tight',
  cardBody:     'p-6 space-y-4',
  label:        'block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5',
  input:        'w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-600 focus:border-blue-500 focus:outline-none',
  textarea:     'w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-600 focus:border-blue-500 focus:outline-none resize-none',
  selectRow:    'grid grid-cols-2 gap-3',
  select:       'w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none',
  sendBtn:      'w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-colors',
  listEmpty:    'p-8 text-center text-slate-500 text-sm',
  notifList:    'divide-y divide-slate-700/50',
  notifRow:     'flex items-start gap-4 px-6 py-4',
  notifBar:     'w-1 rounded-full shrink-0 self-stretch',
  notifBody:    'flex-1 min-w-0',
  notifTitle:   'text-white font-bold text-sm',
  notifMsg:     'text-slate-400 text-xs mt-0.5 leading-relaxed',
  notifMeta:    'flex items-center gap-3 mt-2',
  badge:        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border',
  time:         'text-slate-600 text-xs',
  deleteBtn:    'p-1.5 ml-auto shrink-0 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors',
  toast:        'fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg border z-50',
  toastOk:      'bg-emerald-900/90 border-emerald-700 text-emerald-300',
  toastErr:     'bg-red-900/90 border-red-700 text-red-300',
}

const INITIAL_FORM = { titulo: '', mensaje: '', tipo: 'info', dirigido_a: 'todos', expires_at: '' }

export default function Notificaciones() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(INITIAL_FORM)
  const [toast, setToast] = useState(null)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const { data: notifs = [], isPending, isError, refetch } = useQuery({
    queryKey: ['broadcast-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_broadcast_admin')
      if (error) throw error
      return data ?? []
    },
    retry: 1,
  })

  const enviar = useMutation({
    mutationFn: async (f) => {
      const { error } = await supabase.rpc('admin_send_broadcast', {
        p_titulo:     f.titulo.trim(),
        p_mensaje:    f.mensaje.trim(),
        p_tipo:       f.tipo,
        p_dirigido_a: f.dirigido_a,
        p_expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-admin'] })
      setForm(INITIAL_FORM)
      showToast('Notificación enviada a todas las clínicas')
    },
    onError: () => showToast('Error al enviar la notificación', false),
  })

  const desactivar = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.rpc('admin_desactivar_broadcast', { p_id: id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-admin'] })
      showToast('Notificación desactivada')
    },
  })

  const canSend = form.titulo.trim().length > 3 && form.mensaje.trim().length > 5

  return (
    <div className={S.page}>
      <div className={S.header}>
        <div>
          <h1 className={S.title}>Notificaciones</h1>
          <p className={S.subtitle}>Envía avisos a todas las clínicas de la plataforma</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-xl transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>

      <div className={S.grid}>
        {/* Formulario */}
        <div className={S.card}>
          <div className={S.cardHeader}>
            <Plus className="w-4 h-4 text-blue-400" />
            <p className={S.cardTitle}>Nueva notificación</p>
          </div>
          <div className={S.cardBody}>
            <div>
              <label className={S.label}>Título</label>
              <input
                className={S.input}
                placeholder="Ej: Mantenimiento programado"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              />
            </div>
            <div>
              <label className={S.label}>Mensaje</label>
              <textarea
                className={S.textarea}
                rows={4}
                placeholder="Escribe el mensaje que verán los usuarios al iniciar sesión…"
                value={form.mensaje}
                onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
              />
            </div>
            <div className={S.selectRow}>
              <div>
                <label className={S.label}>Tipo</label>
                <select className={S.select} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={S.label}>Dirigido a</label>
                <select className={S.select} value={form.dirigido_a} onChange={e => setForm(f => ({ ...f, dirigido_a: e.target.value }))}>
                  {Object.entries(DIRIGIDO_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={S.label}>Expira el (opcional)</label>
              <input
                type="datetime-local"
                className={S.input}
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              />
            </div>
            <button
              onClick={() => enviar.mutate(form)}
              disabled={!canSend || enviar.isPending}
              className={S.sendBtn}
            >
              <Send className="w-4 h-4" />
              {enviar.isPending ? 'Enviando…' : 'Enviar notificación'}
            </button>
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className={S.card}>
          <div className={S.cardHeader}>
            <Bell className="w-4 h-4 text-slate-400" />
            <p className={S.cardTitle}>Historial ({notifs.length})</p>
          </div>

          {isPending ? (
            <div className={S.listEmpty}>Cargando…</div>
          ) : isError ? (
            <div className={S.listEmpty}>
              Error al cargar. <button onClick={() => refetch()} className="underline text-blue-400">Reintentar</button>
            </div>
          ) : notifs.length === 0 ? (
            <div className={S.listEmpty}>No hay notificaciones enviadas.</div>
          ) : (
            <ul className={S.notifList}>
              {notifs.map(n => {
                const tc = TIPO_CONFIG[n.tipo] ?? TIPO_CONFIG.info
                const dc = DIRIGIDO_CONFIG[n.dirigido_a] ?? DIRIGIDO_CONFIG.todos
                const DIcon = dc.icon
                return (
                  <li key={n.id} className={`${S.notifRow} ${!n.activo ? 'opacity-40' : ''}`}>
                    <div className={`${S.notifBar} ${tc.bar}`} />
                    <div className={S.notifBody}>
                      <p className={S.notifTitle}>{n.titulo}</p>
                      <p className={S.notifMsg}>{n.mensaje}</p>
                      <div className={S.notifMeta}>
                        <span className={`${S.badge} ${tc.color}`}>{tc.label}</span>
                        <span className={`${S.badge} bg-slate-700 text-slate-300 border-slate-600`}>
                          <DIcon className="w-3 h-3" />
                          {dc.label}
                        </span>
                        <span className={S.time}>
                          {formatDistanceToNow(new Date(n.created_at), { locale: es, addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    {n.activo && (
                      <button
                        onClick={() => desactivar.mutate(n.id)}
                        className={S.deleteBtn}
                        title="Desactivar notificación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {toast && (
        <div className={`${S.toast} ${toast.ok ? S.toastOk : S.toastErr}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
