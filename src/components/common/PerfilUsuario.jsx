import { useState, useEffect } from 'react'
import { User, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/config/supabase'
import { getCurrentUser } from '@/services/authService'

const STYLES = {
  card:      'bg-white rounded-2xl border border-slate-200 p-6',
  title:     'text-sm font-black text-slate-700 uppercase tracking-widest mb-1',
  desc:      'text-xs text-slate-500 mb-4',
  grid:      'grid grid-cols-1 sm:grid-cols-2 gap-3',
  label:     'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1',
  input:     'w-full border-2 border-slate-100 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-50',
  inputFull: 'w-full border-2 border-slate-100 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-50 col-span-full',
  emailNote: 'text-[10px] text-slate-400 mt-1',
  errorBox:  'bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2',
  successBox:'bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2',
  submitBtn: 'mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-colors',
}

export default function PerfilUsuario() {
  const [form, setForm]       = useState({ nombre: '', apellido: '', especialidad: '', telefono: '', email: '' })
  const [role, setRole]       = useState(null)
  const [userId, setUserId]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const { user } = await getCurrentUser()
      if (!user) return
      setUserId(user.id)

      const { data: userData } = await supabase
        .from('users')
        .select('role, nombre')
        .eq('id', user.id)
        .maybeSingle()

      const userRole = userData?.role ?? null
      setRole(userRole)

      if (userRole === 'doctor') {
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('nombre, apellido, especialidad, telefono')
          .eq('user_id', user.id)
          .maybeSingle()

        setForm({
          nombre:       doctorData?.nombre       ?? '',
          apellido:     doctorData?.apellido     ?? '',
          especialidad: doctorData?.especialidad ?? '',
          telefono:     doctorData?.telefono     ?? '',
          email:        user.email               ?? '',
        })
      } else {
        setForm({
          nombre:       userData?.nombre ?? '',
          apellido:     '',
          especialidad: '',
          telefono:     '',
          email:        user.email ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    setError(null)

    let updateError = null

    if (role === 'doctor') {
      const { error: err } = await supabase
        .from('doctors')
        .update({
          nombre:       form.nombre.trim(),
          apellido:     form.apellido.trim(),
          especialidad: form.especialidad.trim(),
          telefono:     form.telefono.trim() || null,
        })
        .eq('user_id', userId)
      updateError = err
    } else {
      const { error: err } = await supabase
        .from('users')
        .update({ nombre: form.nombre.trim() })
        .eq('id', userId)
      updateError = err
    }

    setSaving(false)

    if (updateError) {
      setError('No se pudo guardar el perfil. ' + (updateError.message ?? ''))
      return
    }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  }

  if (loading) {
    return (
      <div className={STYLES.card}>
        <div className="flex items-center gap-2 animate-pulse">
          <div className="w-4 h-4 bg-slate-200 rounded" />
          <div className="h-3 w-32 bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  const isDoctor = role === 'doctor'

  return (
    <div className={STYLES.card}>
      <div className="flex items-center gap-2 mb-1">
        <User className="w-4 h-4 text-blue-600" />
        <p className={STYLES.title}>Perfil Personal</p>
      </div>
      <p className={STYLES.desc}>
        {isDoctor ? 'Actualiza tu información como médico.' : 'Actualiza tu nombre de usuario.'}
      </p>

      {error   && <div className={`${STYLES.errorBox} mb-3`}><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</div>}
      {success && <div className={`${STYLES.successBox} mb-3`}><CheckCircle2 className="w-3.5 h-3.5 shrink-0" />Perfil actualizado correctamente.</div>}

      <form onSubmit={handleSubmit}>
        <div className={STYLES.grid}>
          <div>
            <label className={STYLES.label}>Nombre</label>
            <input type="text" value={form.nombre} onChange={handleChange('nombre')} className={STYLES.input} placeholder="Tu nombre" />
          </div>

          {isDoctor && (
            <>
              <div>
                <label className={STYLES.label}>Apellido</label>
                <input type="text" value={form.apellido} onChange={handleChange('apellido')} className={STYLES.input} placeholder="Tu apellido" />
              </div>
              <div>
                <label className={STYLES.label}>Especialidad</label>
                <input type="text" value={form.especialidad} onChange={handleChange('especialidad')} className={STYLES.input} placeholder="Ej: Traumatología" />
              </div>
              <div>
                <label className={STYLES.label}>Teléfono (WhatsApp)</label>
                <input type="tel" value={form.telefono} onChange={handleChange('telefono')} className={STYLES.input} placeholder="+56 9 1234 5678" />
              </div>
            </>
          )}

          <div className={isDoctor ? 'sm:col-span-2' : ''}>
            <label className={STYLES.label}>Email</label>
            <input type="email" value={form.email} disabled className={STYLES.input} />
            <p className={STYLES.emailNote}>Para cambiar el email contáctanos.</p>
          </div>
        </div>

        <button type="submit" disabled={saving} className={STYLES.submitBtn}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
