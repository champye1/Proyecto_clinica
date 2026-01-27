import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { 
  LayoutDashboard, 
  UserPlus, 
  FileText, 
  Calendar, 
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import Dashboard from '../pages/doctor/Dashboard'
import CrearPaciente from '../pages/doctor/CrearPaciente'
import Solicitudes from '../pages/doctor/Solicitudes'
import Calendario from '../pages/doctor/Calendario'
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications'
import { useUnreadNotifications } from '../hooks/useUnreadNotifications'

const menuItems = [
  { path: '/doctor', icon: LayoutDashboard, label: 'Panel Principal' },
  { path: '/doctor/paciente', icon: UserPlus, label: 'Crear Paciente' },
  { path: '/doctor/solicitudes', icon: FileText, label: 'Mis Solicitudes' },
  { path: '/doctor/calendario', icon: Calendar, label: 'Mi Calendario' },
]

export default function DoctorLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Activar notificaciones en tiempo real
  useRealtimeNotifications(userId)
  
  // Obtener contador de notificaciones no leídas
  const { count: unreadCount } = useUnreadNotifications(userId)

  const handleLogout = async () => {
    // Limpiar todos los datos almacenados antes de cerrar sesión
    const { clearAllAppData } = await import('../utils/storageCleaner')
    clearAllAppData()
    
    await supabase.auth.signOut()
    // Usar window.location para forzar recarga completa y limpiar estado
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white shadow-lg flex-col z-50">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-primary-600">Doctor</h2>
          <p className="text-sm text-gray-600">Panel Médico</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg flex flex-col z-50 transition-transform duration-300 ease-in-out lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary-600">Doctor</h2>
            <p className="text-sm text-gray-600">Panel Médico</p>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 touch-manipulation"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-center flex-1">
            <h2 className="text-lg font-bold text-primary-600">Doctor</h2>
            <p className="text-xs text-gray-600">Panel Médico</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Notificaciones */}
            <div className="relative">
              <button
                className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all relative"
                title="Notificaciones"
                aria-label="Notificaciones"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/paciente" element={<CrearPaciente />} />
            <Route path="/solicitudes" element={<Solicitudes />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="*" element={<Navigate to="/doctor" />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
