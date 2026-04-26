import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react'
import { getSession, onAuthStateChange, registerClinica, resendConfirmation } from '@/services/onboardingService'
import { sanitizeString, safeParseJSON } from '@/utils/sanitizeInput'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:         'min-h-screen flex items-center justify-center bg-white p-6',
  contentBox:   'w-full max-w-md text-center',
  iconBox:      'flex justify-center mb-6',
  iconCircle:   'w-16 h-16 rounded-2xl flex items-center justify-center',
  iconAmber:    'bg-amber-100',
  iconRed:      'bg-red-100',
  iconBlue:     'bg-blue-100',
  title:        'text-2xl font-bold text-slate-900 mb-3',
  subtitle:     'text-sm text-slate-500 mb-8',
  primaryBtn:   'flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors',
  ghostBtn:     'text-sm text-slate-400 hover:text-slate-600 transition-colors',
  successText:  'text-green-600 font-medium text-sm',
  spinner:      'w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin',
  iconAmberLg:  'w-8 h-8 text-amber-500',
  btnsCol:      'flex flex-col gap-3',
  iconRedLg:    'w-8 h-8 text-red-500',
  errorText:    'text-sm text-slate-500 mb-6',
  backBtn:      'px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors',
  iconBlueLg:   'w-8 h-8 text-blue-600 animate-pulse',
  loadingText:  'text-slate-400 text-sm',
  spinnerRow:   'mt-6 flex justify-center',
}

export default function ConfirmarEmail() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('completing') // completing | error | expired
  const [error, setError] = useState(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const errorCode        = params.get('error_code')
      const errorDescription = params.get('error_description')

      if (errorCode === 'otp_expired') {
        setStatus('expired')
        return
      }
      if (params.get('error')) {
        setError(errorDescription?.replace(/\+/g, ' ') || 'El enlace no es válido.')
        setStatus('error')
        return
      }
    }

    const complete = async () => {
      try {
        const { session } = await getSession()
        if (session) {
          await completarRegistro()
          return
        }

        const subscription = await onAuthStateChange(
          async (event, newSession) => {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession) {
              subscription.unsubscribe()
              await completarRegistro()
            }
          }
        )
        return () => subscription.unsubscribe()
      } catch (err) {
        setError(err.message || 'Error inesperado.')
        setStatus('error')
      }
    }

    complete()
  }, [])

  const completarRegistro = async () => {
    try {
      const pendingRaw = localStorage.getItem('clinica_pendiente')
      if (!pendingRaw) {
        navigate('/pabellon', { replace: true })
        return
      }
      const parsed = safeParseJSON(pendingRaw)
      if (!parsed?.clinica || !parsed?.ciudad) {
        navigate('/registro', { replace: true })
        return
      }
      const { clinica, ciudad } = parsed
      const { error: rpcError } = await registerClinica({
        p_nombre: sanitizeString(clinica),
        p_ciudad: sanitizeString(ciudad),
      })
      if (rpcError) throw new Error(`Error al crear la clínica: ${rpcError.message}`)
      localStorage.removeItem('clinica_pendiente')
      navigate('/elegir-plan', { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo completar el registro.')
      setStatus('error')
    }
  }

  const handleReenviar = async () => {
    const pendingRaw = localStorage.getItem('clinica_pendiente')
    if (!pendingRaw) { navigate('/registro'); return }
    const { email } = safeParseJSON(pendingRaw) ?? {}
    if (!email) { navigate('/registro'); return }
    setResending(true)
    await resendConfirmation(email)
    setResending(false)
    setResent(true)
  }

  if (status === 'expired') {
    return (
      <div className={STYLES.page}>
        <div className={STYLES.contentBox}>
          <div className={STYLES.iconBox}>
            <div className={`${STYLES.iconCircle} ${STYLES.iconAmber}`}>
              <Clock className={STYLES.iconAmberLg} />
            </div>
          </div>
          <h2 className={STYLES.title}>El enlace expiró</h2>
          <p className={STYLES.subtitle}>
            Los enlaces de confirmación son válidos por 24 horas.<br />
            Solicita uno nuevo y revisa tu correo.
          </p>
          {resent ? (
            <p className={STYLES.successText}>¡Correo reenviado! Revisa tu bandeja.</p>
          ) : (
            <div className={STYLES.btnsCol}>
              <button onClick={handleReenviar} disabled={resending} className={STYLES.primaryBtn}>
                <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Enviando...' : 'Reenviar correo de confirmación'}
              </button>
              <button onClick={() => navigate('/registro')} className={STYLES.ghostBtn}>
                Volver al registro
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={STYLES.page}>
        <div className={STYLES.contentBox}>
          <div className={STYLES.iconBox}>
            <div className={`${STYLES.iconCircle} ${STYLES.iconRed}`}>
              <XCircle className={STYLES.iconRedLg} />
            </div>
          </div>
          <h2 className={STYLES.title}>Algo salió mal</h2>
          <p className={STYLES.errorText}>{error}</p>
          <button
            onClick={() => navigate('/registro')}
            className={STYLES.backBtn}
          >
            Volver al registro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={STYLES.page}>
      <div className={STYLES.contentBox}>
        <div className={STYLES.iconBox}>
          <div className={`${STYLES.iconCircle} ${STYLES.iconBlue}`}>
            <CheckCircle2 className={STYLES.iconBlueLg} />
          </div>
        </div>
        <h2 className={STYLES.title}>Activando tu cuenta...</h2>
        <p className={STYLES.loadingText}>Estamos configurando tu clínica, un momento.</p>
        <div className={STYLES.spinnerRow}>
          <span className={STYLES.spinner} />
        </div>
      </div>
    </div>
  )
}
