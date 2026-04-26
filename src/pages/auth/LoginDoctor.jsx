import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle, Stethoscope, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { sanitizeEmail, sanitizePassword } from '@/utils/sanitizeInput'
import {
  isLocked,
  recordFailedAttempt,
  clearLoginAttempts,
  formatRemainingTime,
} from '@/utils/rateLimiter'
import {
  resolveUsernameToEmail,
  signIn,
  verifyUserExists,
  verifyDoctorAccess,
  signOut,
} from '@/services/authService'
import { getAssuranceLevel } from '@/services/mfaService'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:         'min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 animate-in fade-in duration-500',
  card:         'bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100',
  backBtn:      'flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 sm:mb-8 font-bold text-[10px] sm:text-xs uppercase tracking-widest touch-manipulation',
  iconWrap:     'bg-green-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl shadow-green-200 rotate-6',
  title:        'text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter',
  subtitle:     'text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-2',
  label:        'text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1',
  hint:         'text-[10px] sm:text-xs text-slate-400 ml-1',
  inputIcon:    'absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 sm:w-[18px] sm:h-[18px]',
  input:        'w-full bg-slate-50 border-2 border-slate-50 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-3 sm:pr-4 focus:border-green-500 focus:bg-white transition-all outline-none font-bold text-sm sm:text-base text-slate-700 touch-manipulation',
  inputWithBtn: 'w-full bg-slate-50 border-2 border-slate-50 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-11 sm:pr-12 focus:border-green-500 focus:bg-white transition-all outline-none font-bold text-sm sm:text-base text-slate-700 touch-manipulation',
  toggleBtn:    'absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors',
  alertBox:     'px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl flex items-center gap-2 animate-in fade-in duration-300',
  alertText:    'text-[10px] sm:text-xs font-bold break-words',
  lockoutBox:   'bg-orange-50 border-2 border-orange-200 text-orange-700',
  errorBox:     'bg-red-50 border-2 border-red-200 text-red-700',
  warningBox:   'bg-amber-50 border-2 border-amber-300 text-amber-900',
  warningLabel: 'text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-700',
  submitBtn:    'w-full bg-green-600 hover:bg-green-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-xl shadow-green-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation',
  forgotBtn:    'text-slate-500 hover:text-green-600 text-[10px] sm:text-xs font-bold transition-colors',
  logoWrap:     'flex justify-center mb-6 sm:mb-8',
  headerSection:'text-center mb-8 sm:mb-10',
  form:         'space-y-4 sm:space-y-6',
  alertIcon:    'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0',
  alertIconTop: 'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5',
  alertBody:    'flex flex-col gap-0.5',
  fieldWrap:    'space-y-1.5 sm:space-y-2',
  inputWrap:    'relative',
  eyeIcon:      'w-5 h-5',
  forgotWrap:   'text-center mt-3',
  backArrow:    'w-3 h-3 sm:w-4 sm:h-4',
  logoMainIcon: 'text-white w-6 h-6 sm:w-8 sm:h-8',
}

export default function LoginDoctor() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [errorType, setErrorType] = useState(null)
  const [lockoutInfo, setLockoutInfo] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

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
    setLoading(true)
    setError(null)
    setErrorType(null)

    try {
      const lockStatus = isLocked(email)
      if (lockStatus.isLocked) {
        setError(`Demasiados intentos fallidos. Intenta nuevamente en ${formatRemainingTime(lockStatus.remainingTime)}.`)
        setLoading(false)
        return
      }

      sessionStorage.setItem('validating_login', 'true')

      const isEmail   = email.includes('@')
      let emailToUse  = email.toLowerCase().trim()

      if (!isEmail) {
        const { email: resolved, error: rpcError } = await resolveUsernameToEmail(email.toLowerCase().trim())
        if (rpcError || !resolved) {
          sessionStorage.removeItem('validating_login')
          const attemptResult = recordFailedAttempt(email)
          if (attemptResult.isLocked) {
            throw new Error(`Demasiados intentos fallidos. Tu cuenta ha sido bloqueada por ${formatRemainingTime(Math.ceil((attemptResult.lockoutTime - Date.now()) / 1000))}.`)
          }
          const remaining = attemptResult.remainingAttempts
          throw new Error(`Usuario o contraseña incorrectos. ${remaining > 0 ? `Te quedan ${remaining} intento${remaining !== 1 ? 's' : ''}.` : ''}`)
        }
        emailToUse = resolved
      }

      const { data, error: authError } = await signIn(emailToUse, password)

      if (authError) {
        sessionStorage.removeItem('validating_login')
        const attemptResult = recordFailedAttempt(email)
        if (attemptResult.isLocked) {
          throw new Error(`Demasiados intentos fallidos. Tu cuenta ha sido bloqueada por ${formatRemainingTime(Math.ceil((attemptResult.lockoutTime - Date.now()) / 1000))}.`)
        }
        const remaining = attemptResult.remainingAttempts
        throw new Error(`Usuario o contraseña incorrectos. ${remaining > 0 ? `Te quedan ${remaining} intento${remaining !== 1 ? 's' : ''}.` : ''}`)
      }

      const { userData, error: userError } = await verifyUserExists(data.user.id)

      if (userError) {
        sessionStorage.removeItem('validating_login')
        await signOut()
        throw userError
      }

      if (!userData) {
        sessionStorage.removeItem('validating_login')
        await signOut()
        throw new Error('Usuario no encontrado en el sistema. Contacte al administrador.')
      }

      if (userData.role === 'pabellon') {
        setError('Tienes que ingresar como Pabellón')
        setLoading(false)
        setTimeout(async () => {
          await signOut()
          sessionStorage.removeItem('validating_login')
        }, 100)
        return
      }

      sessionStorage.removeItem('validating_login')
      clearLoginAttempts(email)
      if (!isEmail && emailToUse) clearLoginAttempts(emailToUse)

      if (userData.role !== 'doctor') {
        await signOut()
        throw new Error('Este acceso es solo para usuarios de Doctor')
      }

      const { doctorData, error: doctorError } = await verifyDoctorAccess(data.user.id)

      if (doctorError) throw doctorError

      if (!doctorData) {
        await signOut()
        throw new Error('No se encontró información del doctor. Contacte al administrador.')
      }

      if (!doctorData.acceso_web_enabled) {
        setErrorType('blocked_account')
        setError('Su cuenta no tiene acceso web habilitado. Solo el administrador (Pabellón) puede activarlo. Contacte a la clínica si necesita ingresar al portal.')
        setLoading(false)
        await signOut()
        return
      }

      if (doctorData.estado === 'vacaciones') {
        setErrorType('blocked_account')
        setError('Su cuenta está en modo vacaciones. No puede acceder al sistema hasta que un administrador cambie su estado a activo. Contacte a la clínica si necesita ingresar.')
        setLoading(false)
        await signOut()
        return
      }

      // Verificar si el usuario tiene MFA inscrito
      const { data: aal } = await getAssuranceLevel()
      if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
        sessionStorage.setItem('mfa_redirect', '/doctor')
        navigate('/mfa/verificar', { replace: true })
        return
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      navigate('/doctor', { replace: true })
    } catch (err) {
      sessionStorage.removeItem('validating_login')
      setErrorType(null)
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const isBlocked = errorType === 'blocked_account'

  return (
    <div className={STYLES.page}>
      <div className={STYLES.card}>
        <button onClick={() => navigate('/')} className={STYLES.backBtn}>
          <ArrowLeft className={STYLES.backArrow} />
          Volver a inicio
        </button>

        <div className={STYLES.logoWrap}>
          <div className={STYLES.iconWrap}>
            <Stethoscope className={STYLES.logoMainIcon} />
          </div>
        </div>

        <div className={STYLES.headerSection}>
          <h1 className={STYLES.title}>Acceso Doctor</h1>
          <p className={STYLES.subtitle}>Portal Médico</p>
        </div>

        <form onSubmit={handleLogin} className={STYLES.form}>
          {lockoutInfo?.isLocked && (
            <div className={`${STYLES.alertBox} ${STYLES.lockoutBox}`} role="alert">
              <AlertCircle className={STYLES.alertIcon} />
              <span className={STYLES.alertText}>
                Cuenta bloqueada. Intenta nuevamente en {lockoutInfo.remainingTime}.
              </span>
            </div>
          )}

          {error && (
            <div
              className={`${STYLES.alertBox} items-start ${isBlocked ? STYLES.warningBox : STYLES.errorBox}`}
              role="alert"
            >
              <AlertCircle className={STYLES.alertIconTop} />
              <div className={STYLES.alertBody}>
                {isBlocked && (
                  <span className={STYLES.warningLabel}>Aviso: no puede acceder al portal</span>
                )}
                <span className={STYLES.alertText}>{error}</span>
              </div>
            </div>
          )}

          <div className={STYLES.fieldWrap}>
            <label htmlFor="email" className={STYLES.label}>Usuario o Correo</label>
            <div className={STYLES.inputWrap}>
              <Mail className={STYLES.inputIcon} aria-hidden="true" />
              <input
                id="email" type="text" value={email}
                onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                className={STYLES.input}
                placeholder="evenegas o doctor@clinica.cl"
                required disabled={loading} autoComplete="username"
              />
            </div>
            <p className={STYLES.hint}>Puedes ingresar con tu nombre de usuario o correo electrónico</p>
          </div>

          <div className={STYLES.fieldWrap}>
            <label htmlFor="password" className={STYLES.label}>Contraseña</label>
            <div className={STYLES.inputWrap}>
              <Lock className={STYLES.inputIcon} aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                className={STYLES.inputWithBtn}
                placeholder="••••••••"
                required disabled={loading} autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={STYLES.toggleBtn}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className={STYLES.eyeIcon} /> : <Eye className={STYLES.eyeIcon} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || lockoutInfo?.isLocked}
            aria-busy={loading}
            aria-disabled={loading || lockoutInfo?.isLocked}
            className={STYLES.submitBtn}
          >
            {loading ? 'Iniciando sesión...' : lockoutInfo?.isLocked ? 'Cuenta Bloqueada' : 'Entrar al Sistema'}
          </button>

          <p className={STYLES.forgotWrap}>
            <button
              type="button"
              onClick={() => navigate('/recuperar-contrasena')}
              className={STYLES.forgotBtn}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </p>
        </form>

        <p className="mt-6 text-center text-[10px] text-slate-400">
          Al iniciar sesión aceptas nuestra{' '}
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
            Política de Privacidad
          </a>
        </p>
      </div>
    </div>
  )
}
