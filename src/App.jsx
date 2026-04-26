import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { logger } from './utils/logger'
import { SESSION_KEYS } from './constants/sessionKeys'
import {
  getCurrentUser,
  getUserRole,
  signOut,
  onAuthStateChange,
} from './services/authService'
import LoadingSpinner from './components/common/LoadingSpinner'
import InstallBanner from './components/common/InstallBanner'
import { ROLES } from './constants/roles'

// Lazy loading de todas las páginas — reduce el bundle inicial
const Landing             = lazy(() => import('./pages/public/Landing'))
const Login               = lazy(() => import('./pages/auth/Login'))
const LoginPabellon       = lazy(() => import('./pages/auth/LoginPabellon'))
const LoginDoctor         = lazy(() => import('./pages/auth/LoginDoctor'))
const RecuperarContraseña = lazy(() => import('./pages/auth/RecuperarContraseña'))
const RestablecerContraseña = lazy(() => import('./pages/auth/RestablecerContraseña'))
const SetupAdmin          = lazy(() => import('./pages/auth/SetupAdmin'))
const ContactoExterno     = lazy(() => import('./pages/public/ContactoExterno'))
const Privacidad          = lazy(() => import('./pages/public/Privacidad'))
const MFAVerificacion     = lazy(() => import('./pages/auth/MFAVerificacion'))
const PabellonLayout      = lazy(() => import('./layouts/PabellonLayout'))
const DoctorLayout        = lazy(() => import('./layouts/DoctorLayout'))
const AdminLayout         = lazy(() => import('./layouts/AdminLayout'))
// Onboarding
const Registro            = lazy(() => import('./pages/onboarding/Registro'))
const ConfirmarEmail      = lazy(() => import('./pages/onboarding/ConfirmarEmail'))
const RegistroInvitacion  = lazy(() => import('./pages/onboarding/RegistroInvitacion'))
const ElegirPlan          = lazy(() => import('./pages/onboarding/ElegirPlan'))
const Bienvenida          = lazy(() => import('./pages/onboarding/Bienvenida'))

// Detecta si el error es por token de refresco inválido (sesión antigua/revocada)
function isInvalidRefreshTokenError(error) {
  if (!error) return false
  const msg = (error.message || '').toLowerCase()
  const name = (error.name || '').toLowerCase()
  return name === 'authapierror' || msg.includes('refresh token') || msg.includes('refresh_token')
}

function AppContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { user: currentUser, error } = await getCurrentUser()
        if (error) {
          if (isInvalidRefreshTokenError(error)) {
            logger.warn('Token de refresco inválido o no encontrado. Limpiando sesión.')
            await signOut()
            sessionStorage.setItem(SESSION_KEYS.SESSION_EXPIRED, '1')
          }
          setUser(null)
          setUserRole(null)
          setLoading(false)
          return
        }
        setUser(currentUser ?? null)
        if (currentUser) {
          await fetchUserRole(currentUser.id)
        } else {
          setUserRole(null)
          setLoading(false)
        }
      } catch (err) {
        if (isInvalidRefreshTokenError(err)) {
          logger.warn('Token de refresco inválido. Limpiando sesión.')
          await signOut()
          sessionStorage.setItem(SESSION_KEYS.SESSION_EXPIRED, '1')
        }
        setUser(null)
        setUserRole(null)
        setLoading(false)
      }
    }
    initAuth()

    const unsubscribe = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user.id)
      } else {
        setUserRole(null)
        setLoading(false)
        sessionStorage.removeItem(SESSION_KEYS.VALIDATING_LOGIN)
      }
    })

    return unsubscribe
  }, [])

  const fetchUserRole = async (userId) => {
    try {
      const { role, error } = await getUserRole(userId)

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Usuario no encontrado en tabla users.')
          setUserRole(null)
          setLoading(false)
          return
        }
        if (error.status === 401 || error.message?.includes('JWT')) {
          logger.warn('Sesión expirada. Redirigiendo al login...')
          await signOut()
          setUser(null)
          setUserRole(null)
          setLoading(false)
          return
        }
        throw error
      }

      setUserRole(role)
    } catch (error) {
      logger.errorWithContext('Error fetching user role', error)
      if (error.status === 401 || error.message?.includes('JWT') || error.message?.includes('expired')) {
        await signOut()
        setUser(null)
        setUserRole(null)
      } else {
        setUserRole(null)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route
          path="/"
          element={
            user && userRole === ROLES.SUPER_ADMIN ? (
              <Navigate to="/admin" replace />
            ) : user && userRole ? (
              <Navigate to={userRole === ROLES.DOCTOR ? '/doctor' : '/pabellon'} replace />
            ) : (
              <Landing />
            )
          }
        />

        <Route
          path="/login/pabellon"
          element={
            user && userRole === ROLES.PABELLON ? (
              <Navigate to="/pabellon" />
            ) : user && userRole === ROLES.DOCTOR ? (
              <LoginPabellon />
            ) : user ? (
              <Navigate to="/" />
            ) : (
              <LoginPabellon />
            )
          }
        />

        <Route
          path="/login/doctor"
          element={
            user && userRole === ROLES.DOCTOR ? (
              <Navigate to="/doctor" />
            ) : user && userRole === ROLES.PABELLON ? (
              <LoginDoctor />
            ) : user ? (
              <Navigate to="/" />
            ) : (
              <LoginDoctor />
            )
          }
        />

        <Route
          path="/acceso"
          element={
            user && userRole ? (
              <Navigate to={userRole === ROLES.DOCTOR ? '/doctor' : userRole === ROLES.SUPER_ADMIN ? '/admin' : '/pabellon'} replace />
            ) : (
              <Login />
            )
          }
        />

        <Route path="/recuperar-contrasena" element={<RecuperarContraseña />} />
        <Route path="/restablecer-contrasena" element={<RestablecerContraseña />} />
        <Route path="/contacto" element={<ContactoExterno />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/mfa/verificar" element={<MFAVerificacion />} />
        <Route path="/setup-admin" element={<SetupAdmin />} />

        {/* Onboarding — accesible sin rol asignado aún */}
        <Route path="/registro" element={<Registro />} />
        <Route path="/onboarding/confirmar" element={<ConfirmarEmail />} />
        <Route path="/registro/invitacion" element={<RegistroInvitacion />} />
        <Route
          path="/elegir-plan"
          element={user ? <ElegirPlan /> : <Navigate to="/registro" replace />}
        />
        <Route
          path="/bienvenida"
          element={user ? <Bienvenida /> : <Navigate to="/registro" replace />}
        />

        <Route
          path="/pabellon/*"
          element={
            user && (userRole === ROLES.PABELLON || userRole === ROLES.ADMIN_CLINICA) && !sessionStorage.getItem(SESSION_KEYS.VALIDATING_LOGIN) ? (
              <PabellonLayout />
            ) : user && sessionStorage.getItem(SESSION_KEYS.VALIDATING_LOGIN) ? (
              <LoadingSpinner />
            ) : user ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login/pabellon" replace />
            )
          }
        />

        <Route
          path="/doctor/*"
          element={
            user && userRole === ROLES.DOCTOR && !sessionStorage.getItem(SESSION_KEYS.VALIDATING_LOGIN) ? (
              <DoctorLayout />
            ) : user && sessionStorage.getItem(SESSION_KEYS.VALIDATING_LOGIN) ? (
              <LoadingSpinner />
            ) : user ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login/doctor" replace />
            )
          }
        />

        <Route
          path="/admin/*"
          element={
            user && userRole === ROLES.SUPER_ADMIN ? (
              <AdminLayout />
            ) : user ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login/pabellon" replace />
            )
          }
        />
      </Routes>
      <InstallBanner />
    </Suspense>
  )
}

function App() {
  return <AppContent />
}

export default App
