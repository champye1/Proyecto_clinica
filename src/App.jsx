import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { logger } from './utils/logger'
import { SESSION_KEYS } from './constants/sessionKeys'
import {
  getCurrentUser,
  getUserRole,
  signOut,
  onAuthStateChange,
} from './services/authService'
import LoadingSpinner from './components/common/LoadingSpinner'

// Lazy loading de todas las páginas — reduce el bundle inicial
const Inicio              = lazy(() => import('./pages/auth/Inicio'))
const LoginPabellon       = lazy(() => import('./pages/auth/LoginPabellon'))
const LoginDoctor         = lazy(() => import('./pages/auth/LoginDoctor'))
const RecuperarContraseña = lazy(() => import('./pages/auth/RecuperarContraseña'))
const RestablecerContraseña = lazy(() => import('./pages/auth/RestablecerContraseña'))
const ContactoExterno     = lazy(() => import('./pages/public/ContactoExterno'))
const PabellonLayout      = lazy(() => import('./layouts/PabellonLayout'))
const DoctorLayout        = lazy(() => import('./layouts/DoctorLayout'))

// Detecta si el error es por token de refresco inválido (sesión antigua/revocada)
function isInvalidRefreshTokenError(error) {
  if (!error) return false
  const msg = (error.message || '').toLowerCase()
  const name = (error.name || '').toLowerCase()
  return name === 'authapierror' || msg.includes('refresh token') || msg.includes('refresh_token')
}

function AppContent() {
  const location = useLocation()
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

    const unsubscribe = onAuthStateChange((event, session) => {
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
            user && userRole ? (
              <Navigate to={userRole === 'pabellon' ? '/pabellon' : '/doctor'} replace />
            ) : (
              <Inicio />
            )
          }
        />

        <Route
          path="/login/pabellon"
          element={
            user && userRole === 'pabellon' ? (
              <Navigate to="/pabellon" />
            ) : user && userRole === 'doctor' ? (
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
            user && userRole === 'doctor' ? (
              <Navigate to="/doctor" />
            ) : user && userRole === 'pabellon' ? (
              <LoginDoctor />
            ) : user ? (
              <Navigate to="/" />
            ) : (
              <LoginDoctor />
            )
          }
        />

        <Route path="/recuperar-contrasena" element={<RecuperarContraseña />} />
        <Route path="/restablecer-contrasena" element={<RestablecerContraseña />} />
        <Route path="/contacto" element={<ContactoExterno />} />

        <Route
          path="/pabellon/*"
          element={
            user && userRole === 'pabellon' && !sessionStorage.getItem(SESSION_KEYS.VALIDATING_LOGIN) ? (
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
            user && userRole === 'doctor' && !sessionStorage.getItem(SESSION_KEYS.VALIDATING_LOGIN) ? (
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
      </Routes>
    </Suspense>
  )
}

function App() {
  return <AppContent />
}

export default App
