import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Stethoscope, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { sanitizePassword } from '@/utils/sanitizeInput'
import { getCurrentSession, updatePassword, signOut } from '@/services/authService'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:       'min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6',
  card:       'bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100',
  cardCenter: 'bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 text-center',
  cardSimple: 'bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center',
  iconGreen:  'bg-green-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl shadow-green-200 rotate-6',
  iconAmber:  'bg-amber-500 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl rotate-6',
  title:      'text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2',
  label:      'text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1',
  inputIcon:  'absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4',
  input:      'w-full bg-slate-50 border-2 border-slate-50 rounded-xl py-3 pl-10 pr-4 focus:border-green-500 focus:bg-white outline-none font-bold text-sm text-slate-700',
  inputWithBtn: 'w-full bg-slate-50 border-2 border-slate-50 rounded-xl py-3 pl-10 pr-11 focus:border-green-500 focus:bg-white outline-none font-bold text-sm text-slate-700',
  toggleBtn:  'absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600',
  errorBox:   'bg-red-50 border-2 border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm',
  submitBtn:  'w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed',
  primaryBtn: 'inline-block w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest text-center',
  backLink:   'text-slate-500 hover:text-slate-700 text-sm inline-flex items-center gap-1',
  checkingText:'text-slate-600 font-bold',
  logoWrap:   'flex justify-center mb-6',
  expiredText:'text-slate-600 text-sm mb-6',
  backLinkWrap:'mt-6 text-center',
  arrowIcon:  'w-4 h-4',
  logoMainIcon:'text-white w-6 h-6 sm:w-8 sm:h-8',
  headerSection:'text-center mb-8',
  headerNote: 'text-slate-500 text-xs mt-2',
  form:       'space-y-4',
  inputWrap:  'relative mt-1',
  eyeIcon:    'w-5 h-5',
}

export default function RestablecerContraseña() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [linkStatus, setLinkStatus] = useState('checking') // checking | valid | expired
  const navigate = useNavigate()

  useEffect(() => {
    const hash   = window.location.hash || ''
    const params = new URLSearchParams(hash.replace(/^#/, ''))

    if (params.get('error')) {
      setLinkStatus('expired')
      return
    }

    getCurrentSession().then(({ session }) => {
      setLinkStatus(session ? 'valid' : 'expired')
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      const { error: updateError } = await updatePassword(sanitizePassword(password))
      if (updateError) {
        setError(updateError.message || 'Error al actualizar la contraseña.')
        return
      }
      await signOut()
      navigate('/login/doctor', { replace: true })
      window.location.reload()
    } catch (err) {
      setError(err.message || 'Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  if (linkStatus === 'checking') {
    return (
      <div className={STYLES.page}>
        <div className={STYLES.cardSimple}>
          <p className={STYLES.checkingText}>Comprobando enlace...</p>
        </div>
      </div>
    )
  }

  if (linkStatus === 'expired') {
    return (
      <div className={STYLES.page}>
        <div className={STYLES.cardCenter}>
          <div className={STYLES.logoWrap}>
            <div className={STYLES.iconAmber}>
              <Lock className={STYLES.logoMainIcon} />
            </div>
          </div>
          <h1 className={STYLES.title}>Enlace inválido o expirado</h1>
          <p className={STYLES.expiredText}>
            El enlace de recuperación ya no es válido (caduca en 1 hora). Solicita uno nuevo.
          </p>
          <Link to="/recuperar-contrasena" className={STYLES.primaryBtn}>
            Solicitar nuevo enlace
          </Link>
          <p className={STYLES.backLinkWrap}>
            <Link to="/login/doctor" className={STYLES.backLink}>
              <ArrowLeft className={STYLES.arrowIcon} />
              Volver al login
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={STYLES.page}>
      <div className={STYLES.card}>
        <div className={STYLES.logoWrap}>
          <div className={STYLES.iconGreen}>
            <Stethoscope className={STYLES.logoMainIcon} />
          </div>
        </div>

        <div className={STYLES.headerSection}>
          <h1 className={`${STYLES.title} mb-0`}>Nueva contraseña</h1>
          <p className={STYLES.headerNote}>
            Elige una contraseña segura (mín. 6 caracteres)
          </p>
        </div>

        <form onSubmit={handleSubmit} className={STYLES.form}>
          {error && <div className={STYLES.errorBox}>{error}</div>}

          <div>
            <label htmlFor="password" className={STYLES.label}>Nueva contraseña</label>
            <div className={STYLES.inputWrap}>
              <Lock className={STYLES.inputIcon} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                className={STYLES.inputWithBtn}
                placeholder="••••••••"
                minLength={6}
                disabled={loading}
                autoComplete="new-password"
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

          <div>
            <label htmlFor="confirm" className={STYLES.label}>Repetir contraseña</label>
            <div className={STYLES.inputWrap}>
              <Lock className={STYLES.inputIcon} />
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(sanitizePassword(e.target.value))}
                className={STYLES.input}
                placeholder="••••••••"
                minLength={6}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className={STYLES.submitBtn}>
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>

        <p className={STYLES.backLinkWrap}>
          <Link to="/login/doctor" className={STYLES.backLink}>
            <ArrowLeft className={STYLES.arrowIcon} />
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  )
}
