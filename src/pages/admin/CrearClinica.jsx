import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, CheckCircle2, AlertCircle } from 'lucide-react'
import { fetchPlans, createClinic } from '@/services/adminService'
import { sanitizeString } from '@/utils/sanitizeInput'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:         'space-y-8 max-w-2xl',
  header:       'space-y-1',
  title:        'text-2xl font-black text-white uppercase tracking-tighter',
  subtitle:     'text-slate-400 text-sm',
  card:         'bg-slate-800 border border-slate-700 rounded-2xl p-8',
  form:         'space-y-5',
  grid2:        'grid grid-cols-1 sm:grid-cols-2 gap-5',
  label:        'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5',
  input:        'w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors',
  select:       'w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:outline-none transition-colors',
  divider:      'border-t border-slate-700',
  sectionTitle: 'text-xs font-black text-slate-400 uppercase tracking-widest mt-2',
  submitBtn:    'w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors',
  successBox:   'bg-emerald-900/30 border border-emerald-700 rounded-xl p-5 flex items-start gap-3',
  successIcon:  'w-5 h-5 text-emerald-400 mt-0.5 shrink-0',
  successText:  'text-emerald-300 text-sm font-bold',
  successSub:   'text-emerald-400/70 text-xs mt-1',
  errorBox:     'bg-red-900/30 border border-red-700 rounded-xl p-4 flex items-start gap-3',
  errorIcon:    'w-5 h-5 text-red-400 mt-0.5 shrink-0',
  errorText:    'text-red-300 text-sm font-bold',
  codeBox:      'mt-3 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3',
  codeLabel:    'text-[10px] text-slate-500 uppercase tracking-widest font-bold',
  codeValue:    'text-blue-400 font-black text-lg tracking-widest mt-1',
}

const REGIONES_CHILE = [
  'Región Metropolitana', 'Valparaíso', 'Biobío', 'La Araucanía',
  'Los Lagos', 'Maule', 'O\'Higgins', 'Coquimbo', 'Los Ríos', 'Antofagasta',
  'Atacama', 'Tarapacá', 'Arica y Parinacota', 'Ñuble', 'Aysén', 'Magallanes',
]

const EMPTY_FORM = {
  nombre:    '',
  rut:       '',
  ciudad:    '',
  region:    'Región Metropolitana',
  direccion: '',
  telefono:  '',
  email_contacto: '',
  plan_id:   '',
  trial_dias: 14,
}

export default function CrearClinica() {
  const queryClient = useQueryClient()
  const [form, setForm]     = useState(EMPTY_FORM)
  const [resultado, setResultado] = useState(null)

  const { data: planes = [] } = useQuery({
    queryKey: ['planes-list'],
    queryFn: async () => {
      const { data } = await fetchPlans()
      return data ?? []
    },
  })

  const crearClinica = useMutation({
    mutationFn: async (formData) => {
      const { data, error } = await createClinic({
        p_nombre:         formData.nombre,
        p_rut:            formData.rut || null,
        p_ciudad:         formData.ciudad,
        p_region:         formData.region,
        p_direccion:      formData.direccion || null,
        p_telefono:       formData.telefono || null,
        p_email_contacto: formData.email_contacto || null,
        p_plan_id:        formData.plan_id || null,
        p_trial_dias:     Number(formData.trial_dias),
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'Error al crear clínica')
      return data
    },
    onSuccess: (data) => {
      setResultado({ ok: true, data })
      setForm(EMPTY_FORM)
      queryClient.invalidateQueries({ queryKey: ['admin-clinicas'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (err) => {
      setResultado({ ok: false, message: err.message })
    },
  })

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: sanitizeString(e.target.value) }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setResultado(null)
    if (!form.nombre.trim() || !form.ciudad.trim()) return
    crearClinica.mutate(form)
  }

  return (
    <div className={STYLES.page}>
      <div className={STYLES.header}>
        <h1 className={STYLES.title}>Crear Clínica</h1>
        <p className={STYLES.subtitle}>Registra una nueva clínica en SurgicalHUB</p>
      </div>

      {resultado?.ok && (
        <div className={STYLES.successBox}>
          <CheckCircle2 className={STYLES.successIcon} />
          <div>
            <p className={STYLES.successText}>Clínica creada exitosamente</p>
            <p className={STYLES.successSub}>La clínica ya está disponible en el panel global.</p>
            {resultado.data?.codigo_acceso && (
              <div className={STYLES.codeBox}>
                <p className={STYLES.codeLabel}>Código de acceso para el admin de la clínica</p>
                <p className={STYLES.codeValue}>{resultado.data.codigo_acceso}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {resultado?.ok === false && (
        <div className={STYLES.errorBox}>
          <AlertCircle className={STYLES.errorIcon} />
          <p className={STYLES.errorText}>{resultado.message}</p>
        </div>
      )}

      <div className={STYLES.card}>
        <form onSubmit={handleSubmit} className={STYLES.form}>
          {/* Datos básicos */}
          <p className={STYLES.sectionTitle}>Datos de la clínica</p>

          <div>
            <label className={STYLES.label}>Nombre de la clínica *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={set('nombre')}
              className={STYLES.input}
              placeholder="Clínica Las Condes"
              required
            />
          </div>

          <div className={STYLES.grid2}>
            <div>
              <label className={STYLES.label}>RUT clínica</label>
              <input
                type="text"
                value={form.rut}
                onChange={set('rut')}
                className={STYLES.input}
                placeholder="12.345.678-9"
              />
            </div>
            <div>
              <label className={STYLES.label}>Teléfono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={set('telefono')}
                className={STYLES.input}
                placeholder="+56 2 2345 6789"
              />
            </div>
          </div>

          <div>
            <label className={STYLES.label}>Email de contacto</label>
            <input
              type="email"
              value={form.email_contacto}
              onChange={set('email_contacto')}
              className={STYLES.input}
              placeholder="admin@clinica.cl"
            />
          </div>

          {/* Ubicación */}
          <hr className={STYLES.divider} />
          <p className={STYLES.sectionTitle}>Ubicación</p>

          <div className={STYLES.grid2}>
            <div>
              <label className={STYLES.label}>Ciudad *</label>
              <input
                type="text"
                value={form.ciudad}
                onChange={set('ciudad')}
                className={STYLES.input}
                placeholder="Santiago"
                required
              />
            </div>
            <div>
              <label className={STYLES.label}>Región</label>
              <select
                value={form.region}
                onChange={set('region')}
                className={STYLES.select}
              >
                {REGIONES_CHILE.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={STYLES.label}>Dirección</label>
            <input
              type="text"
              value={form.direccion}
              onChange={set('direccion')}
              className={STYLES.input}
              placeholder="Av. Apoquindo 4501, piso 3"
            />
          </div>

          {/* Plan */}
          <hr className={STYLES.divider} />
          <p className={STYLES.sectionTitle}>Plan y acceso</p>

          <div className={STYLES.grid2}>
            <div>
              <label className={STYLES.label}>Plan</label>
              <select
                value={form.plan_id}
                onChange={set('plan_id')}
                className={STYLES.select}
              >
                <option value="">Solo trial</option>
                {planes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — ${p.precio_mensual_usd}/mes
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={STYLES.label}>Días de trial</label>
              <input
                type="number"
                min="1"
                max="90"
                value={form.trial_dias}
                onChange={(e) => setForm(f => ({ ...f, trial_dias: Number(e.target.value) }))}
                className={STYLES.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={crearClinica.isPending || !form.nombre.trim() || !form.ciudad.trim()}
            className={STYLES.submitBtn}
          >
            {crearClinica.isPending ? 'Creando...' : 'Crear Clínica'}
          </button>
        </form>
      </div>
    </div>
  )
}
