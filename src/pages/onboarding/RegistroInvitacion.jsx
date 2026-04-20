import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, User, Phone, ChevronDown, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/config/supabase'
import { sanitizeString } from '@/utils/sanitizeInput'
import { ESPECIALIDADES_CHILE } from '@/constants/especialidades'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:          'min-h-screen flex items-center justify-center bg-slate-50 p-4',
  logoBox:       'w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 mx-auto mb-3',
  card:          'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden',
  label:         'text-xs font-medium text-slate-600 mb-1.5 block',
  inputIcon:     'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300',
  input:         'w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
  inputWithIcon: 'w-full pl-9 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
  inputWithBtn:  'w-full pl-9 pr-10 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
  select:        'w-full border border-slate-200 rounded-xl py-2.5 px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white',
  toggleBtn:     'absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500',
  errorBox:      'flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm',
  primaryBtn:    'w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors',
  submitBtn:     'flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors',
  backBtn:       'px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50',
  codeInput:     'w-full border border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.3em] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase',
  spinner:       'w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin',
  // Pantalla de carga
  loadingPage:   'min-h-screen flex items-center justify-center bg-white p-6',
  loadingIcon:   'w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4',
  loadingCenter: 'text-center',
  loadingPulse:  'w-8 h-8 text-blue-600 animate-pulse',
  loadingTitle:  'text-xl font-bold text-slate-900 mb-2',
  loadingNote:   'text-sm text-slate-400',
  spinnerRow:    'mt-4 flex justify-center',
  container:     'w-full max-w-md',
  headerWrap:    'text-center mb-8',
  logoIcon:      'w-6 h-6 text-white',
  brandName:     'font-bold text-slate-900 text-lg',
  brandSub:      'text-sm text-slate-400 mt-1',
  step1:         'p-8',
  step1Title:    'text-xl font-bold text-slate-900 mb-1',
  step1Sub:      'text-sm text-slate-400 mb-6',
  codeMb:        'mb-6',
  alertIcon:     'w-4 h-4 mt-0.5 shrink-0',
  step2:         'p-8 space-y-4',
  validBadge:    'inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-700 mb-4',
  checkIconSm:   'w-3.5 h-3.5',
  step2Title:    'text-xl font-bold text-slate-900 mb-1',
  step2Sub:      'text-sm text-slate-400',
  grid2gap3:     'grid grid-cols-2 gap-3',
  inputWrap:     'relative',
  optionalLabel: 'text-slate-400',
  chevronDown:   'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none',
  eyeIcon:       'w-4 h-4',
  actionsRow:    'flex gap-3 pt-2',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function validarCodigo(codigo) {
  const { data, error } = await supabase
    .from('invitaciones')
    .select('id, rol, clinica_id, email, usado, activo, expires_at')
    .eq('codigo', codigo.trim().toUpperCase())
    .single()

  if (error || !data)          return { valido: false, error: 'Código no encontrado. Verifica que esté bien escrito.' }
  if (data.usado)              return { valido: false, error: 'Este código ya fue utilizado.' }
  if (data.activo === false)   return { valido: false, error: 'Esta invitación ha sido desactivada. Solicita una nueva al administrador.' }
  if (new Date(data.expires_at) < new Date()) return { valido: false, error: 'El código expiró. Solicita uno nuevo al administrador.' }
  return { valido: true, invitacion: data }
}

export default function RegistroInvitacion() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [paso, setPaso] = useState('codigo') // codigo | datos | completando
  const [codigoInput, setCodigoInput] = useState(searchParams.get('codigo') || '')
  const [invitacion, setInvitacion] = useState(null)
  const [errorCodigo, setErrorCodigo] = useState(null)
  const [validandoCodigo, setValidandoCodigo] = useState(false)

  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '',
    especialidad: '', especialidadPersonalizada: '',
    password: '', confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const codigoUrl = searchParams.get('codigo')
    if (codigoUrl) {
      setCodigoInput(codigoUrl)
      handleValidarCodigo(codigoUrl)
    }
  }, [])

  const handleValidarCodigo = async (codigo) => {
    if (!codigo?.trim()) { setErrorCodigo('Ingresa el código de invitación.'); return }
    setValidandoCodigo(true)
    setErrorCodigo(null)
    const resultado = await validarCodigo(codigo)
    setValidandoCodigo(false)
    if (!resultado.valido) { setErrorCodigo(resultado.error); return }
    setInvitacion(resultado.invitacion)
    setPaso('datos')
  }

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword)         { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 8)                       { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (!form.nombre.trim() || !form.apellido.trim())   { setError('Nombre y apellido son obligatorios.'); return }
    if (invitacion.rol === 'doctor' && !form.especialidad) { setError('Selecciona tu especialidad.'); return }

    const especialidadFinal = form.especialidad === 'otra'
      ? sanitizeString(form.especialidadPersonalizada)
      : form.especialidad

    setLoading(true)
    setPaso('completando')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      let userId

      if (session) {
        userId = session.user.id
        const { error: passError } = await supabase.auth.updateUser({ password: form.password })
        if (passError) throw passError
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: invitacion.email,
          password: form.password,
          options: { emailRedirectTo: `${window.location.origin}/acceso` },
        })
        if (signUpError) throw signUpError
        if (!signUpData.user)    throw new Error('No se pudo crear la cuenta.')
        if (!signUpData.session) throw new Error('Confirma tu email para continuar. Revisa tu bandeja de entrada.')
        userId = signUpData.user.id
      }

      const nombre   = sanitizeString(form.nombre.trim())
      const apellido = sanitizeString(form.apellido.trim())

      const { error: userError } = await supabase.from('users').insert({
        id: userId,
        email: invitacion.email,
        role: invitacion.rol,
        clinica_id: invitacion.clinica_id,
        nombre: `${nombre} ${apellido}`,
      })
      if (userError && userError.code !== '23505') throw userError

      if (invitacion.rol === 'doctor') {
        const { error: doctorError } = await supabase.from('doctors').insert({
          user_id: userId,
          nombre,
          apellido,
          email: invitacion.email,
          especialidad: especialidadFinal,
          estado: 'activo',
          acceso_web_enabled: true,
          clinica_id: invitacion.clinica_id,
        })
        if (doctorError && doctorError.code !== '23505') throw doctorError
      }

      if (form.telefono.trim()) {
        await supabase.from('users')
          .update({ telefono: sanitizeString(form.telefono.trim()) })
          .eq('id', userId)
      }

      await supabase.from('invitaciones')
        .update({ usado: true, usado_por: userId })
        .eq('id', invitacion.id)

      await new Promise(r => setTimeout(r, 300))
      navigate(invitacion.rol === 'doctor' ? '/doctor' : '/pabellon', { replace: true })

    } catch (err) {
      setError(err.message || 'Error al completar el registro.')
      setPaso('datos')
    } finally {
      setLoading(false)
    }
  }

  if (paso === 'completando') {
    return (
      <div className={STYLES.loadingPage}>
        <div className={STYLES.loadingCenter}>
          <div className={STYLES.loadingIcon}>
            <CheckCircle2 className={STYLES.loadingPulse} />
          </div>
          <h2 className={STYLES.loadingTitle}>Configurando tu cuenta...</h2>
          <p className={STYLES.loadingNote}>Un momento por favor.</p>
          <div className={STYLES.spinnerRow}>
            <span className={STYLES.spinner} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={STYLES.page}>
      <div className={STYLES.container}>
        {/* Logo */}
        <div className={STYLES.headerWrap}>
          <div className={STYLES.logoBox}>
            <Building2 className={STYLES.logoIcon} />
          </div>
          <h1 className={STYLES.brandName}>SurgicalHUB</h1>
          <p className={STYLES.brandSub}>Activación de cuenta</p>
        </div>

        <div className={STYLES.card}>
          {/* Paso 1 — Código */}
          {paso === 'codigo' && (
            <div className={STYLES.step1}>
              <h2 className={STYLES.step1Title}>Ingresa tu código</h2>
              <p className={STYLES.step1Sub}>
                El administrador de tu clínica te envió un código de invitación.
                Ingrésalo para continuar.
              </p>

              {errorCodigo && (
                <div className={`${STYLES.errorBox} mb-4`}>
                  <AlertCircle className={STYLES.alertIcon} />
                  <span>{errorCodigo}</span>
                </div>
              )}

              <div className={STYLES.codeMb}>
                <label className={STYLES.label}>Código de invitación</label>
                <input
                  value={codigoInput}
                  onChange={e => { setCodigoInput(e.target.value.toUpperCase()); setErrorCodigo(null) }}
                  onKeyDown={e => e.key === 'Enter' && handleValidarCodigo(codigoInput)}
                  placeholder="XXXX-XXXX"
                  className={STYLES.codeInput}
                  maxLength={9}
                />
              </div>

              <button
                onClick={() => handleValidarCodigo(codigoInput)}
                disabled={validandoCodigo || !codigoInput.trim()}
                className={STYLES.primaryBtn}
              >
                {validandoCodigo ? 'Verificando...' : 'Continuar →'}
              </button>
            </div>
          )}

          {/* Paso 2 — Datos personales */}
          {paso === 'datos' && invitacion && (
            <form onSubmit={handleSubmit} className={STYLES.step2}>
              <div>
                <div className={STYLES.validBadge}>
                  <CheckCircle2 className={STYLES.checkIconSm} />
                  Código válido · Cuenta tipo{' '}
                  {invitacion.rol === 'doctor'
                    ? 'Médico'
                    : invitacion.rol === 'admin_clinica'
                      ? 'Titular de Clínica'
                      : 'Pabellón'}
                </div>
                <h2 className={STYLES.step2Title}>Completa tu perfil</h2>
                <p className={STYLES.step2Sub}>Esta información aparecerá en el sistema de la clínica.</p>
              </div>

              {error && (
                <div className={STYLES.errorBox}>
                  <AlertCircle className={STYLES.alertIcon} />
                  <span>{error}</span>
                </div>
              )}

              <div className={STYLES.grid2gap3}>
                <div>
                  <label className={STYLES.label}>Nombre *</label>
                  <div className={STYLES.inputWrap}>
                    <User className={STYLES.inputIcon} />
                    <input
                      name="nombre" required value={form.nombre} onChange={handleChange}
                      className={STYLES.inputWithIcon}
                    />
                  </div>
                </div>
                <div>
                  <label className={STYLES.label}>Apellido *</label>
                  <input
                    name="apellido" required value={form.apellido} onChange={handleChange}
                    className={STYLES.input}
                  />
                </div>
              </div>

              <div>
                <label className={STYLES.label}>
                  Teléfono <span className={STYLES.optionalLabel}>(opcional)</span>
                </label>
                <div className={STYLES.inputWrap}>
                  <Phone className={STYLES.inputIcon} />
                  <input
                    name="telefono" type="tel" value={form.telefono} onChange={handleChange}
                    placeholder="+56 9 XXXX XXXX"
                    className={STYLES.inputWithIcon}
                  />
                </div>
              </div>

              {invitacion.rol === 'doctor' && (
                <div>
                  <label className={STYLES.label}>Especialidad *</label>
                  <div className={STYLES.inputWrap}>
                    <select
                      name="especialidad" required value={form.especialidad} onChange={handleChange}
                      className={STYLES.select}
                    >
                      <option value="">Selecciona tu especialidad</option>
                      {ESPECIALIDADES_CHILE.map(e => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                    <ChevronDown className={STYLES.chevronDown} />
                  </div>
                  {form.especialidad === 'otra' && (
                    <input
                      name="especialidadPersonalizada"
                      placeholder="Escribe tu especialidad"
                      value={form.especialidadPersonalizada}
                      onChange={handleChange}
                      required
                      className={`mt-2 ${STYLES.input}`}
                    />
                  )}
                </div>
              )}

              <div>
                <label className={STYLES.label}>Contraseña *</label>
                <div className={STYLES.inputWrap}>
                  <Lock className={STYLES.inputIcon} />
                  <input
                    name="password" type={showPassword ? 'text' : 'password'} required
                    value={form.password} onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    className={STYLES.inputWithBtn}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(v => !v)}
                    className={STYLES.toggleBtn}
                  >
                    {showPassword ? <EyeOff className={STYLES.eyeIcon} /> : <Eye className={STYLES.eyeIcon} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={STYLES.label}>Confirmar contraseña *</label>
                <div className={STYLES.inputWrap}>
                  <Lock className={STYLES.inputIcon} />
                  <input
                    name="confirmPassword" type={showPassword ? 'text' : 'password'} required
                    value={form.confirmPassword} onChange={handleChange}
                    placeholder="Repite la contraseña"
                    className={STYLES.inputWithIcon}
                  />
                </div>
              </div>

              <div className={STYLES.actionsRow}>
                <button type="button" onClick={() => setPaso('codigo')} className={STYLES.backBtn}>
                  ← Atrás
                </button>
                <button type="submit" disabled={loading} className={STYLES.submitBtn}>
                  {loading ? 'Creando cuenta...' : 'Activar cuenta'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
