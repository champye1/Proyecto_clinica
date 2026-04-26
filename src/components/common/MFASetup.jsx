import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldOff, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react'
import {
  listFactors,
  enrollTOTP,
  challengeAndVerify,
  unenrollFactor,
} from '@/services/mfaService'

const STYLES = {
  card:       'bg-white rounded-2xl border border-slate-200 p-6',
  title:      'text-sm font-black text-slate-700 uppercase tracking-widest mb-1',
  desc:       'text-xs text-slate-500 mb-4',
  badge:      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
  badgeOn:    'bg-green-100 text-green-700',
  badgeOff:   'bg-slate-100 text-slate-500',
  primaryBtn: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-colors',
  dangerBtn:  'px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-colors',
  cancelBtn:  'px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest',
  label:      'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1',
  codeInput:  'w-full border-2 border-slate-100 bg-slate-50 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all',
  errorBox:   'bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2',
  successBox: 'bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2',
  qrWrap:     'flex justify-center my-4',
  secretRow:  'flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 font-mono text-xs text-slate-600 break-all',
}

export default function MFASetup() {
  const [hasMFA, setHasMFA] = useState(false)
  const [factorId, setFactorId] = useState(null)
  const [step, setStep] = useState('idle') // idle | enrolling | verifying | disabling
  const [enrollData, setEnrollData] = useState(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    listFactors().then(({ factors }) => {
      if (factors.length > 0) {
        setHasMFA(true)
        setFactorId(factors[0].id)
      }
    })
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
    setLoading(false)
    if (verifyError) { setCode(''); setError('Código incorrecto. Verifica tu app e inténtalo de nuevo.'); return }
    setHasMFA(true)
    setFactorId(enrollData.id)
    setStep('idle')
    setEnrollData(null)
    setCode('')
    setSuccess('MFA activado correctamente. Tu cuenta ahora requiere verificación en dos pasos.')
    setTimeout(() => setSuccess(null), 5000)
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
    setStep('idle')
    setSuccess('MFA desactivado. Tu cuenta ya no requiere verificación en dos pasos.')
    setTimeout(() => setSuccess(null), 5000)
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

      {/* ── Estado idle ───────────────────────────────────────────── */}
      {step === 'idle' && (
        <div className="flex gap-2">
          {!hasMFA ? (
            <button onClick={startEnroll} disabled={loading} className={STYLES.primaryBtn}>
              {loading ? 'Cargando...' : 'Activar MFA'}
            </button>
          ) : (
            <button onClick={() => setStep('disabling')} className={STYLES.dangerBtn}>
              Desactivar MFA
            </button>
          )}
        </div>
      )}

      {/* ── Paso 1: escanear QR ───────────────────────────────────── */}
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
