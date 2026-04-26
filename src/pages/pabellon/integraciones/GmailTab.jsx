import { useState } from 'react'
import { Mail, CheckCircle2, XCircle, Loader2, ExternalLink, ToggleLeft, ToggleRight, Unlink } from 'lucide-react'
import { toggleGmailPolling, disconnectGmail } from '@/services/integracionService'
import { tc } from '@/constants/theme'

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

function buildGmailAuthUrl(redirectUri) {
  const clientId = import.meta.env.VITE_GMAIL_CLIENT_ID
  if (!clientId) return null
  const csrf = crypto.randomUUID()
  sessionStorage.setItem('gmail_oauth_csrf', csrf)
  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         GMAIL_SCOPES,
    access_type:   'offline',
    prompt:        'consent',
    state:         csrf,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export default function GmailTab({ config, onRefresh, theme }) {
  const [toggling, setToggling]         = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const t = tc(theme)
  const isDark = theme === 'dark'

  const cardBg    = `${t.cardBg} ${t.border}`
  const labelCls  = t.textSecondary
  const valueCls  = t.textPrimary
  const divider   = t.border
  const btnPrimary = 'flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50'
  const btnDanger  = isDark
    ? 'flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-900/20 text-sm font-bold rounded-xl transition-all disabled:opacity-50'
    : 'flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 text-sm font-bold rounded-xl transition-all disabled:opacity-50'

  const redirectUri = `${window.location.origin}/pabellon/integraciones`
  const authUrl     = buildGmailAuthUrl(redirectUri)

  async function handleToggle() {
    setToggling(true)
    const { error } = await toggleGmailPolling(!config.gmail_polling_enabled)
    setToggling(false)
    if (!error) onRefresh()
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar Gmail? El polling se detendrá.')) return
    setDisconnecting(true)
    const { error } = await disconnectGmail()
    setDisconnecting(false)
    if (!error) onRefresh()
  }

  return (
    <div className="space-y-6">
      {/* Estado de conexión */}
      <div className={`rounded-2xl border p-5 ${cardBg}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.gmail_connected ? 'bg-green-100' : isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <Mail size={20} className={config.gmail_connected ? 'text-green-600' : isDark ? 'text-slate-400' : 'text-slate-400'} />
            </div>
            <div>
              <p className={`font-bold text-sm ${valueCls}`}>Cuenta Gmail</p>
              {config.gmail_connected
                ? <p className="text-sm text-green-600 font-semibold">{config.gmail_email}</p>
                : <p className={`text-sm ${labelCls}`}>No conectado</p>}
            </div>
          </div>
          {config.gmail_connected
            ? <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-1" />
            : <XCircle size={20} className={`shrink-0 mt-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`} />}
        </div>

        <div className={`mt-4 pt-4 border-t ${divider} flex flex-wrap items-center gap-3`}>
          {config.gmail_connected ? (
            <>
              {/* Toggle polling */}
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all disabled:opacity-50 ${
                  isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {toggling ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : config.gmail_polling_enabled ? (
                  <ToggleRight size={18} className="text-green-500" />
                ) : (
                  <ToggleLeft size={18} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
                )}
                {config.gmail_polling_enabled ? 'Polling activo' : 'Polling pausado'}
              </button>

              {/* Desconectar */}
              <button onClick={handleDisconnect} disabled={disconnecting} className={btnDanger}>
                {disconnecting ? <Loader2 size={15} className="animate-spin" /> : <Unlink size={15} />}
                Desconectar
              </button>
            </>
          ) : (
            authUrl ? (
              <a href={authUrl} className={btnPrimary}>
                <Mail size={15} />
                Conectar con Google
                <ExternalLink size={13} />
              </a>
            ) : (
              <p className="text-sm text-amber-500 font-semibold">
                Falta configurar VITE_GMAIL_CLIENT_ID en el entorno.
              </p>
            )
          )}
        </div>
      </div>

      {/* Info */}
      <div className={`rounded-2xl border p-5 space-y-3 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
        <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-blue-700'}`}>
          ¿Cómo funciona?
        </p>
        <ul className={`text-sm space-y-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <li>• Al conectar, el sistema leerá correos entrantes de esa cuenta Gmail cada 5 minutos.</li>
          <li>• Los correos aparecerán automáticamente en la sección <strong>Correos</strong> como mensajes externos.</li>
          <li>• Solo se leen correos no leídos; se marcan como leídos una vez importados.</li>
          <li>• Puedes pausar el polling sin desconectar la cuenta.</li>
        </ul>
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-blue-500'}`}>
          Requiere autorizar el permiso <em>gmail.modify</em> para leer y marcar correos.
        </p>
      </div>

      {/* Nota técnica para el administrador */}
      <div className={`rounded-2xl border p-5 ${isDark ? 'bg-amber-900/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
        <p className={`text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
          Configuración requerida (una vez)
        </p>
        <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
          En Google Cloud Console → OAuth 2.0 → Authorized redirect URIs, agrega:
        </p>
        <code className={`block mt-2 text-xs px-3 py-2 rounded-lg font-mono ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700'}`}>
          {window.location.origin}/pabellon/integraciones
        </code>
      </div>
    </div>
  )
}
