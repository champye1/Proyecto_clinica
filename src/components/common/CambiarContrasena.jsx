import { useState } from 'react'
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { updatePassword } from '@/services/authService'
import { validatePasswordStrength, getPasswordStrengthLabel } from '@/utils/passwordStrength'

const STYLES = {
  card:       'bg-white rounded-2xl border border-slate-200 p-6',
  title:      'text-sm font-black text-slate-700 uppercase tracking-widest mb-1',
  desc:       'text-xs text-slate-500 mb-4',
  fieldWrap:  'relative',
  label:      'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1',
  input:      'w-full border-2 border-slate-100 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all pr-10',
  eyeBtn:     'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600',
  strengthBar:'h-1.5 rounded-full transition-all',
  strengthRow:'flex items-center gap-2 mt-1.5 mb-3',
  strengthLbl:'text-[10px] font-bold',
  errorList:  'text-[10px] text-red-500 space-y-0.5 mb-3',
  errorBox:   'bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2',
  successBox: 'bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2',
  submitBtn:  'mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-colors',
  space:      'space-y-3',
}

const BARS = [0, 1, 2, 3]
const BAR_COLORS = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']

export default function CambiarContrasena() {
  const [form, setForm]     = useState({ nueva: '', confirmar: '' })
  const [show, setShow]     = useState({ nueva: false, confirmar: false })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const [success, setSuccess] = useState(false)

  const strength = validatePasswordStrength(form.nueva)
  const { label: strengthLabel, color: strengthColor } = getPasswordStrengthLabel(strength.score)

  const toggle = (field) => setShow(s => ({ ...s, [field]: !s[field] }))

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nueva) { setError('Ingresa la nueva contraseña.'); return }
    if (!strength.isValid) { setError('La contraseña no cumple los requisitos de seguridad.'); return }
    if (form.nueva !== form.confirmar) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    setError(null)
    const { error: updateError } = await updatePassword(form.nueva)
    setLoading(false)

    if (updateError) {
      setError('No se pudo cambiar la contraseña. ' + (updateError.message ?? ''))
      return
    }
    setSuccess(true)
    setForm({ nueva: '', confirmar: '' })
    setTimeout(() => setSuccess(false), 5000)
  }

  return (
    <div className={STYLES.card}>
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="w-4 h-4 text-blue-600" />
        <p className={STYLES.title}>Cambiar Contraseña</p>
      </div>
      <p className={STYLES.desc}>Elige una contraseña segura de al menos 12 caracteres.</p>

      {error   && <div className={`${STYLES.errorBox} mb-3`}><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</div>}
      {success && <div className={`${STYLES.successBox} mb-3`}><CheckCircle2 className="w-3.5 h-3.5 shrink-0" />Contraseña actualizada correctamente.</div>}

      <form onSubmit={handleSubmit} className={STYLES.space}>
        {/* Nueva contraseña */}
        <div>
          <label className={STYLES.label}>Nueva contraseña</label>
          <div className={STYLES.fieldWrap}>
            <input
              type={show.nueva ? 'text' : 'password'}
              value={form.nueva}
              onChange={handleChange('nueva')}
              className={STYLES.input}
              placeholder="Mínimo 12 caracteres"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => toggle('nueva')} className={STYLES.eyeBtn}>
              {show.nueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Barra de fortaleza */}
          {form.nueva && (
            <>
              <div className={STYLES.strengthRow}>
                <div className="flex gap-1 flex-1">
                  {BARS.map(i => (
                    <div
                      key={i}
                      className={`flex-1 h-1.5 rounded-full transition-all ${i < strength.score ? strengthColor : 'bg-slate-100'}`}
                    />
                  ))}
                </div>
                <span className={`${STYLES.strengthLbl} ${strength.score >= 4 ? 'text-green-600' : 'text-slate-400'}`}>
                  {strengthLabel}
                </span>
              </div>
              {strength.errors.length > 0 && (
                <ul className={STYLES.errorList}>
                  {strength.errors.map(e => <li key={e}>• {e}</li>)}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label className={STYLES.label}>Confirmar contraseña</label>
          <div className={STYLES.fieldWrap}>
            <input
              type={show.confirmar ? 'text' : 'password'}
              value={form.confirmar}
              onChange={handleChange('confirmar')}
              className={STYLES.input}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => toggle('confirmar')} className={STYLES.eyeBtn}>
              {show.confirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.confirmar && form.nueva !== form.confirmar && (
            <p className="text-[10px] text-red-500 mt-1">Las contraseñas no coinciden.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !form.nueva || !form.confirmar}
          className={STYLES.submitBtn}
        >
          {loading ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  )
}
