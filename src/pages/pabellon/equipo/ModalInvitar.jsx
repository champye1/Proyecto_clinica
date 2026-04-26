import { useState } from 'react'
import { Send, Mail, ChevronDown, AlertCircle, Check, Copy, Link2, Clock } from 'lucide-react'
import { getCurrentSession } from '@/services/authService'
import { STYLES } from './constants'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

export default function ModalInvitar({ rolPreset, onClose, onSuccess }) {
  const [email, setEmail]         = useState('')
  const [rol, setRol]             = useState(rolPreset || 'doctor')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [resultado, setResultado] = useState(null)
  const [copiado, setCopiado]     = useState(null)

  const enviar = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { session } = await getCurrentSession()
      if (!session) throw new Error('No hay sesión activa.')
      const res = await fetch(`${FUNCTIONS_URL}/invite-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ email: email.trim().toLowerCase(), rol }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Error al enviar invitación.')
      setResultado(json)
      onSuccess?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copiar = (texto, tipo) => {
    navigator.clipboard.writeText(texto)
    setCopiado(tipo)
    setTimeout(() => setCopiado(null), 2000)
  }

  return (
    <div className={STYLES.modalOverlay}>
      <div className={STYLES.modalBox}>
        <div className={STYLES.modalHeader}>
          <h3 className={STYLES.modalTitle}>
            <Send className={STYLES.iconSendLg} /> Invitar usuario
          </h3>
          <button onClick={onClose} className={STYLES.modalCloseBtn}>&times;</button>
        </div>

        <div className={STYLES.modalBody}>
          {!resultado ? (
            <form onSubmit={enviar} className={STYLES.spaceY4}>
              <p className={STYLES.modalHint}>Se enviará un email con un código de acceso válido por 3 meses.</p>

              {error && (
                <div className={STYLES.modalError}>
                  <AlertCircle className={STYLES.iconAlertSm} /><span>{error}</span>
                </div>
              )}

              <div>
                <label className={STYLES.modalLabel}>Email del nuevo usuario</label>
                <div className={STYLES.modalInputWrap}>
                  <Mail className={STYLES.modalInputIcon} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@email.com" className={STYLES.modalInput} />
                </div>
              </div>

              <div>
                <label className={STYLES.modalLabel}>Tipo de cuenta</label>
                <div className={STYLES.selectWrap}>
                  <select value={rol} onChange={e => setRol(e.target.value)} className={STYLES.modalSelect}>
                    <option value="doctor">Médico</option>
                    <option value="pabellon">Pabellón (personal operativo)</option>
                    <option value="admin_clinica">Titular de Clínica</option>
                  </select>
                  <ChevronDown className={STYLES.modalSelectIcon} />
                </div>
                <p className={STYLES.modalRolHint}>
                  {rol === 'doctor'        && 'Podrá crear pacientes, solicitar cirugías y ver su calendario personal.'}
                  {rol === 'pabellon'      && 'Podrá gestionar solicitudes quirúrgicas, calendario e insumos.'}
                  {rol === 'admin_clinica' && 'Titular de la cuenta SurgicalHUB. Gestiona equipo, configuración y plan.'}
                </p>
              </div>

              <div className={STYLES.modalFooter}>
                <button type="button" onClick={onClose} className={STYLES.modalCancelBtn}>Cancelar</button>
                <button type="submit" disabled={loading} className={STYLES.modalSubmitBtn}>
                  {loading
                    ? <><span className={STYLES.modalSpinner} />Enviando...</>
                    : <><Send className={STYLES.iconSm} />Enviar invitación</>
                  }
                </button>
              </div>
            </form>
          ) : (
            <div className={STYLES.formSpace}>
              {resultado.advertencia ? (
                <div className={STYLES.modalWarn}>
                  <AlertCircle className={STYLES.iconAlertSm} /><span>{resultado.advertencia}</span>
                </div>
              ) : (
                <div className={STYLES.modalSuccess}>
                  <Check className={STYLES.iconCheckSm} />
                  <span>Invitación enviada a <strong>{email}</strong></span>
                </div>
              )}

              <div>
                <p className={STYLES.resultSectionLabel}>Código de acceso</p>
                <div className={STYLES.resultBox}>
                  <code className={STYLES.resultCode}>{resultado.codigo}</code>
                  <button onClick={() => copiar(resultado.codigo, 'codigo')} className={STYLES.resultCopyBtn}>
                    {copiado === 'codigo' ? <Check className={STYLES.iconCopied} /> : <Copy className={STYLES.iconSm} />}
                  </button>
                </div>
              </div>

              <div>
                <p className={STYLES.resultSectionLabel}>Link directo</p>
                <div className={STYLES.resultBox}>
                  <Link2 className={STYLES.resultLinkIcon} />
                  <span className={STYLES.resultLinkText}>{resultado.link}</span>
                  <button onClick={() => copiar(resultado.link, 'link')} className={STYLES.resultCopyBtn}>
                    {copiado === 'link' ? <Check className={STYLES.iconCopied} /> : <Copy className={STYLES.iconSm} />}
                  </button>
                </div>
              </div>

              <p className={STYLES.resultExpiry}>
                <Clock className={STYLES.iconClockXs} /> El código expira en 3 meses.
              </p>

              <button onClick={onClose} className={STYLES.resultCloseBtn}>Cerrar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
