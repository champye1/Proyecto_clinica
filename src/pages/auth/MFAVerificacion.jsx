import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, AlertCircle, LogOut, KeyRound, ChevronLeft } from 'lucide-react'
import { listFactors, challengeAndVerify, verifyBackupCode } from '@/services/mfaService'
import { getCurrentUser, signOut } from '@/services/authService'

const STYLES = {
  page:        'min-h-screen flex items-center justify-center bg-slate-50 p-4',
  card:        'bg-white p-8 sm:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-slate-100 text-center',
  iconWrap:    'w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200',
  iconWrapAlt: 'w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-200',
  title:       'text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2',
  subtitle:    'text-slate-500 text-sm mb-8',
  label:       'text-[10px] font-black text-slate-400 uppercase tracking-widest text-left mb-1 block',
  codeInput:   'w-full border-2 border-slate-100 bg-slate-50 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all',
  backupInput: 'w-full border-2 border-slate-100 bg-slate-50 rounded-xl px-4 py-3 text-center text-base font-mono tracking-wider text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all uppercase',
  hint:        'text-xs text-slate-400 mt-2 text-left',
  errorBox:    'bg-red-50 border-2 border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 text-left mt-4',
  submitBtn:   'w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  submitBtnAlt:'w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  switchLink:  'mt-4 w-full flex items-center justify-center gap-2 text-slate-400 hover:text-blue-600 text-xs font-bold uppercase tracking-widest py-2 transition-colors',
  logoutBtn:   'mt-2 w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 text-xs font-bold uppercase tracking-widest py-2',
}

export default function MFAVerificacion() {
  const [mode, setMode]       = useState('totp')   // 'totp' | 'backup'
  const [code, setCode]       = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [factorId, setFactorId] = useState(null)
  const [userId, setUserId]   = useState(null)
  const inputRef     = useRef(null)
  const backupRef    = useRef(null)
  const navigate     = useNavigate()

  useEffect(() => {
    async function init() {
      const { user } = await getCurrentUser()
      if (user) setUserId(user.id)

      const { factors } = await listFactors()
      if (factors.length > 0) {
        setFactorId(factors[0].id)
        setTimeout(() => inputRef.current?.focus(), 100)
      } else {
        navigate('/', { replace: true })
      }
    }
    init()
  }, [navigate])

  const redirect = () => {
    const redirectTo = sessionStorage.getItem('mfa_redirect') || '/'
    sessionStorage.removeItem('mfa_redirect')
    navigate(redirectTo, { replace: true })
  }

  const handleTOTP = async (e) => {
    e?.preventDefault()
    if (code.length !== 6 || !factorId) return
    setLoading(true)
    setError(null)
    try {
      const { error: verifyError } = await challengeAndVerify(factorId, code)
      if (verifyError) {
        setCode('')
        setError('Código incorrecto. Verifica tu app autenticadora e inténtalo de nuevo.')
        setTimeout(() => inputRef.current?.focus(), 50)
        return
      }
      redirect()
    } finally {
      setLoading(false)
    }
  }

  const handleBackup = async (e) => {
    e?.preventDefault()
    const raw = backupCode.trim()
    if (!raw || !userId) return
    setLoading(true)
    setError(null)
    try {
      const { valid, error: backupError } = await verifyBackupCode(userId, raw)
      if (!valid || backupError) {
        setBackupCode('')
        setError('Código de respaldo inválido o ya utilizado.')
        setTimeout(() => backupRef.current?.focus(), 50)
        return
      }
      redirect()
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(val)
    setError(null)
    if (val.length === 6) setTimeout(() => handleTOTP(), 0)
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setCode('')
    setBackupCode('')
    setError(null)
    setTimeout(() => (newMode === 'totp' ? inputRef : backupRef).current?.focus(), 100)
  }

  const handleLogout = async () => {
    await signOut()
    sessionStorage.removeItem('mfa_redirect')
    navigate('/acceso', { replace: true })
  }

  return (
    <div className={STYLES.page}>
      <div className={STYLES.card}>
        {mode === 'totp' ? (
          <>
            <div className={STYLES.iconWrap}>
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className={STYLES.title}>Verificación</h1>
            <p className={STYLES.subtitle}>
              Abre tu app autenticadora (Google Authenticator, Authy, etc.) e ingresa el código de 6 dígitos.
            </p>

            <form onSubmit={handleTOTP}>
              <label className={STYLES.label}>Código de verificación</label>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                className={STYLES.codeInput}
                placeholder="000000"
                disabled={loading}
                autoComplete="one-time-code"
              />
              <p className={STYLES.hint}>El código cambia cada 30 segundos.</p>

              {error && (
                <div className={STYLES.errorBox}>
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className={STYLES.submitBtn}
              >
                {loading ? 'Verificando...' : 'Confirmar'}
              </button>
            </form>

            <button onClick={() => switchMode('backup')} className={STYLES.switchLink}>
              <KeyRound className="w-3.5 h-3.5" />
              Usar código de respaldo
            </button>
          </>
        ) : (
          <>
            <div className={STYLES.iconWrapAlt}>
              <KeyRound className="w-7 h-7 text-white" />
            </div>
            <h1 className={STYLES.title}>Código de Respaldo</h1>
            <p className={STYLES.subtitle}>
              Ingresa uno de los códigos de respaldo que guardaste al activar el MFA.
            </p>

            <form onSubmit={handleBackup}>
              <label className={STYLES.label}>Código de respaldo</label>
              <input
                ref={backupRef}
                type="text"
                value={backupCode}
                onChange={e => { setBackupCode(e.target.value.toUpperCase()); setError(null) }}
                className={STYLES.backupInput}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                disabled={loading}
                autoComplete="off"
              />
              <p className={STYLES.hint}>El código se marcará como usado tras ingresar.</p>

              {error && (
                <div className={STYLES.errorBox}>
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !backupCode.trim()}
                className={STYLES.submitBtnAlt}
              >
                {loading ? 'Verificando...' : 'Usar código'}
              </button>
            </form>

            <button onClick={() => switchMode('totp')} className={STYLES.switchLink}>
              <ChevronLeft className="w-3.5 h-3.5" />
              Volver al código TOTP
            </button>
          </>
        )}

        <button onClick={handleLogout} className={STYLES.logoutBtn}>
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión y volver
        </button>
      </div>
    </div>
  )
}
