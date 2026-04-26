import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, CheckCircle2, AlertTriangle, Lock, Mail } from 'lucide-react'
import { checkSuperAdminExists, signUpClinica, setupSuperAdminRecord } from '@/services/onboardingService'

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page:        'min-h-screen bg-slate-950 flex items-center justify-center p-4',
  card:        'w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl',
  logoWrap:    'flex justify-center mb-8',
  logoBox:     'w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50',
  title:       'text-2xl font-black text-white uppercase tracking-tighter text-center mb-1',
  subtitle:    'text-slate-400 text-sm text-center mb-8',
  label:       'block text-xs font-black uppercase tracking-widest text-slate-400 mb-2',
  inputWrap:   'relative mb-4',
  input:       'w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500 pr-10',
  inputErr:    'w-full bg-slate-800 border border-red-500/60 text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-slate-500 pr-10',
  eyeBtn:      'absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors',
  iconLeft:    'absolute left-3 top-1/2 -translate-y-1/2 text-slate-500',
  inputPl:     'w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500',
  fieldErr:    'text-red-400 text-xs font-semibold mt-1',
  btn:         'w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest rounded-xl py-3.5 transition-all mt-2',
  alertErr:    'flex items-start gap-3 bg-red-900/30 border border-red-700/50 rounded-xl p-4 mb-6 text-red-300 text-sm',
  alertOk:     'flex items-start gap-3 bg-green-900/30 border border-green-700/50 rounded-xl p-4 mb-6 text-green-300 text-sm',
  alertWarn:   'flex items-start gap-3 bg-amber-900/30 border border-amber-700/50 rounded-xl p-4 mb-6 text-amber-300 text-sm',
  divider:     'border-t border-slate-800 mt-8 pt-6',
  loginLink:   'text-center text-xs text-slate-500',
  loginAnchor: 'text-blue-400 hover:text-blue-300 font-semibold transition-colors',
  badge:       'inline-flex items-center gap-1.5 bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mx-auto block w-fit mb-6',
  successCard: 'text-center space-y-4',
  successIcon: 'w-16 h-16 rounded-full bg-green-900/40 border-2 border-green-600 flex items-center justify-center mx-auto',
  successTitle:'text-xl font-black text-white uppercase tracking-tighter',
  successSub:  'text-slate-400 text-sm',
  credBox:     'bg-slate-800 border border-slate-700 rounded-2xl p-4 text-left space-y-2 mt-4',
  credRow:     'flex justify-between items-center',
  credLabel:   'text-xs font-black uppercase tracking-wide text-slate-500',
  credValue:   'text-sm font-semibold text-white',
  goBtn:       'w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest rounded-xl py-3 transition-all mt-4',
  alreadyWrap: 'text-center space-y-4',
  alreadyIcon: 'w-16 h-16 rounded-full bg-amber-900/40 border-2 border-amber-600 flex items-center justify-center mx-auto',
  alreadyTitle:'text-xl font-black text-white uppercase tracking-tighter',
  alreadySub:  'text-slate-400 text-sm',
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(email, password, confirm) {
  const errs = {}
  if (!email)                                errs.email    = 'El email es obligatorio'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email inválido'
  if (!password)                             errs.password = 'La contraseña es obligatoria'
  else if (password.length < 8)             errs.password = 'Mínimo 8 caracteres'
  else if (!/[A-Z]/.test(password))         errs.password = 'Debe incluir al menos una mayúscula'
  else if (!/[0-9]/.test(password))         errs.password = 'Debe incluir al menos un número'
  if (password !== confirm)                  errs.confirm  = 'Las contraseñas no coinciden'
  return errs
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SetupAdmin() {
  const navigate = useNavigate()

  const [checking, setChecking]     = useState(true)
  const [exists, setExists]         = useState(false)
  const [success, setSuccess]       = useState(null) // { email }

  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [showCf, setShowCf]         = useState(false)
  const [fieldErrs, setFieldErrs]   = useState({})
  const [globalErr, setGlobalErr]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [needsConfirm, setNeedsConfirm] = useState(false)

  // Verificar si ya hay un super admin
  useEffect(() => {
    checkSuperAdminExists()
      .then(({ data, error }) => {
        if (!error) setExists(Boolean(data))
        setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGlobalErr('')
    setFieldErrs({})

    const errs = validate(email.trim(), password, confirm)
    if (Object.keys(errs).length > 0) {
      setFieldErrs(errs)
      return
    }

    setLoading(true)
    try {
      // Paso 1 — Crear usuario en Supabase Auth
      const { data: signUpData, error: signUpErr } = await signUpClinica(
        email.trim().toLowerCase(),
        password,
        { metadata: { role: 'super_admin' } }
      )

      if (signUpErr) {
        if (signUpErr.message?.includes('already registered')) {
          setGlobalErr('Este email ya está registrado. Usa otro email o inicia sesión.')
        } else {
          setGlobalErr(signUpErr.message || 'Error al crear el usuario.')
        }
        return
      }

      const userId = signUpData?.user?.id
      if (!userId) {
        setGlobalErr('No se pudo obtener el ID del usuario. Intenta de nuevo.')
        return
      }

      // Verificar si el email necesita confirmación
      const emailConfirmed = signUpData?.user?.email_confirmed_at
      if (!emailConfirmed) {
        // Email no confirmado aún — guardar el userId para después
        // y registrar en la tabla users de todas formas
        setNeedsConfirm(true)
      }

      // Paso 2 — Registrar como super_admin en public.users
      const { error: rpcErr } = await setupSuperAdminRecord(userId, email.trim().toLowerCase())

      if (rpcErr) {
        setGlobalErr(rpcErr.message || 'Error al asignar el rol de administrador.')
        // Limpiar el auth user creado si el RPC falla
        return
      }

      setSuccess({ email: email.trim().toLowerCase() })
    } catch (err) {
      setGlobalErr('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (checking) {
    return (
      <div className={S.page}>
        <div className={S.card}>
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  // ── Ya existe un super admin ──────────────────────────────────────────────
  if (exists) {
    return (
      <div className={S.page}>
        <div className={S.card}>
          <div className={S.alreadyWrap}>
            <div className={S.alreadyIcon}>
              <Lock className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className={S.alreadyTitle}>Setup completado</h1>
            <p className={S.alreadySub}>
              Ya existe un super administrador registrado en la plataforma.
              Esta página ya no es accesible.
            </p>
            <button onClick={() => navigate('/acceso')} className={S.goBtn}>
              Ir al login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Cuenta creada con éxito ───────────────────────────────────────────────
  if (success) {
    return (
      <div className={S.page}>
        <div className={S.card}>
          <div className={S.successCard}>
            <div className={S.successIcon}>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h1 className={S.successTitle}>¡Admin creado!</h1>
            <p className={S.successSub}>
              La cuenta de Super Administrador fue configurada exitosamente.
            </p>

            {needsConfirm && (
              <div className={S.alertWarn}>
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>
                  Revisa tu bandeja de entrada y confirma el email antes de iniciar sesión.
                  Si no llega, revisa la carpeta de spam.
                </span>
              </div>
            )}

            <div className={S.credBox}>
              <div className={S.credRow}>
                <span className={S.credLabel}>Email</span>
                <span className={S.credValue}>{success.email}</span>
              </div>
              <div className={S.credRow}>
                <span className={S.credLabel}>Rol</span>
                <span className="text-sm font-bold text-blue-400">Super Administrador</span>
              </div>
              <div className={S.credRow}>
                <span className={S.credLabel}>Acceso</span>
                <span className={S.credValue}>/acceso → /admin</span>
              </div>
            </div>

            <button onClick={() => navigate('/acceso')} className={S.goBtn}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Formulario de creación ────────────────────────────────────────────────
  return (
    <div className={S.page}>
      <div className={S.card}>
        {/* Logo */}
        <div className={S.logoWrap}>
          <div className={S.logoBox}>
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Badge */}
        <span className={S.badge}>
          <Shield size={12} />
          Primer acceso — Configuración inicial
        </span>

        <h1 className={S.title}>Crear Super Admin</h1>
        <p className={S.subtitle}>
          Configura la cuenta maestra de SurgicalHUB.
          Solo se puede crear una vez.
        </p>

        {/* Error global */}
        {globalErr && (
          <div className={S.alertErr}>
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{globalErr}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="sa-email" className={S.label}>Email</label>
            <div className={S.inputWrap} style={{ marginBottom: 0 }}>
              <Mail className={`${S.iconLeft} w-4 h-4`} />
              <input
                id="sa-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`${fieldErrs.email ? S.inputErr : S.input} pl-9`}
                placeholder="admin@surgicalhub.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            {fieldErrs.email && <p className={S.fieldErr}>{fieldErrs.email}</p>}
          </div>

          {/* Contraseña */}
          <div className="mb-4">
            <label htmlFor="sa-pw" className={S.label}>Contraseña</label>
            <div className={S.inputWrap} style={{ marginBottom: 0 }}>
              <input
                id="sa-pw"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={fieldErrs.password ? S.inputErr : S.input}
                placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className={S.eyeBtn}
                tabIndex={-1}
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrs.password && <p className={S.fieldErr}>{fieldErrs.password}</p>}
          </div>

          {/* Confirmar contraseña */}
          <div className="mb-6">
            <label htmlFor="sa-cf" className={S.label}>Confirmar contraseña</label>
            <div className={S.inputWrap} style={{ marginBottom: 0 }}>
              <input
                id="sa-cf"
                type={showCf ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={fieldErrs.confirm ? S.inputErr : S.input}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCf(v => !v)}
                className={S.eyeBtn}
                tabIndex={-1}
                aria-label={showCf ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrs.confirm && <p className={S.fieldErr}>{fieldErrs.confirm}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={S.btn}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Creando cuenta…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Shield size={16} />
                Crear Super Administrador
              </span>
            )}
          </button>
        </form>

        <div className={S.divider}>
          <p className={S.loginLink}>
            ¿Ya tienes cuenta?{' '}
            <a href="/acceso" className={S.loginAnchor}>Iniciar sesión</a>
          </p>
        </div>
      </div>
    </div>
  )
}
