import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Stethoscope, ArrowLeft } from 'lucide-react'
import { sanitizeEmail } from '@/utils/sanitizeInput'
import { resolveUsernameToEmail, sendPasswordResetEmail } from '@/services/authService'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:       'min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6',
  card:       'bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100',
  cardCenter: 'bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 text-center',
  backBtn:    'flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-bold text-[10px] sm:text-xs uppercase tracking-widest',
  iconWrap:   'bg-green-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl shadow-green-200 rotate-6',
  title:      'text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter',
  label:      'text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1',
  inputIcon:  'absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4',
  input:      'w-full bg-slate-50 border-2 border-slate-50 rounded-xl py-3 pl-10 pr-4 focus:border-green-500 focus:bg-white outline-none font-bold text-sm text-slate-700',
  errorBox:   'bg-red-50 border-2 border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm',
  submitBtn:  'w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed',
  backLink:   'inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-bold text-sm',
  logoWrap:   'flex justify-center mb-6',
  sentText:   'text-slate-600 text-sm mb-6',
  sentNote:   'text-slate-500 text-xs mb-8',
  arrowIcon:  'w-4 h-4',
  backArrow:  'w-3 h-3 sm:w-4 sm:h-4',
  logoMainIcon:'text-white w-6 h-6 sm:w-8 sm:h-8',
  headerSection:'text-center mb-8',
  headerNote: 'text-slate-500 text-xs mt-2',
  form:       'space-y-4',
  fieldWrap:  '',
  inputWrap:  'relative mt-1',
}

export default function RecuperarContraseña() {
  const [emailOrUser, setEmailOrUser] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      let emailToUse = emailOrUser.toLowerCase().trim()
      if (!emailToUse) {
        setError('Ingresa tu correo o nombre de usuario.')
        return
      }

      if (!emailToUse.includes('@')) {
        const { email: resolved, error: rpcError } = await resolveUsernameToEmail(emailToUse)
        if (rpcError || !resolved) {
          setError('No encontramos una cuenta de doctor con ese usuario. Usa tu correo electrónico.')
          return
        }
        emailToUse = resolved
      }

      const { error: resetError } = await sendPasswordResetEmail(emailToUse)
      if (resetError) {
        setError(resetError.message || 'Error al enviar el correo. Intenta de nuevo.')
        return
      }
      setSent(true)
    } catch (err) {
      setError(err.message || 'Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className={STYLES.page}>
        <div className={STYLES.cardCenter}>
          <div className={STYLES.logoWrap}>
            <div className={STYLES.iconWrap}>
              <Stethoscope className={STYLES.logoMainIcon} />
            </div>
          </div>
          <h1 className={`${STYLES.title} mb-2`}>Revisa tu correo</h1>
          <p className={STYLES.sentText}>
            Te enviamos un enlace para restablecer tu contraseña. Revisa la bandeja de
            entrada y la carpeta de spam.
          </p>
          <p className={STYLES.sentNote}>
            El enlace vence en 1 hora. Si no llega, vuelve a solicitarlo.
          </p>
          <Link to="/login/doctor" className={STYLES.backLink}>
            <ArrowLeft className={STYLES.arrowIcon} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={STYLES.page}>
      <div className={STYLES.card}>
        <button onClick={() => navigate('/login/doctor')} className={STYLES.backBtn}>
          <ArrowLeft className={STYLES.backArrow} />
          Volver al login
        </button>

        <div className={STYLES.logoWrap}>
          <div className={STYLES.iconWrap}>
            <Stethoscope className={STYLES.logoMainIcon} />
          </div>
        </div>

        <div className={STYLES.headerSection}>
          <h1 className={STYLES.title}>Recuperar contraseña</h1>
          <p className={STYLES.headerNote}>
            Portal médico – te enviaremos un enlace a tu correo
          </p>
        </div>

        <form onSubmit={handleSubmit} className={STYLES.form}>
          {error && <div className={STYLES.errorBox}>{error}</div>}

          <div>
            <label htmlFor="email" className={STYLES.label}>Correo o usuario</label>
            <div className={STYLES.inputWrap}>
              <Mail className={STYLES.inputIcon} />
              <input
                id="email"
                type="text"
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(sanitizeEmail(e.target.value))}
                className={STYLES.input}
                placeholder="evenegas o doctor@clinica.cl"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className={STYLES.submitBtn}>
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>
      </div>
    </div>
  )
}
