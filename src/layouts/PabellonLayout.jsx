import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/config/supabase'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import { useClinicaInfo, useTrialStatus } from '@/hooks/useClinicaInfo'
import {
  FileText, Calendar, Clock, Users, Package, LogOut, Home,
  PanelLeftClose, PanelLeftOpen, Settings, Menu, X, FileSearch,
  Bell, Stethoscope, Sun, Moon, Activity, Mail, AlertTriangle,
  LayoutGrid, UserCog, BarChart2, Plug2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
const Dashboard     = lazy(() => import('@/pages/pabellon/dashboard'))
const Solicitudes   = lazy(() => import('@/pages/pabellon/solicitudes'))
const Calendario    = lazy(() => import('@/pages/pabellon/calendario'))
const BloqueoHorario = lazy(() => import('@/pages/pabellon/BloqueoHorario'))
const Medicos       = lazy(() => import('@/pages/pabellon/Medicos'))
const Equipo        = lazy(() => import('@/pages/pabellon/Equipo'))
const Insumos       = lazy(() => import('@/pages/pabellon/Insumos'))
const Auditoria     = lazy(() => import('@/pages/pabellon/Auditoria'))
const Correos       = lazy(() => import('@/pages/pabellon/Correos'))
const Configuracion = lazy(() => import('@/pages/pabellon/Configuracion'))
const Facturacion   = lazy(() => import('@/pages/pabellon/Facturacion'))
const Reportes        = lazy(() => import('@/pages/pabellon/Reportes'))
const Integraciones   = lazy(() => import('@/pages/pabellon/integraciones'))
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { useNotificationsList } from '@/hooks/useNotificationsList'
import { fetchMessageCounts } from '@/services/externalMessageService'
import { useTheme } from '@/contexts/ThemeContext'
import Modal from '@/components/common/Modal'

// ─── Datos ────────────────────────────────────────────────────────────────────
const menuItems = [
  { path: '/pabellon', icon: Home, label: 'Inicio' },
  { path: '/pabellon/calendario', icon: Calendar, label: 'Calendario' },
  { path: '/pabellon/equipo', icon: UserCog, label: 'Equipo' },
  { path: '/pabellon/insumos', icon: Package, label: 'Insumos' },
  { path: '/pabellon/correos', icon: Mail, label: 'Correos', badge: true },
  { path: '/pabellon/reportes', icon: BarChart2, label: 'Reportes' },
  { path: '/pabellon/auditoria', icon: FileSearch, label: 'Auditoría' },
  { path: '/pabellon/integraciones', icon: Plug2, label: 'Integraciones' },
  { path: '/pabellon/configuracion', icon: LayoutGrid, label: 'Configuración' },
]

// ─── Estilos por tema ─────────────────────────────────────────────────────────
const THEME = {
  page:            { dark: 'bg-slate-900 text-white',         medical: 'bg-slate-50 text-slate-900',  light: 'bg-slate-50 text-slate-900' },
  sidebar:         { dark: 'bg-slate-900 border-slate-800',   medical: 'bg-blue-900 border-blue-800', light: 'bg-white border-slate-200' },
  logoBox:         { dark: 'bg-slate-800 shadow-slate-900',   medical: 'bg-blue-700 shadow-blue-900', light: 'bg-blue-600 shadow-blue-100' },
  brandTitle:      { dark: 'text-white',                      medical: 'text-white',                  light: 'text-slate-900' },
  collapseBtn:     { dark: 'hover:bg-slate-800 text-slate-400 hover:text-white', medical: 'hover:bg-blue-800 text-blue-200 hover:text-white', light: 'hover:bg-slate-50 text-slate-400 hover:text-blue-600' },
  navItemActive:   { dark: 'bg-slate-800 text-white shadow-lg shadow-slate-900', medical: 'bg-blue-700 text-white shadow-lg shadow-blue-900', light: 'bg-blue-600 text-white shadow-lg shadow-blue-100' },
  navItemInactive: { dark: 'text-slate-400 hover:bg-slate-800 hover:text-white', medical: 'text-blue-200 hover:bg-blue-800 hover:text-white', light: 'text-slate-500 hover:bg-slate-50 hover:text-blue-600' },
  navIcon:         { dark: 'text-slate-400 group-hover:text-white', medical: 'text-blue-200 group-hover:text-white', light: 'text-slate-400 group-hover:text-blue-600' },
  sidebarBorder:   { dark: 'border-slate-800',                medical: 'border-blue-800',             light: 'border-slate-100' },
  logoutBtn:       { dark: 'text-slate-400 hover:text-red-400 hover:bg-red-900/20', medical: 'text-blue-200 hover:text-red-400 hover:bg-red-900/20', light: 'text-slate-400 hover:text-red-500 hover:bg-red-50' },
  logoutIcon:      { dark: 'group-hover:text-red-400',        medical: 'group-hover:text-red-400',    light: 'group-hover:text-red-500' },
  mainBg:          { dark: 'bg-slate-900',                    medical: 'bg-slate-50',                 light: 'bg-slate-50' },
  header:          { dark: 'bg-slate-900/80 border-slate-800', medical: 'bg-white/95 border-blue-100', light: 'bg-white/95 border-slate-200 shadow-sm' },
  headerBtn:       { dark: 'bg-slate-800 border-slate-700 text-slate-300 hover:text-blue-400 hover:bg-slate-700', medical: 'bg-blue-50 border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-100', light: 'bg-slate-100 border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50' },
  notifDropdown:   { dark: 'bg-slate-800 border-slate-700',   medical: 'bg-white border-blue-200',   light: 'bg-white border-slate-200' },
  notifBorder:     { dark: 'border-slate-700',                medical: 'border-slate-200',            light: 'border-slate-200' },
  notifTitle:      { dark: 'text-white',                      medical: 'text-slate-900',              light: 'text-slate-900' },
  notifEmpty:      { dark: 'text-slate-400',                  medical: 'text-slate-500',              light: 'text-slate-500' },
  notifDivide:     { dark: 'divide-slate-700',                medical: 'divide-slate-200',            light: 'divide-slate-200' },
  notifRead:       { dark: 'bg-slate-800/50 hover:bg-slate-700/50', medical: 'hover:bg-slate-50',    light: 'hover:bg-slate-50' },
  notifUnread:     { dark: 'bg-blue-900/20 hover:bg-slate-700/50',  medical: 'bg-blue-50/50 hover:bg-slate-50', light: 'bg-blue-50/50 hover:bg-slate-50' },
  notifItemTitle:  { dark: 'text-white',                      medical: 'text-slate-900',              light: 'text-slate-900' },
  notifItemMsg:    { dark: 'text-slate-400',                  medical: 'text-slate-600',              light: 'text-slate-600' },
  notifItemTime:   { dark: 'text-slate-500',                  medical: 'text-slate-400',              light: 'text-slate-400' },
}

// ─── Estilos estáticos ────────────────────────────────────────────────────────
const STYLES = {
  mobileOverlay:      'fixed inset-0 bg-black/50 z-40 lg:hidden',
  sidebarDesktop:     'border-r h-screen sticky top-0 flex flex-col p-6 hidden lg:flex transition-all duration-300 ease-in-out z-50',
  sidebarMobile:      'fixed left-0 top-0 h-full w-72 border-r flex flex-col p-6 transition-transform duration-300 ease-in-out z-50 lg:hidden',
  logoIconBox:        'p-2 rounded-xl shadow-lg',
  navLabel:           'text-[10px] font-black uppercase tracking-[0.2em] mb-4 px-2 animate-in fade-in text-slate-400',
  navItemBase:        'w-full flex items-center px-4 py-3.5 rounded-2xl transition-all group',
  navIconBadge:       'absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white',
  navBadge:           'bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center',
  sidebarFooter:      'mt-auto space-y-4 pt-6 border-t',
  logoutBase:         'flex items-center px-4 py-3 rounded-2xl transition-all font-bold text-sm uppercase tracking-tight group',
  contentWrap:        'flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 lg:ml-0',
  headerBase:         'backdrop-blur-xl border-b sticky top-0 z-40 px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between',
  mobileMenuBtn:      'lg:hidden p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all touch-manipulation',
  mobileLogo:         'lg:hidden flex items-center gap-2',
  mobileLogoBox:      'bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-100',
  headerBtnBase:      'w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all relative',
  settingsBtnBase:    'w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer',
  notifBadge:         'absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center border-2 border-white',
  notifDropdownBase:  'absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-2xl border shadow-xl z-50 flex flex-col',
  notifHeaderRow:     'flex items-center justify-between px-4 py-3 border-b',
  notifTitleBase:     'font-bold text-sm uppercase tracking-tight',
  notifMarkAllBtn:    'text-xs font-semibold text-blue-600 hover:underline',
  notifScroll:        'overflow-y-auto flex-1',
  notifEmptyBase:     'px-4 py-6 text-center text-sm',
  notifItemBase:      'px-4 py-3 cursor-pointer transition-colors',
  notifItemTitleBase: 'font-semibold text-sm',
  notifItemMsgBase:   'text-xs mt-0.5 line-clamp-2',
  notifItemTimeBase:  'text-[10px] mt-1',
  trialExpired:       'bg-red-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm',
  trialWarning:       'bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm',
  trialContent:       'flex items-center gap-2 font-semibold',
  trialBtnActivate:   'shrink-0 bg-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors',
  trialBtnPlans:      'shrink-0 bg-white text-amber-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors',
  mainContent:        'flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10 transition-colors duration-150 min-h-full',
  settingsHint:       'bg-blue-50 border border-blue-100 rounded-xl sm:rounded-2xl p-3 sm:p-4',
  settingsHintTitle:  'text-xs sm:text-sm font-bold text-blue-900 mb-1',
  settingsHintText:   'text-[10px] sm:text-xs text-blue-700',
  themeGrid:          'grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4',
  themeCardActive:    'p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left hover:shadow-lg border-blue-500 bg-blue-50 shadow-md',
  themeCardInactive:  'p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left hover:shadow-lg border-slate-200 bg-white hover:border-blue-300',
  themeIconRow:       'flex items-center gap-3 mb-3',
  themeIconBase:      'w-10 h-10 rounded-lg border-2 flex items-center justify-center flex-shrink-0',
  themeTitle:         'font-black text-sm text-slate-900 uppercase',
  themeSubtitle:      'text-[10px] text-slate-500 font-bold',
  themeDesc:          'text-xs text-slate-600 mb-3',
  themeSwatches:      'flex gap-1',
  themeSwatch:        'w-6 h-6 rounded',
  themeActiveLabel:   'mt-3 text-xs font-bold text-blue-600 uppercase',
  settingsFooter:     'pt-4 border-t border-slate-200',
  settingsFooterText: 'text-[10px] sm:text-xs text-slate-500 font-bold text-center',
  logoRow:            'flex items-center gap-3 animate-in fade-in duration-300',
  logoIcon:           'text-white w-6 h-6',
  portalLabel:        'text-[10px] font-bold uppercase tracking-widest text-slate-400',
  collapseIcon:       'w-5 h-5',
  navBase:            'flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1',
  navItemRow:         'flex items-center gap-3',
  navIconWrap:        'relative',
  navItemLabel:       'font-bold text-sm uppercase tracking-tight',
  mobileHeader:       'flex items-center justify-between mb-12 px-1',
  mobileLogoRow:      'flex items-center gap-3',
  headerLeft:         'flex items-center gap-3 sm:gap-4',
  headerRight:        'flex items-center gap-3 sm:gap-4',
  menuIcon:           'w-6 h-6',
  mobileLogoIconSm:   'text-white w-5 h-5',
  mobileBrandTitle:   'text-sm font-black text-slate-900 tracking-tighter uppercase leading-none',
  mobilePortalLabel:  'text-[8px] text-slate-400 font-bold uppercase tracking-widest',
  notifBtnWrap:       'relative',
  bellIcon:           'w-4 h-4 sm:w-[18px] sm:h-[18px]',
  settingsIcon:       'w-4 h-4 sm:w-[18px] sm:h-[18px]',
  trialIcon:          'w-4 h-4 shrink-0',
  settingsBody:       'space-y-4 sm:space-y-6',
  iconSun:            'w-5 h-5 text-yellow-500',
  iconMoon:           'w-5 h-5 text-slate-300',
  iconActivity:       'w-5 h-5 text-white',
  iconClose:          'w-5 h-5',
}

// ─── Trial Expired Gate ───────────────────────────────────────────────────────
// Pantalla que bloquea el acceso cuando el período de demo ha terminado.
function TrialExpiredGate({ clinicaInfo }) {
  return (
    <Navigate to="/elegir-plan" replace state={{ trialExpired: true, clinicaInfo }} />
  )
}

export default function PabellonLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const userId = useCurrentUserId()
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const notificationsDropdownRef = useRef(null)
  const { theme, changeTheme } = useTheme()

  const { data: clinicaInfo } = useClinicaInfo()
  const trial = useTrialStatus(clinicaInfo)

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

  useRealtimeNotifications(userId)
  const { count: unreadCount } = useUnreadNotifications(userId)
  const { notifications, markAsRead, markAllAsRead } = useNotificationsList(userId, { enabled: showNotificationsDropdown })

  const { data: correosData } = useQuery({
    queryKey: ['external-messages-unread'],
    queryFn: fetchMessageCounts,
    enabled: !!userId,
    refetchInterval: 30000,
  })
  const correosNoLeidos = correosData?.data?.no_leidos ?? 0

  const handleLogout = async () => {
    const { clearAllAppData } = await import('../utils/storageCleaner')
    clearAllAppData()
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const handleNotificationClick = (n) => {
    if (!n.vista) markAsRead.mutate(n.id)
    setShowNotificationsDropdown(false)
    if (n.tipo === 'solicitud_reagendamiento') {
      navigate('/pabellon/calendario', { state: { fromReagendamientoNotification: true, surgeryRequestId: n.relacionado_con } })
    } else if (n.tipo === 'operacion_reagendada') {
      navigate('/pabellon/calendario', { state: { surgeryId: n.relacionado_con } })
    } else if (n.tipo === 'solicitud_aceptada' || n.tipo === 'solicitud_rechazada' || n.tipo === 'operacion_programada') {
      navigate('/pabellon/solicitudes')
    }
  }

  const isSelected = (path) => {
    if (path === '/pabellon') return location.pathname === '/pabellon'
    return location.pathname.startsWith(path)
  }

  // Trial expirado: mostrar pantalla de selección de plan en lugar de la app
  if (clinicaInfo && trial.isExpired) {
    return <TrialExpiredGate clinicaInfo={clinicaInfo} />
  }

  return (
    <div className={`min-h-screen font-sans antialiased flex overflow-hidden transition-colors duration-150 ${THEME.page[theme]}`}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={STYLES.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar Desktop */}
      <aside className={`${isCollapsed ? 'w-24' : 'w-72'} ${THEME.sidebar[theme]} ${STYLES.sidebarDesktop}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-12 px-1`}>
          {!isCollapsed && (
            <div className={STYLES.logoRow}>
              <div className={`${STYLES.logoIconBox} ${THEME.logoBox[theme]}`}>
                <Stethoscope className={STYLES.logoIcon} />
              </div>
              <div>
                <h2 className={`text-lg font-black tracking-tighter uppercase leading-none ${THEME.brandTitle[theme]}`}>SurgicalHUB</h2>
                <span className={STYLES.portalLabel}>Portal Clínico</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className={`${STYLES.logoIconBox} ${THEME.logoBox[theme]}`}>
              <Stethoscope className={STYLES.logoIcon} />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-xl transition-all ${isCollapsed ? 'mt-4' : ''} ${THEME.collapseBtn[theme]}`}
          >
            {isCollapsed ? <PanelLeftOpen className={STYLES.collapseIcon} /> : <PanelLeftClose className={STYLES.collapseIcon} />}
          </button>
        </div>

        <nav className={STYLES.navBase}>
          {!isCollapsed && <p className={STYLES.navLabel}>Navegación</p>}
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isSelected(item.path)
            const badgeCount = item.badge ? correosNoLeidos : 0
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${STYLES.navItemBase} ${isCollapsed ? 'justify-center' : 'justify-between'} ${active ? THEME.navItemActive[theme] : THEME.navItemInactive[theme]}`}
              >
                <div className={STYLES.navItemRow}>
                  <div className={STYLES.navIconWrap}>
                    <Icon className={`w-[22px] h-[22px] ${active ? 'text-white' : THEME.navIcon[theme]}`} />
                    {badgeCount > 0 && (
                      <span className={STYLES.navIconBadge}>
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className={STYLES.navItemLabel}>{item.label}</span>
                  )}
                </div>
                {!isCollapsed && badgeCount > 0 && (
                  <span className={STYLES.navBadge}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className={`${STYLES.sidebarFooter} ${THEME.sidebarBorder[theme]}`}>
          <button
            onClick={handleLogout}
            className={`w-full ${STYLES.logoutBase} ${isCollapsed ? 'justify-center' : 'gap-3'} ${THEME.logoutBtn[theme]}`}
          >
            <LogOut className={`w-[22px] h-[22px] ${THEME.logoutIcon[theme]}`} />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`${STYLES.sidebarMobile} ${THEME.sidebar[theme]} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={STYLES.mobileHeader}>
          <div className={STYLES.mobileLogoRow}>
            <div className={`${STYLES.logoIconBox} ${THEME.logoBox[theme]}`}>
              <Stethoscope className={STYLES.logoIcon} />
            </div>
            <div>
              <h2 className={`text-lg font-black tracking-tighter uppercase leading-none ${THEME.brandTitle[theme]}`}>SurgicalHUB</h2>
              <span className={STYLES.portalLabel}>Portal Clínico</span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className={`p-2 rounded-xl transition-all ${THEME.collapseBtn[theme]}`}
          >
            <X className={STYLES.iconClose} />
          </button>
        </div>

        <nav className={STYLES.navBase}>
          <p className={STYLES.navLabel}>Navegación</p>
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isSelected(item.path)
            const badgeCount = item.badge ? correosNoLeidos : 0
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${STYLES.navItemBase} justify-between ${active ? THEME.navItemActive[theme] : THEME.navItemInactive[theme]}`}
              >
                <div className={STYLES.navItemRow}>
                  <div className={STYLES.navIconWrap}>
                    <Icon className={`w-[22px] h-[22px] ${active ? 'text-white' : THEME.navIcon[theme]}`} />
                    {badgeCount > 0 && isCollapsed && (
                      <span className={STYLES.navIconBadge}>
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </div>
                  <span className={STYLES.navItemLabel}>{item.label}</span>
                </div>
                {badgeCount > 0 && (
                  <span className={STYLES.navBadge}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className={`${STYLES.sidebarFooter} ${THEME.sidebarBorder[theme]}`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 ${STYLES.logoutBase} ${THEME.logoutBtn[theme]}`}
          >
            <LogOut className={`w-[22px] h-[22px] ${THEME.logoutIcon[theme]}`} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${STYLES.contentWrap} ${THEME.mainBg[theme]}`}>
        <header className={`${STYLES.headerBase} ${THEME.header[theme]}`}>
          <div className={STYLES.headerLeft}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={STYLES.mobileMenuBtn}
              aria-label="Abrir menú"
            >
              <Menu className={STYLES.menuIcon} />
            </button>
            <div className={STYLES.mobileLogo}>
              <div className={STYLES.mobileLogoBox}>
                <Stethoscope className={STYLES.mobileLogoIconSm} />
              </div>
              <div>
                <h2 className={STYLES.mobileBrandTitle}>SurgicalHUB</h2>
                <span className={STYLES.mobilePortalLabel}>Portal Clínico</span>
              </div>
            </div>
          </div>

          <div className={STYLES.headerRight}>
            {/* Notificaciones */}
            <div className={STYLES.notifBtnWrap} ref={notificationsDropdownRef}>
              <button
                type="button"
                onClick={() => setShowNotificationsDropdown((v) => !v)}
                className={`${STYLES.headerBtnBase} ${THEME.headerBtn[theme]}`}
                title="Notificaciones"
                aria-label="Notificaciones"
                aria-expanded={showNotificationsDropdown}
              >
                <Bell className={STYLES.bellIcon} />
                {unreadCount > 0 && (
                  <span className={STYLES.notifBadge}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className={`${STYLES.notifDropdownBase} ${THEME.notifDropdown[theme]}`}>
                  <div className={`${STYLES.notifHeaderRow} ${THEME.notifBorder[theme]}`}>
                    <h3 className={`${STYLES.notifTitleBase} ${THEME.notifTitle[theme]}`}>
                      Notificaciones
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllAsRead.mutate()}
                        className={STYLES.notifMarkAllBtn}
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <div className={STYLES.notifScroll}>
                    {notifications.length === 0 ? (
                      <p className={`${STYLES.notifEmptyBase} ${THEME.notifEmpty[theme]}`}>
                        No hay notificaciones
                      </p>
                    ) : (
                      <ul className={`divide-y ${THEME.notifDivide[theme]}`}>
                        {notifications.map((n) => (
                          <li
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(n) }}
                            className={`${STYLES.notifItemBase} ${n.vista ? THEME.notifRead[theme] : THEME.notifUnread[theme]}`}
                          >
                            <p className={`${STYLES.notifItemTitleBase} ${THEME.notifItemTitle[theme]}`}>{n.titulo}</p>
                            <p className={`${STYLES.notifItemMsgBase} ${THEME.notifItemMsg[theme]}`}>{n.mensaje}</p>
                            <p className={`${STYLES.notifItemTimeBase} ${THEME.notifItemTime[theme]}`}>
                              {format(new Date(n.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Configuración */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className={`${STYLES.settingsBtnBase} ${THEME.headerBtn[theme]}`}
              title="Configuración"
              aria-label="Configuración"
            >
              <Settings className={STYLES.settingsIcon} />
            </button>
          </div>
        </header>

        {/* Trial banner — aviso de días restantes */}
        {trial.isWarning && (
          <div className={STYLES.trialWarning}>
            <div className={STYLES.trialContent}>
              <AlertTriangle className={STYLES.trialIcon} />
              {trial.daysLeft === 1
                ? '⚠️ Queda 1 día de demo. Activa un plan para no perder el acceso.'
                : trial.daysLeft <= 3
                ? `⚠️ Quedan ${trial.daysLeft} días de demo. Activa un plan para no perder el acceso.`
                : `Quedan ${trial.daysLeft} días de tu demo gratuito.`}
            </div>
            <button onClick={() => navigate('/elegir-plan')} className={STYLES.trialBtnPlans}>
              Ver planes
            </button>
          </div>
        )}

        <main className={`${STYLES.mainContent} ${THEME.mainBg[theme]}`}>
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/solicitudes" element={<Solicitudes />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/bloqueo" element={<BloqueoHorario />} />
              <Route path="/medicos" element={<Medicos />} />
              <Route path="/equipo" element={<Equipo />} />
              <Route path="/insumos" element={<Insumos />} />
              <Route path="/correos" element={<Correos />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/auditoria" element={<Auditoria />} />
              <Route path="/integraciones" element={<Integraciones />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="/facturacion" element={<Facturacion />} />
              <Route path="*" element={<Navigate to="/pabellon" />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Modal de Configuración de Tema */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Configuración de Tema"
      >
        <div className={STYLES.settingsBody}>
          <div className={STYLES.settingsHint}>
            <p className={STYLES.settingsHintTitle}>Personaliza la apariencia de la aplicación</p>
            <p className={STYLES.settingsHintText}>Selecciona un tema que se adapte a tus preferencias de trabajo</p>
          </div>

          <div className={STYLES.themeGrid}>
            {/* Tema Claro */}
            <button
              onClick={() => { changeTheme('light'); setShowSettingsModal(false) }}
              className={theme === 'light' ? STYLES.themeCardActive : STYLES.themeCardInactive}
            >
              <div className={STYLES.themeIconRow}>
                <div className={`${STYLES.themeIconBase} bg-white border-slate-300`}>
                  <Sun className={STYLES.iconSun} />
                </div>
                <div>
                  <h3 className={STYLES.themeTitle}>Claro</h3>
                  <p className={STYLES.themeSubtitle}>Estándar</p>
                </div>
              </div>
              <p className={STYLES.themeDesc}>Tema claro con fondo blanco, ideal para trabajo diurno</p>
              <div className={STYLES.themeSwatches}>
                <div className={`${STYLES.themeSwatch} bg-white border border-slate-200`} />
                <div className={`${STYLES.themeSwatch} bg-slate-100 border border-slate-200`} />
                <div className={`${STYLES.themeSwatch} bg-blue-100 border border-blue-200`} />
              </div>
              {theme === 'light' && <div className={STYLES.themeActiveLabel}>Activo</div>}
            </button>

            {/* Tema Oscuro */}
            <button
              onClick={() => { changeTheme('dark'); setShowSettingsModal(false) }}
              className={theme === 'dark' ? STYLES.themeCardActive : STYLES.themeCardInactive}
            >
              <div className={STYLES.themeIconRow}>
                <div className={`${STYLES.themeIconBase} bg-slate-900 border-slate-700`}>
                  <Moon className={STYLES.iconMoon} />
                </div>
                <div>
                  <h3 className={STYLES.themeTitle}>Oscuro</h3>
                  <p className={STYLES.themeSubtitle}>Blanco y Negro</p>
                </div>
              </div>
              <p className={STYLES.themeDesc}>Tema oscuro en escala de grises, reduce la fatiga visual</p>
              <div className={STYLES.themeSwatches}>
                <div className={`${STYLES.themeSwatch} bg-slate-900 border border-slate-800`} />
                <div className={`${STYLES.themeSwatch} bg-slate-800 border border-slate-700`} />
                <div className={`${STYLES.themeSwatch} bg-slate-700 border border-slate-600`} />
              </div>
              {theme === 'dark' && <div className={STYLES.themeActiveLabel}>Activo</div>}
            </button>

            {/* Tema Médico */}
            <button
              onClick={() => { changeTheme('medical'); setShowSettingsModal(false) }}
              className={theme === 'medical' ? STYLES.themeCardActive : STYLES.themeCardInactive}
            >
              <div className={STYLES.themeIconRow}>
                <div className={`${STYLES.themeIconBase} bg-blue-600 border-blue-700`}>
                  <Activity className={STYLES.iconActivity} />
                </div>
                <div>
                  <h3 className={STYLES.themeTitle}>Médico</h3>
                  <p className={STYLES.themeSubtitle}>Clínico</p>
                </div>
              </div>
              <p className={STYLES.themeDesc}>Tema diseñado para entornos clínicos y hospitalarios</p>
              <div className={STYLES.themeSwatches}>
                <div className={`${STYLES.themeSwatch} bg-blue-600 border border-blue-700`} />
                <div className={`${STYLES.themeSwatch} bg-blue-50 border border-blue-200`} />
                <div className={`${STYLES.themeSwatch} bg-white border border-blue-100`} />
              </div>
              {theme === 'medical' && <div className={STYLES.themeActiveLabel}>Activo</div>}
            </button>
          </div>

          <div className={STYLES.settingsFooter}>
            <p className={STYLES.settingsFooterText}>
              El tema seleccionado se guardará automáticamente y se aplicará en toda la aplicación
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
