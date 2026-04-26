import { useState } from 'react'
import { createContactMessage } from '@/services/externalMessageService'
import { Stethoscope, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { sanitizeString } from '@/utils/sanitizeInput'

// ─── Datos ────────────────────────────────────────────────────────────────────
const ESPECIALIDADES = [
  'Cirugía General', 'Cirugía Cardiovascular', 'Cirugía Plástica',
  'Cirugía Ortopédica', 'Neurocirugía', 'Cirugía Oncológica',
  'Urología', 'Ginecología', 'Otorrinolaringología', 'Oftalmología', 'Otra',
]

const URGENCIA_OPTIONS = [
  { value: 'electiva', label: 'Electiva', active: 'border-green-400 text-green-700 bg-green-50' },
  { value: 'normal',   label: 'Normal',   active: 'border-blue-400 text-blue-700 bg-blue-50' },
  { value: 'urgente',  label: 'Urgente',  active: 'border-red-400 text-red-700 bg-red-50' },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FORM_INITIAL = {
  nombre_remitente: '', email_remitente: '', telefono_remitente: '',
  especialidad_remitente: '', institucion_remitente: '',
  asunto: '', mensaje: '', nombre_paciente: '', rut_paciente: '',
  tipo_cirugia: '', urgencia: 'normal',
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:        'min-h-screen bg-slate-50 py-8 px-4',
  successPage: 'min-h-screen bg-slate-50 flex items-center justify-center p-4',
  successCard: 'max-w-md w-full bg-white rounded-3xl shadow-xl p-8 sm:p-10 text-center',
  successIcon: 'w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6',
  form:        'bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6',
  sectionTitle:'text-xs font-black uppercase tracking-widest text-slate-400 mb-4',
  label:       'block text-xs font-bold text-slate-700 mb-1.5',
  input:       'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  textarea:    'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none',
  errorBox:    'flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold',
  submitBtn:   'w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-colors flex items-center justify-center gap-2',
  spinner:     'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin',
  urgencyBtn:  'flex-1 py-2 rounded-xl text-xs font-black uppercase border-2 transition-all',
  urgencyOff:  'border-slate-200 text-slate-500 bg-white hover:border-slate-300',
  iconGreen:   'w-8 h-8 text-green-600',
  successTitle:'text-2xl font-black text-slate-900 mb-3',
  successText: 'text-slate-600 text-sm mb-6',
  resetBtn:    'px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors',
  container:   'max-w-2xl mx-auto',
  headerWrap:  'text-center mb-8',
  logoCard:    'inline-flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-200 mb-4',
  logoIconWrap:'bg-blue-600 p-2 rounded-xl',
  stethoscope: 'text-white w-5 h-5',
  logoTextWrap:'text-left',
  brandName:   'text-base font-black text-slate-900 uppercase tracking-tight leading-none',
  portalLabel: 'text-[10px] font-bold uppercase tracking-widest text-slate-400',
  pageTitle:   'text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight',
  pageSubtitle:'text-slate-500 text-sm mt-2',
  grid2:       'grid grid-cols-1 sm:grid-cols-2 gap-4',
  colSpan2:    'sm:col-span-2',
  sectionSep:  'border-t border-slate-100 pt-6',
  spaceY4:     'space-y-4',
  flexGap3:    'flex gap-3',
  charCount:   'text-xs text-slate-400 text-right mt-1',
  errorIconSm: 'w-4 h-4 flex-shrink-0',
  sendIcon:    'w-4 h-4',
  footer:      'text-center text-xs text-slate-400',
}

export default function ContactoExterno() {
  const [form, setForm] = useState(FORM_INITIAL)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: sanitizeString(value) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.nombre_remitente.trim() || !form.email_remitente.trim() || !form.asunto.trim() || !form.mensaje.trim()) {
      setError('Por favor complete todos los campos obligatorios.')
      return
    }
    if (!EMAIL_REGEX.test(form.email_remitente)) {
      setError('Por favor ingrese un correo electrónico válido.')
      return
    }

    setEnviando(true)
    try {
      const { error: dbError } = await createContactMessage({
        nombre_remitente:       form.nombre_remitente.trim(),
        email_remitente:        form.email_remitente.trim().toLowerCase(),
        telefono_remitente:     form.telefono_remitente.trim() || null,
        especialidad_remitente: form.especialidad_remitente || null,
        institucion_remitente:  form.institucion_remitente.trim() || null,
        asunto:                 form.asunto.trim(),
        mensaje:                form.mensaje.trim(),
        nombre_paciente:        form.nombre_paciente.trim() || null,
        rut_paciente:           form.rut_paciente.trim() || null,
        tipo_cirugia:           form.tipo_cirugia.trim() || null,
        urgencia:               form.urgencia,
      })
      if (dbError) throw dbError
      setEnviado(true)
    } catch {
      setError('Error al enviar el mensaje. Por favor intente nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className={STYLES.successPage}>
        <div className={STYLES.successCard}>
          <div className={STYLES.successIcon}>
            <CheckCircle2 className={STYLES.iconGreen} />
          </div>
          <h2 className={STYLES.successTitle}>Mensaje enviado</h2>
          <p className={STYLES.successText}>
            Su solicitud fue recibida correctamente. El personal de pabellón se comunicará
            a la brevedad para coordinar la disponibilidad horaria.
          </p>
          <button
            onClick={() => { setEnviado(false); setForm(FORM_INITIAL) }}
            className={STYLES.resetBtn}
          >
            Enviar otro mensaje
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={STYLES.page}>
      <div className={STYLES.container}>
        {/* Header */}
        <div className={STYLES.headerWrap}>
          <div className={STYLES.logoCard}>
            <div className={STYLES.logoIconWrap}>
              <Stethoscope className={STYLES.stethoscope} />
            </div>
            <div className={STYLES.logoTextWrap}>
              <h1 className={STYLES.brandName}>SurgicalHUB</h1>
              <span className={STYLES.portalLabel}>Portal Clínico</span>
            </div>
          </div>
          <h2 className={STYLES.pageTitle}>
            Solicitud de Hora Quirúrgica
          </h2>
          <p className={STYLES.pageSubtitle}>
            Complete el formulario y el equipo de pabellón se contactará para ofrecer disponibilidad horaria.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={STYLES.form}>
          {/* Datos del médico */}
          <div>
            <h3 className={STYLES.sectionTitle}>Datos del médico solicitante</h3>
            <div className={STYLES.grid2}>
              <div>
                <label className={STYLES.label}>Nombre completo *</label>
                <input type="text" name="nombre_remitente" value={form.nombre_remitente}
                  onChange={handleChange} placeholder="Dr. Juan Pérez"
                  className={STYLES.input} required maxLength={120} />
              </div>
              <div>
                <label className={STYLES.label}>Correo electrónico *</label>
                <input type="email" name="email_remitente" value={form.email_remitente}
                  onChange={handleChange} placeholder="doctor@clinica.cl"
                  className={STYLES.input} required maxLength={150} />
              </div>
              <div>
                <label className={STYLES.label}>Teléfono de contacto</label>
                <input type="tel" name="telefono_remitente" value={form.telefono_remitente}
                  onChange={handleChange} placeholder="+56 9 1234 5678"
                  className={STYLES.input} maxLength={30} />
              </div>
              <div>
                <label className={STYLES.label}>Especialidad</label>
                <select name="especialidad_remitente" value={form.especialidad_remitente}
                  onChange={handleChange} className={STYLES.input}>
                  <option value="">Seleccionar especialidad</option>
                  {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className={STYLES.colSpan2}>
                <label className={STYLES.label}>Institución / Clínica de origen</label>
                <input type="text" name="institucion_remitente" value={form.institucion_remitente}
                  onChange={handleChange} placeholder="Hospital / Clínica de origen"
                  className={STYLES.input} maxLength={150} />
              </div>
            </div>
          </div>

          {/* Datos del paciente */}
          <div className={STYLES.sectionSep}>
            <h3 className={STYLES.sectionTitle}>Datos del paciente (opcional)</h3>
            <div className={STYLES.grid2}>
              <div>
                <label className={STYLES.label}>Nombre del paciente</label>
                <input type="text" name="nombre_paciente" value={form.nombre_paciente}
                  onChange={handleChange} placeholder="Nombre Apellido"
                  className={STYLES.input} maxLength={120} />
              </div>
              <div>
                <label className={STYLES.label}>RUT del paciente</label>
                <input type="text" name="rut_paciente" value={form.rut_paciente}
                  onChange={handleChange} placeholder="12.345.678-9"
                  className={STYLES.input} maxLength={20} />
              </div>
              <div className={STYLES.colSpan2}>
                <label className={STYLES.label}>Tipo de cirugía / Procedimiento</label>
                <input type="text" name="tipo_cirugia" value={form.tipo_cirugia}
                  onChange={handleChange} placeholder="Ej: Colecistectomía laparoscópica"
                  className={STYLES.input} maxLength={200} />
              </div>
            </div>
          </div>

          {/* Mensaje */}
          <div className={STYLES.sectionSep}>
            <h3 className={STYLES.sectionTitle}>Mensaje</h3>
            <div className={STYLES.spaceY4}>
              <div>
                <label className={STYLES.label}>Urgencia</label>
                <div className={STYLES.flexGap3}>
                  {URGENCIA_OPTIONS.map(op => (
                    <button
                      key={op.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, urgencia: op.value }))}
                      className={`${STYLES.urgencyBtn} ${form.urgencia === op.value ? op.active : STYLES.urgencyOff}`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={STYLES.label}>Asunto *</label>
                <input type="text" name="asunto" value={form.asunto}
                  onChange={handleChange} placeholder="Motivo principal del contacto"
                  className={STYLES.input} required maxLength={200} />
              </div>
              <div>
                <label className={STYLES.label}>Mensaje *</label>
                <textarea
                  name="mensaje" value={form.mensaje} onChange={handleChange}
                  placeholder="Describa detalladamente su solicitud, disponibilidad horaria preferida u otros antecedentes relevantes..."
                  rows={5} className={STYLES.textarea} required maxLength={2000}
                />
                <p className={STYLES.charCount}>{form.mensaje.length}/2000</p>
              </div>
            </div>
          </div>

          {error && (
            <div className={STYLES.errorBox}>
              <AlertCircle className={STYLES.errorIconSm} />
              {error}
            </div>
          )}

          <button type="submit" disabled={enviando} className={STYLES.submitBtn}>
            {enviando ? (
              <><div className={STYLES.spinner} />Enviando...</>
            ) : (
              <><Send className={STYLES.sendIcon} />Enviar solicitud</>
            )}
          </button>

          <p className={STYLES.footer}>
            Sus datos serán tratados de forma confidencial y solo serán utilizados para
            coordinar la atención médica.
          </p>
        </form>
      </div>
    </div>
  )
}
