import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, CheckCircle2, XCircle, Plug2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'
import { getMyClinicIntegrations, exchangeGmailCode } from '@/services/integracionService'
import GmailTab from './GmailTab'
import WhatsappTab from './WhatsappTab'

export default function Integraciones() {
  const { theme } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('gmail')
  const [oauthStatus, setOauthStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [oauthMsg, setOauthMsg]     = useState('')

  const { data: config, isLoading, refetch } = useQuery({
    queryKey: ['clinic-integrations'],
    queryFn: async () => {
      const { data, error } = await getMyClinicIntegrations()
      if (error) throw error
      return data
    },
  })

  // Handle Gmail OAuth callback — Google redirects back with ?code=...&state=...
  useEffect(() => {
    const code  = searchParams.get('code')
    const state = searchParams.get('state')
    if (!code || !state) return

    const storedCsrf = sessionStorage.getItem('gmail_oauth_csrf')
    setSearchParams({}, { replace: true })
    sessionStorage.removeItem('gmail_oauth_csrf')

    if (state !== storedCsrf) {
      setOauthStatus('error')
      setOauthMsg('Error de seguridad: estado CSRF inválido.')
      setTimeout(() => setOauthStatus(null), 6000)
      return
    }

    setOauthStatus('loading')
    const redirectUri = `${window.location.origin}/pabellon/integraciones`
    exchangeGmailCode(code, redirectUri).then(({ error }) => {
      if (error) {
        setOauthStatus('error')
        setOauthMsg(`Error al conectar Gmail: ${error.message}`)
      } else {
        setOauthStatus('success')
        setOauthMsg('¡Gmail conectado correctamente!')
        setActiveTab('gmail')
        refetch()
      }
      setTimeout(() => setOauthStatus(null), 5000)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — run only on mount

  const t = tc(theme)
  const isDark = theme === 'dark'
  const titleCls    = t.textPrimary
  const subtitleCls = t.textMuted
  const tabBarCls   = t.badgeBg
  const tabActiveCls  = isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900 shadow'
  const tabIdleCls    = `${t.textMuted} ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.surfaceBg}`}>
          <Plug2 size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
        </div>
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${titleCls}`}>Integraciones</h1>
          <p className={`text-sm ${subtitleCls}`}>
            Conecta Gmail y WhatsApp para recibir y enviar comunicaciones automáticas.
          </p>
        </div>
      </div>

      {/* OAuth callback feedback */}
      {oauthStatus === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
          <Loader2 size={15} className="animate-spin" />
          Conectando Gmail…
        </div>
      )}
      {oauthStatus === 'success' && (
        <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
          <CheckCircle2 size={15} />
          {oauthMsg}
        </div>
      )}
      {oauthStatus === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-500 font-semibold">
          <XCircle size={15} />
          {oauthMsg}
        </div>
      )}

      {/* Tab selector */}
      <div className={`flex gap-1 p-1 rounded-xl ${tabBarCls}`}>
        {[
          { key: 'gmail',    label: 'Gmail' },
          { key: 'whatsapp', label: 'WhatsApp' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === key ? tabActiveCls : tabIdleCls
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      ) : config ? (
        activeTab === 'gmail'
          ? <GmailTab    config={config} onRefresh={refetch} theme={theme} />
          : <WhatsappTab config={config} onRefresh={refetch} theme={theme} />
      ) : null}
    </div>
  )
}
