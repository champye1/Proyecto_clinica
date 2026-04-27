import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldOff, AlertCircle, CheckCircle2, Copy, Check, KeyRound, RefreshCw } from 'lucide-react'
import {
  listFactors,
  enrollTOTP,
  challengeAndVerify,
  unenrollFactor,
  generateBackupCodes,
  countRemainingBackupCodes,
} from '@/services/mfaService'
import { getCurrentUser } from '@/services/authService'

const STYLES = {
  card:         'bg-white rounded-2xl border border-slate-200 p-6',
  title:        'text-sm font-black text-slate-700 uppercase tracking-widest mb-1',
  desc:         'text-xs text-slate-500 mb-4',
  badge:        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
  badgeOn:      'bg-green-100 text-green-700',
  badgeOff:     'bg-slate-100 text-slate-500',
  primaryBtn:   'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-colors',
  dangerBtn:    'px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-colors',
  cancelBtn:    'px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest',
  secondaryBtn: 'px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-colors',
  label:        'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1',
  codeInput:    'w-full border-2 border-slate-100 bg-slate-50 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all',
  errorBox:     'bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2',
  successBox:   'bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2',
  warningBox:   'bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-xs',
  qrWrap:       'flex justify-center my-4',
  secretRow:    'flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 font-mono text-xs text-slate-600 break-all',
  backupGrid:   'grid grid-cols-2 gap-2',
  backupCode:   'font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center text-slate-700 tracking-wider',
  backupNote:   'text-xs text-slate-500 mt-3',
}

export default function MFASetup() {
  const [hasMFA, setHasMFA]       = useState(false)
  const [factorId, setFactorId]   = useState(null)
  const [userId, setUserId]       = useState(null)
  const [remaining, setRemaining] = useState(null)
  const [step, setStep]           = useState('idle') // idle | verifying | disabling | backup
  const [enrollData, setEnrollData] = useState(null)
  const [backupCodes, setBackupCodes] = useState([])
  const [code, setCode]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [success, setSuccess]     = useState(null)
  const [copied, setCopied]       = useState(false)
  const [savedCodes, setSavedCodes] = useState(false)

  useEffect(() => {
    async function init() {
      const { user } = await getCurrentUser()
      if (user) setUserId(user.id)

      const { factors } = await listFactors()
      if (factors.length > 0) {
        setHasMFA(true)
        setFactorId(factors[0].id)
        if (user) {
          const { count } = await countRemainingBackupCodes(user.id)
          setRemaining(count)
        }
      }
    }
    init()
  }, [])

  const startEnroll = async () => {
    setLoading(true)
    setError(null)
    const { factor, error: enrollError } = await enrollTOTP()
    setLoading(false)
    if (enrollError) { setError('No se pudo iniciar la configuración. Intenta de nuevo.'); return }
    setEnrollData(factor)
    setStep('verifying')
  }

  const confirmEnroll = async () => {
    if (code.length !== 6) return
    setLoading(true)
    setError(null)
    const { error: verifyError } = await challengeAndVerify(enrollData.id, code)
    if (verifyError) {
      setLoading(false)
      setCode('')
      setError('Código incorrecto. Verifica tu app e inténtalo de nuevo.')
      return
    }

    // Generar backup codes automáticamente tras activar MFA
    const { codes, error: backupError } = await generateBackupCodes(userId)
    setLoading(false)

    setHasMFA(true)
    setFactorId(enrollData.id)
    setEnrollData(null)
    setCode('')

    if (!backupError && codes) {
      setBackupCodes(codes)
      setRemaining(codes.length)
      setSavedCodes(false)
      setStep('backup')
    } else {
      setStep('idle')
      setSuccess('MFA activado correctamente. Tu cuenta ahora requiere verificación en dos pasos.')
      setTimeout(() => setSuccess(null), 5000)
    }
  }

  const disableMFA = async () => {
    if (!factorId) return
    setLoading(true)
    setError(null)
    const { error: unenrollError } = await unenrollFactor(factorId)
    setLoading(false)
    if (unenrollError) { setError('No se pudo desactivar el MFA. Intenta de nuevo.'); return }
    setHasMFA(false)
    setFactorId(null)
    setRemaining(null)
    setStep('idle')
    setSuccess('MFA desactivado. Tu cuenta ya no requiere verificación en dos pasos.')
    setTimeout(() => setSuccess(null), 5000)
  }

  const regenerateBackupCodes = async () => {
    setLoading(true)
    setError(null)
    const { codes, error: backupError } = await generateBackupCodes(userId)
    setLoading(false)
    if (backupError) { setError('No se pudieron regenerar los códigos. Intenta de nuevo.'); return }
    setBackupCodes(codes)
    setRemaining(codes.length)
    setSavedCodes(false)
    setStep('backup')
  }

  const copySecret = () => {
    navigator.clipboard.writeText(enrollData.secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(val)
    setError(null)
  }

  const closeBackupStep = () => {
    setStep('idle')
    setBackupCodes([])
    setSuccess('MFA activado. Guarda bien tus códigos de respaldo.')
    setTimeout(() => setSuccess(null), 5000)
  }

  return (
    <div className={STYLES.card}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className={STYLES.title}>Autenticación en dos pasos (MFA)</p>
          <p className={STYLES.desc}>
            Agrega una capa extra de seguridad con una app autenticadora como Google Authenticator o Authy.
          </p>
        </div>
        <span className={`${STYLES.badge} ${hasMFA ? STYLES.badgeOn : STYLES.badgeOff}`}>
          {hasMFA
            ? <><ShieldCheck className="w-3.5 h-3.5" />Activo</>
            : <><ShieldOff className="w-3.5 h-3.5" />Inactivo</>
          }
        </span>
      </div>

      {error   && <div className={`${STYLES.errorBox} mb-3`}><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</div>}
      {success && <div className={`${STYLES.successBox} mb-3`}><CheckCircle2 className="w-3.5 h-3.5 shrink-0" />{success}</div>}

      {/* ── Estado idle ─────────────────────────────────────────── */}
      {step === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {!hasMFA ? (
            <button onClick={startEnroll} disabled={loading} className={STYLES.primaryBtn}>
              {loading ? 'Cargando...' : 'Activar MFA'}
            </button>
          ) : (
            <>
              <button onClick={() => setStep('disabling')} className={STYLES.dangerBtn}>
                Desactivar MFA
              </button>
              <button onClick={regenerateBackupCodes} disabled={loading} className={STYLES.secondaryBtn}>
                <RefreshCw className="w-3 h-3 inline mr-1" />
                {loading ? 'Generando...' : `Nuevos códigos${remaining !== null ? ` (${remaining} restantes)` : ''}`}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Paso 1: escanear QR ──────────────────────────────────── */}
      {step === 'verifying' && enrollData && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
            <p className="font-bold">Paso 1 — Escanea el código QR</p>
            <p>Abre Google Authenticator, Authy u otra app y escanea el siguiente código.</p>
          </div>

          <div className={STYLES.qrWrap}>
            <img
              src={enrollData.qrCode}
              alt="Código QR para autenticador"
              className="w-44 h-44 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1.5">¿No puedes escanear? Usa la clave manual:</p>
            <div className={STYLES.secretRow}>
              <span className="flex-1 break-all">{enrollData.secret}</span>
              <button onClick={copySecret} className="shrink-0 p-1 rounded hover:bg-slate-200 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600 mb-1.5">Paso 2 — Ingresa el código de 6 dígitos que muestra la app:</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              className={STYLES.codeInput}
              placeholder="000000"
              autoComplete="one-time-code"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setStep('idle'); setEnrollData(null); setCode(''); setError(null) }}
              className={STYLES.cancelBtn}
            >
              Cancelar
            </button>
            <button
              onClick={confirmEnroll}
              disabled={loading || code.length !== 6}
              className={STYLES.primaryBtn}
            >
              {loading ? 'Verificando...' : 'Confirmar y activar'}
            </button>
          </div>
        </div>
      )}

      {/* ── Backup codes (se muestran una sola vez) ──────────────── */}
      {step === 'backup' && backupCodes.length > 0 && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Guarda tus códigos de respaldo
            </p>
            <p>Si pierdes acceso a tu app autenticadora, podrás usar uno de estos códigos para entrar. <strong>Cada código solo sirve una vez.</strong> Guárdalos en un lugar seguro — no los verás de nuevo.</p>
          </div>

          <div className={STYLES.backupGrid}>
            {backupCodes.map((c, i) => (
              <div key={i} className={STYLES.backupCode}>{c}</div>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
            <input
              type="checkbox"
              checked={savedCodes}
              onChange={e => setSavedCodes(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            He guardado mis códigos de respaldo en un lugar seguro
          </label>

          <button
            onClick={closeBackupStep}
            disabled={!savedCodes}
            className={STYLES.primaryBtn}
          >
            Listo, continuar
          </button>
        </div>
      )}

      {/* ── Confirmar desactivación ───────────────────────────────── */}
      {step === 'disabling' && (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
            <p className="font-bold mb-1">¿Desactivar la verificación en dos pasos?</p>
            <p>Tu cuenta será menos segura. Solo protegida por contraseña.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('idle')} className={STYLES.cancelBtn}>Cancelar</button>
            <button onClick={disableMFA} disabled={loading} className={STYLES.dangerBtn}>
              {loading ? 'Desactivando...' : 'Sí, desactivar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
