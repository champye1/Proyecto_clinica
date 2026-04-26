import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, Search, ShieldCheck, Stethoscope, Building2,
  UserX, RefreshCw, KeyRound, LogOut, CheckCircle2, XCircle, UserCheck, Download,
} from 'lucide-react'
import { getAllUsers, deactivateUser, reactivateUser, forceLogoutUser, sendPasswordReset } from '@/services/adminService'
import { sanitizeString } from '@/utils/sanitizeInput'
import { useDebounce } from '@/hooks/useDebounce'
import { exportToCsv } from '@/utils/exportCsv'

const ROLE_CONFIG = {
  doctor:        { label: 'Doctor',        icon: Stethoscope, bg: 'bg-blue-500/15',    text: 'text-blue-300',    dot: 'bg-blue-400',    avatar: 'from-blue-600 to-blue-800' },
  pabellon:      { label: 'Pabellón',      icon: Building2,   bg: 'bg-violet-500/15',  text: 'text-violet-300',  dot: 'bg-violet-400',  avatar: 'from-violet-600 to-violet-800' },
  admin_clinica: { label: 'Admin',         icon: ShieldCheck, bg: 'bg-emerald-500/15', text: 'text-emerald-300', dot: 'bg-emerald-400', avatar: 'from-emerald-600 to-emerald-800' },
  super_admin:   { label: 'Super Admin',   icon: ShieldCheck, bg: 'bg-amber-500/15',   text: 'text-amber-300',   dot: 'bg-amber-400',   avatar: 'from-amber-500 to-orange-700' },
}

const FILTERS = ['todos', 'doctor', 'pabellon', 'admin_clinica']

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-2xl p-5 border ${color} flex flex-col gap-1`}>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  )
}

export default function GestionUsuarios() {
  const queryClient   = useQueryClient()
  const [busqueda, setBusqueda]     = useState('')
  const [filtroRol, setFiltroRol]   = useState('todos')
  const [toast, setToast]           = useState(null)
  const debouncedBusqueda           = useDebounce(busqueda, 300)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const { data: usuarios = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-usuarios'],
    queryFn: async () => {
      const { data, error } = await getAllUsers()
      if (error) throw error
      return data ?? []
    },
  })

  const desactivar = useMutation({
    mutationFn: async (userId) => {
      const { error } = await deactivateUser(userId)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] }); showToast('Usuario desactivado') },
    onError:   () => showToast('Error al desactivar', false),
  })

  const resetPw = useMutation({
    mutationFn: async (email) => {
      const { error } = await sendPasswordReset(email, `${window.location.origin}/restablecer-contrasena`)
      if (error) throw error
    },
    onSuccess: () => showToast('Email de recuperación enviado ✓'),
    onError:   () => showToast('Error al enviar email', false),
  })

  const forceLogout = useMutation({
    mutationFn: async (userId) => {
      const { error } = await forceLogoutUser(userId)
      if (error) throw error
    },
    onSuccess: () => showToast('Sesión cerrada forzadamente'),
    onError:   () => showToast('Error al cerrar sesión', false),
  })

  const reactivar = useMutation({
    mutationFn: async (userId) => {
      const { error } = await reactivateUser(userId)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] }); showToast('Usuario reactivado') },
    onError:   () => showToast('Error al reactivar', false),
  })

  const handleExportCsv = () => {
    exportToCsv(
      usuariosFiltrados.map(u => ({
        Nombre:   u.nombre ?? '',
        Email:    u.email,
        Rol:      ROLE_CONFIG[u.rol]?.label ?? u.rol,
        Clínica:  u.clinica_nombre ?? '',
        Estado:   u.activo !== false ? 'Activo' : 'Inactivo',
      })),
      'usuarios'
    )
  }

  const usuariosFiltrados = usuarios.filter(u => {
    if (filtroRol !== 'todos' && u.rol !== filtroRol) return false
    if (debouncedBusqueda.trim()) {
      const q = debouncedBusqueda.toLowerCase()
      return u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.clinica_nombre?.toLowerCase().includes(q)
    }
    return true
  })

  const counts = {
    total:  usuarios.length,
    doctor: usuarios.filter(u => u.rol === 'doctor').length,
    pabellon: usuarios.filter(u => u.rol === 'pabellon').length,
    admin_clinica: usuarios.filter(u => u.rol === 'admin_clinica').length,
  }

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Gestión de Usuarios</h1>
          <p className="text-slate-500 text-sm mt-1">Todos los accesos registrados en SurgicalHUB</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={usuariosFiltrados.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total usuarios"  value={counts.total}         color="bg-white/3 border-white/8" />
        <StatCard label="Doctores"        value={counts.doctor}        color="bg-blue-950/40 border-blue-800/30" />
        <StatCard label="Pabellón"        value={counts.pabellon}      color="bg-violet-950/40 border-violet-800/30" />
        <StatCard label="Admins"          value={counts.admin_clinica} color="bg-emerald-950/40 border-emerald-800/30" />
      </div>

      {/* Buscador + filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(sanitizeString(e.target.value))}
            placeholder="Buscar por nombre, email o clínica…"
            className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-11 pr-4 py-3 text-sm placeholder-slate-600 focus:border-blue-500/50 focus:bg-white/8 focus:outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(r => {
            const active = filtroRol === r
            const cfg = ROLE_CONFIG[r]
            return (
              <button
                key={r}
                onClick={() => setFiltroRol(r)}
                className={`
                  flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border
                  ${active
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}
                `}
              >
                {r === 'todos' ? 'Todos' : cfg?.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white/3 border border-white/8 rounded-3xl overflow-hidden">

        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-white/5 grid grid-cols-[2fr_1fr_1.5fr_1fr_auto] gap-4">
          {['Usuario', 'Rol', 'Clínica', 'Estado', ''].map((h, i) => (
            <span key={i} className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No se encontraron usuarios</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {usuariosFiltrados.map(u => {
              const cfg     = ROLE_CONFIG[u.rol] ?? ROLE_CONFIG.doctor
              const Icon    = cfg.icon
              const activo  = u.activo !== false
              const initials= (u.nombre ?? u.email ?? '?').slice(0, 2).toUpperCase()

              return (
                <li
                  key={u.user_id}
                  className="grid grid-cols-[2fr_1fr_1.5fr_1fr_auto] px-6 py-4 gap-4 items-center hover:bg-white/3 transition-colors group"
                >
                  {/* Usuario */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.avatar} flex items-center justify-center shrink-0 text-xs font-black text-white shadow-sm`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{u.nombre ?? '—'}</p>
                      <p className="text-slate-500 text-xs truncate">{u.email}</p>
                    </div>
                  </div>

                  {/* Rol */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Clínica */}
                  <p className="text-slate-400 text-xs font-medium truncate">{u.clinica_nombre ?? '—'}</p>

                  {/* Estado */}
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${activo ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span className={`text-xs font-semibold ${activo ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => resetPw.mutate(u.email)}
                      disabled={resetPw.isPending}
                      title="Enviar reset de contraseña"
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-400 hover:bg-blue-950/50 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => forceLogout.mutate(u.user_id)}
                      disabled={forceLogout.isPending}
                      title="Forzar cierre de sesión"
                      className="p-2 rounded-xl text-slate-500 hover:text-amber-400 hover:bg-amber-950/50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                    {activo && u.rol !== 'super_admin' && (
                      <button
                        onClick={() => desactivar.mutate(u.user_id)}
                        disabled={desactivar.isPending}
                        title="Desactivar usuario"
                        className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/50 transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!activo && (
                      <button
                        onClick={() => reactivar.mutate(u.user_id)}
                        disabled={reactivar.isPending}
                        title="Reactivar usuario"
                        className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/50 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Footer */}
        {usuariosFiltrados.length > 0 && (
          <div className="px-6 py-3 border-t border-white/5">
            <p className="text-xs text-slate-600">{usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''} mostrados</p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`
          fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold
          shadow-2xl border backdrop-blur-sm
          ${toast.ok
            ? 'bg-emerald-950/95 border-emerald-700/50 text-emerald-300'
            : 'bg-red-950/95 border-red-700/50 text-red-300'}
        `}>
          {toast.ok
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <XCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
