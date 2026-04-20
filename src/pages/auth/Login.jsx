import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, AlertCircle, Eye, EyeOff, Building2 } from 'lucide-react'
import { sanitizeEmail, sanitizePassword } from '@/utils/sanitizeInput'
import {
  isLocked,
  recordFailedAttempt,
  clearLoginAttempts,
  formatRemainingTime,
} from '@/utils/rateLimiter'
import { signIn, verifyUserExists, signOut } from '@/services/authService'
import { SESSION_KEYS } from '@/constants/sessionKeys'
import { ROLES } from '@/constants/roles'

// ─── Configuración ────────────────────────────────────────────────────────────
const ROLE_REDIRECT = {
  [ROLES.PABELLON]:      '/pabellon',
  [ROLES.ADMIN_CLINICA]: '/pabellon',
  [ROLES.SUPER_ADMIN]:   '/admin',
  [ROLES.DOCTOR]:        '/doctor',
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:        'min-h-screen flex items-center justify-center bg-slate-50 p-4',
  logoBox:     'w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200',
  card:        'bg-white rounded-2xl shadow-sm border border-slate-100 p-8',
  label:       'block text-xs font-medium text-slate-600 mb-1.5',
  inputIcon:   'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300',
  input:       'w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 bg-white',
  inputWithBtn:'w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 bg-white',
  toggleBtn:   'absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500',
  alertBox:    'flex items-center gap-2 p-3 rounded-xl text-xs',
  suspendedBox:'bg-amber-50 border border-amber-200 text-amber-700',
  lockoutBox:  'bg-orange-50 border border-orange-200 text-orange-700',
  errorBox:    'bg-red-50 border border-red-200 text-red-600',
  submitBtn:   'w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-blue-200',
  spinner:     'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin',
  container:   'w-full max-w-sm',
  headerWrap:  'text-center mb-8',
  logoLink:    'inline-flex flex-col items-center gap-3',
  logoIcon:    'w-6 h-6 text-white',
  logoText:    'font-bold text-slate-900 text-lg tracking-tight',
  cardTitle:   'text-xl font-bold text-slate-900 mb-1',
  cardSubtitle:'text-sm text-slate-400 mb-6',
  formSpace:   'space-y-4',
  alertIcon:   'w-4 h-4 shrink-0',
  inputWrap:   'relative',
  labelRow:    'flex items-center justify-between mb-1.5',
  forgotLink:  'text-xs text-blue-600 hover:underline',
  eyeIcon:     'w-4 h-4',
  loadingRow:  'flex items-center justify-center gap-2',
  footerText:  'text-center text-sm text-slate-400 mt-6',
  registerLink:'text-blue-600 hover:underline font-medium',
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lockoutInfo, setLockoutInfo] = useState(null)
  const [suspended, setSuspended] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEYS.ACCOUNT_SUSPENDED)) {
      setSuspended(true)
      sessionStorage.removeItem(SESSION_KEYS.ACCOUNT_SUSPENDED)
    }
  }, [])

  useEffect(() => {
    if (email) {
      const lockStatus = isLocked(email)
      setLockoutInfo(lockStatus.isLocked
        ? { isLocked: true, remainingTime: formatRemainingTime(lockStatus.remainingTime) }
        : null
      )
    } else {
      setLockoutInfo(null)
    }
  }, [email])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const lockStatus = isLocked(email)
      if (lockStatus.isLocked) {
        setError(`Demasiados intentos. Intenta en ${formatRemainingTime(lockStatus.remainingTime)}.`)
        return
      }

      sessionStorage.setItem('validating_login', 'true')

      const { data, error: authError } = await signIn(email, password)

      if (authError) {
        sessionStorage.removeItem('validating_login')
        const attemptResult = recordFailedAttempt(email)
        if (attemptResult.isLocked) {
          throw new Error(`Demasiados intentos fallidos. Cuenta bloqueada por ${formatRemainingTime(Math.ceil((attemptResult.lockoutTime - Date.now()) / 1000))}.`)
        }
        const remaining = attemptResult.remainingAttempts
        throw new Error(`Usuario o contraseña incorrectos.${remaining > 0 ? ` Te quedan ${remaining} intento${remaining !== 1 ? 's' : ''}.` : ''}`)
      }

      const { userData, error: userError } = await verifyUserExists(data.user.id)

      if (userError || !userData) {
        sessionStorage.removeItem('validating_login')
        await signOut()
        throw new Error('Usuario no encontrado en el sistema. Contacte al administrador.')
      }

      if (userData.activo === false) {
        sessionStorage.removeItem('validating_login')
        await signOut()
        throw new Error('Tu cuenta ha sido desactivada. Contacta al administrador de tu clínica.')
      }

      sessionStorage.removeItem('validating_login')
      clearLoginAttempts(email)

      const redirect = ROLE_REDIRECT[userData.role]
      if (!redirect) {
        await signOut()
        throw new Error('Rol desconocido. Contacte al administrador.')
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      navigate(redirect, { replace: true })
    } catch (err) {
      sessionStorage.removeItem('validating_login')
      setError(err.message || 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={STYLES.page}>
      <div className={STYLES.container}>
        {/* Logo */}
        <div className={STYLES.headerWrap}>
          <Link to="/" className={STYLES.logoLink}>
            <div className={STYLES.logoBox}>
              <Building2 className={STYLES.logoIcon} />
            </div>
            <span className={STYLES.logoText}>SurgicalHUB</span>
          </Link>
        </div>

        <div className={STYLES.card}>
          <h1 className={STYLES.cardTitle}>Bienvenido</h1>
          <p className={STYLES.cardSubtitle}>Ingresa con tu email y contraseña</p>

          <form onSubmit={handleLogin} className={STYLES.formSpace}>
            {suspended && (
              <div className={`${STYLES.alertBox} ${STYLES.suspendedBox}`} role="alert">
                <AlertCircle className={STYLES.alertIcon} />
                Tu cuenta ha sido desactivada. Contacta al administrador de tu clínica.
              </div>
            )}

            {lockoutInfo?.isLocked && (
              <div className={`${STYLES.alertBox} ${STYLES.lockoutBox}`} role="alert">
                <AlertCircle className={STYLES.alertIcon} />
                Cuenta bloqueada. Intenta en {lockoutInfo.remainingTime}.
              </div>
            )}

            {error && (
              <div className={`${STYLES.alertBox} ${STYLES.errorBox}`} role="alert">
                <AlertCircle className={STYLES.alertIcon} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className={STYLES.label}>Email</label>
              <div className={STYLES.inputWrap}>
                <Mail className={STYLES.inputIcon} />
                <input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                  placeholder="tu@clinica.cl"
                  required disabled={loading} autoComplete="email"
                  className={STYLES.input}
                />
              </div>
            </div>

            <div>
              <div className={STYLES.labelRow}>
                <label htmlFor="password" className={STYLES.label} style={{ marginBottom: 0 }}>
                  Contraseña
                </label>
                <Link to="/recuperar-contrasena" className={STYLES.forgotLink}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className={STYLES.inputWrap}>
                <Lock className={STYLES.inputIcon} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                  placeholder="••••••••"
                  required disabled={loading} autoComplete="current-password"
                  className={STYLES.inputWithBtn}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className={STYLES.toggleBtn}
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? <EyeOff className={STYLES.eyeIcon} /> : <Eye className={STYLES.eyeIcon} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || lockoutInfo?.isLocked}
              className={STYLES.submitBtn}
            >
              {loading ? (
                <span className={STYLES.loadingRow}>
                  <span className={STYLES.spinner} />
                  Iniciando sesión...
                </span>
              ) : lockoutInfo?.isLocked ? 'Cuenta bloqueada' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className={STYLES.footerText}>
          ¿Tu clínica aún no tiene cuenta?{' '}
          <Link to="/registro" className={STYLES.registerLink}>
            Crear cuenta gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
