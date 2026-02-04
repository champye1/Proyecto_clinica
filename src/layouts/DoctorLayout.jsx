import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../config/supabase'
import { 
  LayoutDashboard, 
  UserPlus, 
  FileText, 
  Calendar, 
  LayoutGrid,
  Bell,
  LogOut,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import Dashboard from '../pages/doctor/Dashboard'
import CrearPaciente from '../pages/doctor/CrearPaciente'
import Solicitudes from '../pages/doctor/Solicitudes'
import Calendario from '../pages/doctor/Calendario'
import HorariosDisponibles from '../pages/doctor/HorariosDisponibles'
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications'
import { useUnreadNotifications } from '../hooks/useUnreadNotifications'
import { useNotificationsList } from '../hooks/useNotificationsList'

const menuItems = [
  { path: '/doctor', icon: LayoutDashboard, label: 'Panel Principal' },
  { path: '/doctor/paciente', icon: UserPlus, label: 'Crear Paciente' },
  { path: '/doctor/solicitudes', icon: FileText, label: 'Mis Solicitudes' },
  { path: '/doctor/horarios', icon: LayoutGrid, label: 'Horarios pabellones' },
  { path: '/doctor/calendario', icon: Calendar, label: 'Mi Calendario' },
]

export default function DoctorLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, changeTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const notificationsDropdownRef = useRef(null)
  const [userId, setUserId] = useState(null)
  const isDark = theme === 'dark'

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target)) {
        setShowNotificationsDropdown(false)
      }
    }
    if (showNotificationsDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotificationsDropdown])

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
  const { notifications, markAsRead, markAllAsRead } = useNotificationsList(userId, { enabled: showNotificationsDropdown })

  const handleLogout = async () => {
    // Limpiar todos los datos almacenados antes de cerrar sesión
    const { clearAllAppData } = await import('../utils/storageCleaner')
    clearAllAppData()
    
    await supabase.auth.signOut()
    // Usar window.location para forzar recarga completa y limpiar estado
    window.location.href = '/'
  }

  const cycleTheme = () => {
    if (theme === 'medical') changeTheme('light')
    else changeTheme(theme === 'light' ? 'dark' : 'light')
  }

  const handleNotificationClick = (n) => {
    if (!n.vista) markAsRead.mutate(n.id)
    setShowNotificationsDropdown(false)
    if (n.tipo === 'operacion_programada' || n.tipo === 'operacion_reagendada') {
      navigate('/doctor/calendario')
    } else if (n.tipo === 'solicitud_aceptada' || n.tipo === 'solicitud_rechazada') {
      navigate('/doctor/solicitudes')
    }
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex fixed left-0 top-0 h-full w-64 shadow-lg flex-col z-50 transition-colors ${
        isDark ? 'bg-slate-800 border-r border-slate-700' : 'bg-white border-r border-slate-200'
      }`}>
        <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Doctor</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Panel Médico</p>
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
                    ? isDark ? 'bg-slate-700 text-white font-medium' : 'bg-blue-50 text-blue-700 font-medium'
                    : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className={`mt-auto p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
              isDark ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 shadow-lg flex flex-col z-50 transition-transform duration-300 ease-in-out lg:hidden ${
        isDark ? 'bg-slate-800 border-r border-slate-700' : 'bg-white border-r border-slate-200'
      } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Doctor</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Panel Médico</p>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
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
                    ? isDark ? 'bg-slate-700 text-white font-medium' : 'bg-blue-50 text-blue-700 font-medium'
                    : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className={`mt-auto p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
              isDark ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`lg:ml-64 min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        {/* Barra superior escritorio: botón Cambiar estilo siempre visible */}
        <div className={`hidden lg:flex items-center justify-end gap-3 px-6 py-3 border-b sticky top-0 z-30 ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Estilo:</span>
          <button
            type="button"
            onClick={cycleTheme}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm ${
              isDark
                ? 'bg-slate-700 text-slate-100 hover:bg-slate-600 border border-slate-600'
                : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
            }`}
            title="Cambiar tema (Claro / Oscuro)"
          >
            {theme === 'light' && <Sun className="w-4 h-4" />}
            {theme === 'dark' && <Moon className="w-4 h-4" />}
            <span>{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
          </button>
        </div>

        {/* Mobile Header */}
        <header className={`lg:hidden border-b sticky top-0 z-30 px-4 py-3 flex items-center justify-between ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`p-2 rounded-lg touch-manipulation ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-center flex-1">
            <h2 className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Doctor</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Panel Médico</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleTheme}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Cambiar tema (Claro / Oscuro)"
              aria-label="Cambiar tema"
            >
              {theme === 'light' && <Sun className="w-5 h-5" />}
              {theme === 'dark' && <Moon className="w-5 h-5" />}
            </button>
            <div className="relative" ref={notificationsDropdownRef}>
              <button
                type="button"
                onClick={() => setShowNotificationsDropdown((v) => !v)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all relative ${
                  isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="Notificaciones"
                aria-label="Notificaciones"
                aria-expanded={showNotificationsDropdown}
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotificationsDropdown && (
                <div className={`absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-2xl border shadow-xl z-50 flex flex-col ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <h3 className={`font-bold text-sm uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Notificaciones
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllAsRead.mutate()}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <p className={`px-4 py-6 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        No hay notificaciones
                      </p>
                    ) : (
                      <ul className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
                        {notifications.map((n) => (
                          <li
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(n) }}
                            className={`px-4 py-3 cursor-pointer transition-colors ${
                              n.vista
                                ? isDark ? 'bg-slate-800/50 hover:bg-slate-700/50' : 'hover:bg-slate-50'
                                : isDark ? 'bg-blue-900/20 hover:bg-slate-700/50' : 'bg-blue-50/50 hover:bg-slate-50'
                            }`}
                          >
                            <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{n.titulo}</p>
                            <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{n.mensaje}</p>
                            <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {format(new Date(n.created_at), 'd MMM yyyy, HH:mm', { locale: es })}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/paciente" element={<CrearPaciente />} />
            <Route path="/solicitudes" element={<Solicitudes />} />
            <Route path="/horarios" element={<HorariosDisponibles />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="*" element={<Navigate to="/doctor" />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
