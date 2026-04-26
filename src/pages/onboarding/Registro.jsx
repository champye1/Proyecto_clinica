import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Building2, Mail, Lock, MapPin, Eye, EyeOff, ArrowRight, CheckCircle2, MailCheck } from 'lucide-react'
import { signUpClinica, registerClinica, resendConfirmation } from '@/services/onboardingService'
import { sanitizeEmail, sanitizeString } from '@/utils/sanitizeInput'
import { validatePasswordStrength, getPasswordStrengthLabel } from '@/utils/passwordStrength'

// ─── Datos ────────────────────────────────────────────────────────────────────
const BENEFICIOS = [
  'Agenda quirúrgica centralizada',
  'Gestión de pabellones en tiempo real',
  'Control de insumos y stock',
  'Panel para médicos y pabellón',
  '14 días de prueba gratis',
]

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:         'min-h-screen flex',
  branding:     'hidden lg:flex lg:w-5/12 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex-col justify-between p-12',
  brandingLogo: 'w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center',
  formPanel:    'flex-1 flex items-center justify-center p-6 bg-white',
  mobileLogo:   'w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center',
  label:        'block text-sm font-medium text-slate-700 mb-1',
  inputIcon:    'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400',
  input:        'w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm',
  inputWithBtn: 'w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm',
  toggleBtn:    'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600',
  errorBox:     'flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm',
  submitBtn:    'w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm',
  spinner:      'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin',
  // Pantalla email enviado
  centeredPage: 'min-h-screen flex items-center justify-center bg-white p-6',
  iconCircle:   'w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center',
  emailCard:    'w-full max-w-md text-center',
  emailIconRow: 'flex justify-center mb-6',
  mailCheckIcon:'w-8 h-8 text-blue-600',
  emailTitle:   'text-2xl font-bold text-slate-900 mb-3',
  emailSub:     'text-slate-500 mb-2',
  emailAddr:    'font-semibold text-slate-800 mb-6',
  emailHint:    'text-sm text-slate-400 mb-8',
  resendBtn:    'text-sm text-blue-600 hover:underline',
  spamNote:     'mt-8 text-xs text-slate-400',
  brandRow:     'flex items-center gap-3 mb-16',
  brandIcon:    'w-6 h-6 text-white',
  brandName:    'text-white font-bold text-xl tracking-tight',
  brandTitle:   'text-white text-4xl font-bold leading-tight mb-6',
  brandAccent:  'text-blue-400',
  brandSubtitle:'text-slate-400 text-lg leading-relaxed mb-12',
  benefitList:  'space-y-4',
  benefitItem:  'flex items-center gap-3 text-slate-300',
  benefitIcon:  'w-5 h-5 text-blue-400 shrink-0',
  brandFooter:  'text-slate-600 text-sm',
  formWrap:     'w-full max-w-md',
  mobileLogoRow:'flex items-center gap-2 mb-8 lg:hidden',
  mobileLogoIcon:'w-5 h-5 text-white',
  mobileText:   'font-bold text-slate-800 text-lg',
  formTitle:    'text-2xl font-bold text-slate-900 mb-1',
  formSub:      'text-slate-500 mb-1',
  formNote:     'text-xs text-slate-400 mb-8',
  formNoteEmphasis:'font-semibold text-slate-600',
  formSpace:    'space-y-4',
  inputWrap:    'relative',
  eyeIcon:      'w-4 h-4',
  arrowIcon:    'w-4 h-4',
  footerText:   'mt-6 text-center text-sm text-slate-500',
  loginLink:    'text-blue-600 hover:underline font-medium',
}

export default function Registro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    clinica: '',
    ciudad: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!aceptaTerminos) {
      setError('Debes aceptar la Política de Privacidad para continuar.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    const { isValid, errors: pwErrors } = validatePasswordStrength(form.password)
    if (!isValid) {
      setError(`Contraseña insegura: ${pwErrors.join(', ')}.`)
      return
    }

    setLoading(true)
    try {
      const { data: authData, error: authError } = await signUpClinica(
        sanitizeEmail(form.email),
        form.password,
        { redirectTo: `${window.location.origin}/onboarding/confirmar` }
      )

      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario.')

      // Supabase devuelve identities: [] cuando el email ya está registrado
      if (authData.user.identities?.length === 0) {
        throw new Error('Este email ya tiene una cuenta. Inicia sesión.')
      }

      localStorage.setItem('clinica_pendiente', JSON.stringify({
        clinica: sanitizeString(form.clinica),
        ciudad:  sanitizeString(form.ciudad),
        email:   sanitizeEmail(form.email),
      }))

      if (!authData.session) {
        setEmailEnviado(true)
        return
      }

      // Auto-confirm activo (entorno de desarrollo): crear clínica directamente
      const { error: rpcError } = await registerClinica({
        p_nombre: sanitizeString(form.clinica),
        p_ciudad: sanitizeString(form.ciudad),
      })
      if (rpcError) throw new Error(`Error al crear la clínica: ${rpcError.message}`)
      localStorage.removeItem('clinica_pendiente')
      navigate('/bienvenida', { replace: true })
    } catch (err) {
      const isAlreadyRegistered =
        err.message?.includes('already registered') ||
        err.message?.includes('User already registered')
      setError(isAlreadyRegistered
        ? 'Este email ya tiene una cuenta. Inicia sesión.'
        : err.message || 'Error al crear la cuenta. Intenta nuevamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (emailEnviado) {
    return (
      <div className={STYLES.centeredPage}>
        <div className={STYLES.emailCard}>
          <div className={STYLES.emailIconRow}>
            <div className={STYLES.iconCircle}>
              <MailCheck className={STYLES.mailCheckIcon} />
            </div>
          </div>
          <h2 className={STYLES.emailTitle}>Revisa tu email</h2>
          <p className={STYLES.emailSub}>Enviamos un enlace de confirmación a:</p>
          <p className={STYLES.emailAddr}>{form.email}</p>
          <p className={STYLES.emailHint}>
            Haz clic en el enlace del email para activar tu cuenta y continuar con la
            configuración de tu clínica.
          </p>
          <button
            onClick={async () => {
              await resendConfirmation(form.email)
              setError(null)
            }}
            className={STYLES.resendBtn}
          >
            ¿No llegó? Reenviar email
          </button>
          <p className={STYLES.spamNote}>Revisa también tu carpeta de spam.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={STYLES.page}>
      {/* Panel izquierdo — branding */}
      <div className={STYLES.branding}>
        <div>
          <div className={STYLES.brandRow}>
            <div className={STYLES.brandingLogo}>
              <Building2 className={STYLES.brandIcon} />
            </div>
            <span className={STYLES.brandName}>SurgicalHUB</span>
          </div>

          <h1 className={STYLES.brandTitle}>
            Gestión quirúrgica simple,<br />
            <span className={STYLES.brandAccent}>para clínicas modernas.</span>
          </h1>
          <p className={STYLES.brandSubtitle}>
            Centraliza pabellones, médicos e insumos en una sola plataforma diseñada
            para clínicas privadas.
          </p>

          <ul className={STYLES.benefitList}>
            {BENEFICIOS.map(b => (
              <li key={b} className={STYLES.benefitItem}>
                <CheckCircle2 className={STYLES.benefitIcon} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className={STYLES.brandFooter}>© 2025 SurgicalHUB — Todos los derechos reservados</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className={STYLES.formPanel}>
        <div className={STYLES.formWrap}>
          {/* Logo mobile */}
          <div className={STYLES.mobileLogoRow}>
            <div className={STYLES.mobileLogo}>
              <Building2 className={STYLES.mobileLogoIcon} />
            </div>
            <span className={STYLES.mobileText}>SurgicalHUB</span>
          </div>

          <h2 className={STYLES.formTitle}>Crea tu cuenta</h2>
          <p className={STYLES.formSub}>14 días gratis, sin tarjeta de crédito.</p>
          <p className={STYLES.formNote}>
            Quedarás registrado como{' '}
            <span className={STYLES.formNoteEmphasis}>titular de la clínica</span>{' '}
            — podrás invitar médicos y personal desde tu panel.
          </p>

          <form onSubmit={handleSubmit} className={STYLES.formSpace}>
            <div>
              <label htmlFor="clinica" className={STYLES.label}>Nombre de la clínica</label>
              <div className={STYLES.inputWrap}>
                <Building2 className={STYLES.inputIcon} />
                <input
                  id="clinica" name="clinica" type="text" required
                  value={form.clinica} onChange={handleChange}
                  placeholder="Clínica Las Américas"
                  className={STYLES.input}
                />
              </div>
            </div>

            <div>
              <label htmlFor="ciudad" className={STYLES.label}>Ciudad</label>
              <div className={STYLES.inputWrap}>
                <MapPin className={STYLES.inputIcon} />
                <input
                  id="ciudad" name="ciudad" type="text" required
                  value={form.ciudad} onChange={handleChange}
                  placeholder="Viña del Mar"
                  className={STYLES.input}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={STYLES.label}>Email del administrador</label>
              <div className={STYLES.inputWrap}>
                <Mail className={STYLES.inputIcon} />
                <input
                  id="email" name="email" type="email" required
                  value={form.email} onChange={handleChange}
                  placeholder="admin@clinica.cl"
                  className={STYLES.input}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={STYLES.label}>Contraseña</label>
              <div className={STYLES.inputWrap}>
                <Lock className={STYLES.inputIcon} />
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  required value={form.password} onChange={handleChange}
                  placeholder="Mín. 12 caracteres · mayúscula · número · especial"
                  className={STYLES.inputWithBtn}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className={STYLES.toggleBtn}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className={STYLES.eyeIcon} /> : <Eye className={STYLES.eyeIcon} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={STYLES.label}>Confirmar contraseña</label>
              <div className={STYLES.inputWrap}>
                <Lock className={STYLES.inputIcon} />
                <input
                  id="confirmPassword" name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required value={form.confirmPassword} onChange={handleChange}
                  placeholder="Repite la contraseña"
                  className={STYLES.input}
                />
              </div>
            </div>

            {form.password && (() => {
              const { score, errors: pwErrors } = validatePasswordStrength(form.password)
              const { label, color } = getPasswordStrengthLabel(score)
              return (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? color : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">{label}{pwErrors.length > 0 ? ` — falta: ${pwErrors.join(', ')}` : ''}</p>
                </div>
              )
            })()}

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={e => setAceptaTerminos(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
              />
              <span className="text-xs text-slate-500">
                He leído y acepto la{' '}
                <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                  Política de Privacidad
                </a>
                {' '}y el tratamiento de mis datos personales conforme a la Ley 21.719.
              </span>
            </label>

            {error && (
              <div className={STYLES.errorBox}>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading || !aceptaTerminos} className={STYLES.submitBtn}>
              {loading
                ? <span className={STYLES.spinner} />
                : <><span>Crear cuenta y continuar</span><ArrowRight className={STYLES.arrowIcon} /></>
              }
            </button>
          </form>

          <p className={STYLES.footerText}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login/pabellon" className={STYLES.loginLink}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
