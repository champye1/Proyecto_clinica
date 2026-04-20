import { useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import {
  Stethoscope, LayoutDashboard, LogOut, Menu, X,
  PlusCircle, Users, ScrollText, Bell, ChevronRight, DollarSign,
} from 'lucide-react'
import { supabase } from '@/config/supabase'
import SuperAdmin from '@/pages/admin/SuperAdmin'

const CrearClinica    = lazy(() => import('../pages/admin/CrearClinica'))
const GestionUsuarios = lazy(() => import('../pages/admin/GestionUsuarios'))
const AuditLog        = lazy(() => import('../pages/admin/AuditLog'))
const Notificaciones  = lazy(() => import('../pages/admin/Notificaciones'))
const ClinicaVista    = lazy(() => import('../pages/admin/ClinicaVista'))
const Financiero      = lazy(() => import('../pages/admin/Financiero'))

const menuItems = [
  { path: '/admin',                icon: LayoutDashboard, label: 'Panel Global',    desc: 'Vista general' },
  { path: '/admin/financiero',     icon: DollarSign,      label: 'Financiero',      desc: 'MRR · Ingresos' },
  { path: '/admin/clinicas',       icon: PlusCircle,      label: 'Crear Clínica',   desc: 'Registrar nueva' },
  { path: '/admin/usuarios',       icon: Users,           label: 'Usuarios',        desc: 'Gestión de accesos' },
  { path: '/admin/notificaciones', icon: Bell,            label: 'Notificaciones',  desc: 'Broadcast' },
  { path: '/admin/auditoria',      icon: ScrollText,      label: 'Auditoría',       desc: 'Registro de acciones' },
]

export default function AdminLayout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const { clearAllAppData } = await import('../utils/storageCleaner')
    clearAllAppData()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isActive = (path) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path)

  return (
    <div className="min-h-screen flex bg-[#0a0f1e] text-white font-sans antialiased">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static left-0 top-0 h-full w-72 z-50 flex flex-col
        bg-gradient-to-b from-[#0d1424] to-[#0a0f1e]
        border-r border-white/5
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/50">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0d1424]" />
            </div>
            <div>
              <p className="font-black text-sm text-white tracking-tight">SurgicalHUB</p>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => {
            const Icon   = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
                  ${active
                    ? 'bg-gradient-to-r from-blue-600/30 to-blue-500/10 border border-blue-500/30 shadow-sm'
                    : 'hover:bg-white/5 border border-transparent'}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors
                  ${active ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'bg-white/5 group-hover:bg-white/10'}
                `}>
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                    {item.label}
                  </p>
                  <p className={`text-[10px] truncate ${active ? 'text-blue-300' : 'text-slate-600'}`}>
                    {item.desc}
                  </p>
                </div>
                {active && <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/30 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-red-900/30 flex items-center justify-center transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#0d1424] border-b border-white/5">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <p className="font-black text-sm uppercase tracking-tight">Super Admin</p>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Routes>
              <Route path="/"               element={<SuperAdmin />} />
              <Route path="/financiero"     element={<Financiero />} />
              <Route path="/clinicas"       element={<CrearClinica />} />
              <Route path="/usuarios"       element={<GestionUsuarios />} />
              <Route path="/notificaciones" element={<Notificaciones />} />
              <Route path="/auditoria"      element={<AuditLog />} />
              <Route path="/clinica/:id"    element={<ClinicaVista />} />
              <Route path="*"              element={<Navigate to="/admin" />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
