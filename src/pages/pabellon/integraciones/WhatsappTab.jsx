import { useState, useEffect } from 'react'
import { MessageCircle, CheckCircle2, XCircle, Eye, EyeOff, Loader2, Send } from 'lucide-react'
import { saveTwilioConfig, testWhatsapp } from '@/services/integracionService'
import { tc } from '@/constants/theme'

export default function WhatsappTab({ config, onRefresh, theme }) {
  const [form, setForm]             = useState({ accountSid: '', authToken: '', whatsappFrom: '', enabled: false })
  const [showToken, setShowToken]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [testPhone, setTestPhone]   = useState('')
  const [testing, setTesting]       = useState(false)
  const [testMsg, setTestMsg]       = useState(null)
  const [saveMsg, setSaveMsg]       = useState(null)

  useEffect(() => {
    if (config) {
      setForm(f => ({
        ...f,
        accountSid:   config.twilio_account_sid ?? '',
        whatsappFrom: config.twilio_whatsapp_from ?? '',
        enabled:      config.whatsapp_enabled ?? false,
      }))
    }
  }, [config])

  const t = tc(theme)
  const isDark = theme === 'dark'

  const cardBg   = `${t.cardBg} ${t.border}`
  const labelCls = t.textSecondary
  const valueCls = t.textPrimary
  const divider  = t.border
  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${t.inputBg} ${t.borderInput} ${t.textPrimary} placeholder-slate-400`

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    const { error } = await saveTwilioConfig({
      accountSid:   form.accountSid,
      authToken:    form.authToken,
      whatsappFrom: form.whatsappFrom,
      enabled:      form.enabled,
    })
    setSaving(false)
    if (error) {
      setSaveMsg({ ok: false, text: 'Error al guardar. Intenta de nuevo.' })
    } else {
      setSaveMsg({ ok: true, text: 'Configuración guardada.' })
      setForm(f => ({ ...f, authToken: '' }))
      onRefresh()
    }
    setTimeout(() => setSaveMsg(null), 4000)
  }

  async function handleTest() {
    const phone = testPhone.trim()
    if (!phone) return
    setTesting(true)
    setTestMsg(null)
    const { error } = await testWhatsapp(phone, config?.clinica_id)
    setTesting(false)
    if (error) {
      setTestMsg({ ok: false, text: `Error: ${error.message}` })
    } else {
      setTestMsg({ ok: true, text: 'Mensaje enviado correctamente.' })
    }
    setTimeout(() => setTestMsg(null), 5000)
  }

  return (
    <div className="space-y-6">
      {/* Estado */}
      <div className={`rounded-2xl border p-5 flex items-center gap-3 ${cardBg}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config?.twilio_configured ? 'bg-green-100' : isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <MessageCircle size={20} className={config?.twilio_configured ? 'text-green-600' : isDark ? 'text-slate-400' : 'text-slate-400'} />
        </div>
        <div className="flex-1">
          <p className={`font-bold text-sm ${valueCls}`}>WhatsApp (Twilio)</p>
          <p className={`text-sm ${config?.twilio_configured ? 'text-green-600 font-semibold' : labelCls}`}>
            {config?.twilio_configured ? `Configurado${config.whatsapp_enabled ? ' · activo' : ' · pausado'}` : 'No configurado'}
          </p>
        </div>
        {config?.twilio_configured
          ? <CheckCircle2 size={20} className="text-green-500" />
          : <XCircle size={20} className={isDark ? 'text-slate-500' : 'text-slate-300'} />}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSave} className={`rounded-2xl border p-5 space-y-4 ${cardBg}`}>
        <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Credenciales Twilio
        </p>

        <div className="space-y-1">
          <label className={`text-xs font-bold ${labelCls}`} htmlFor="twilio-sid">Account SID</label>
          <input
            id="twilio-sid"
            type="text"
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className={inputCls}
            value={form.accountSid}
            onChange={e => setForm(f => ({ ...f, accountSid: e.target.value }))}
          />
        </div>

        <div className="space-y-1">
          <label className={`text-xs font-bold ${labelCls}`} htmlFor="twilio-token">Auth Token</label>
          <div className="relative">
            <input
              id="twilio-token"
              type={showToken ? 'text' : 'password'}
              placeholder={config?.twilio_configured ? '••••••••••••••••••••••• (dejar vacío para no cambiar)' : 'Pega el Auth Token aquí'}
              className={`${inputCls} pr-10`}
              value={form.authToken}
              onChange={e => setForm(f => ({ ...f, authToken: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowToken(v => !v)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className={`text-xs font-bold ${labelCls}`} htmlFor="twilio-from">Número WhatsApp From</label>
          <input
            id="twilio-from"
            type="text"
            placeholder="whatsapp:+14155238886"
            className={inputCls}
            value={form.whatsappFrom}
            onChange={e => setForm(f => ({ ...f, whatsappFrom: e.target.value }))}
          />
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Formato: <code>whatsapp:+NÚMERO</code>. Usa el sandbox de Twilio o tu número aprobado.
          </p>
        </div>

        <div className={`flex items-center gap-3 pt-2 border-t ${divider}`}>
          <label className={`flex items-center gap-2 cursor-pointer text-sm font-semibold ${labelCls}`}>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              className="w-4 h-4 rounded accent-blue-600"
            />
            Activar envío de WhatsApp
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            Guardar configuración
          </button>

          {saveMsg && (
            <p className={`text-sm font-semibold ${saveMsg.ok ? 'text-green-500' : 'text-red-500'}`}>
              {saveMsg.text}
            </p>
          )}
        </div>
      </form>

      {/* Test de conexión */}
      {config?.twilio_configured && (
        <div className={`rounded-2xl border p-5 space-y-3 ${cardBg}`}>
          <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Probar conexión
          </p>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="+56912345678"
              value={testPhone}
              onChange={e => setTestPhone(e.target.value)}
              className={`${inputCls} flex-1`}
              aria-label="Número de teléfono para prueba"
            />
            <button
              onClick={handleTest}
              disabled={testing || !testPhone.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Enviar
            </button>
          </div>
          {testMsg && (
            <p className={`text-sm font-semibold ${testMsg.ok ? 'text-green-500' : 'text-red-500'}`}>
              {testMsg.text}
            </p>
          )}
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Envía un mensaje de prueba al número indicado usando las credenciales guardadas.
          </p>
        </div>
      )}

      {/* Info Twilio */}
      <div className={`rounded-2xl border p-5 space-y-2 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
        <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-blue-700'}`}>
          ¿Dónde encuentro mis credenciales?
        </p>
        <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <li>1. Inicia sesión en <strong>console.twilio.com</strong></li>
          <li>2. En el dashboard, copia el <strong>Account SID</strong> y el <strong>Auth Token</strong>.</li>
          <li>3. Para el sandbox de WhatsApp: Messaging → Try it out → Send a WhatsApp message.</li>
          <li>4. Para producción: necesitas un número aprobado por Meta/WhatsApp.</li>
        </ul>
      </div>
    </div>
  )
}
