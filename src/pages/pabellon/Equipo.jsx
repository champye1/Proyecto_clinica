import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, UserPlus, Stethoscope, Building2, Mail,
  ChevronDown, Trash2, AlertCircle, Copy, Check,
  Link2, Clock, Send, Activity, Power, PowerOff,
  RefreshCw, MailOpen,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/config/supabase'
import ConfirmModal from '@/components/common/ConfirmModal'
import {
  fetchMedicos,
  fetchPersonalPabellon,
  toggleMedicoEstado,
  deleteUsuarioPabellon,
  fetchInvitaciones,
  revocarInvitacion,
  reactivarInvitacion,
  toggleUsuarioActivo,
  fetchActividad,
} from '@/services/equipoService'
import { getLabelEspecialidad } from '@/constants/especialidades'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  // Modal Invitar
  modalOverlay:     'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4',
  modalBox:         'bg-white rounded-2xl shadow-2xl w-full max-w-md',
  modalHeader:      'flex items-center justify-between p-6 border-b border-slate-100',
  modalTitle:       'font-bold text-slate-900 flex items-center gap-2',
  modalCloseBtn:    'text-slate-400 hover:text-slate-600 text-xl leading-none',
  modalBody:        'p-6',
  modalHint:        'text-sm text-slate-500',
  modalError:       'flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm',
  modalWarn:        'flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm',
  modalSuccess:     'flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm',
  modalLabel:       'text-xs font-medium text-slate-600 mb-1.5 block',
  modalInputWrap:   'relative',
  modalInputIcon:   'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300',
  modalInput:       'w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
  modalSelect:      'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white',
  modalSelectIcon:  'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none',
  modalRolHint:     'text-xs text-slate-400 mt-1.5',
  modalFooter:      'flex gap-3 pt-2',
  modalCancelBtn:   'flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50',
  modalSubmitBtn:   'flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2',
  modalSpinner:     'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin',
  // Resultado invitación
  resultSectionLabel:'text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider',
  resultBox:        'flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3',
  resultCode:       'flex-1 text-xl font-bold text-slate-800 tracking-[0.3em]',
  resultCopyBtn:    'p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors',
  resultLinkIcon:   'w-4 h-4 text-slate-400 shrink-0',
  resultLinkText:   'flex-1 text-xs text-slate-500 truncate',
  resultExpiry:     'text-xs text-slate-400 flex items-center gap-1.5',
  resultCloseBtn:   'w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors',
  // Tablas compartidas
  tableWrap:        'overflow-x-auto',
  table:            'w-full text-sm',
  tableHead:        'border-b border-slate-100',
  tableTh:          'text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider',
  tableTbody:       'divide-y divide-slate-50',
  tableTr:          'hover:bg-slate-50 transition-colors',
  tableTd:          'py-3 px-4',
  tableCellMuted:   'py-3 px-4 text-slate-500',
  tableCellSm:      'py-3 px-4 text-slate-400 text-xs',
  tableCellRight:   'py-3 px-4 text-right',
  tableActionsWrap: 'flex items-center justify-end gap-1',
  badge:            'px-2 py-1 rounded-full text-xs font-medium',
  // Tab Médicos
  toggleBtn:        'p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors',
  // Tab Personal
  toggleActiveBtn:  'p-1.5 rounded-lg transition-colors text-slate-400 hover:text-orange-600 hover:bg-orange-50',
  toggleInactiveBtn:'p-1.5 rounded-lg transition-colors text-slate-400 hover:text-green-600 hover:bg-green-50',
  deleteBtn:        'p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors',
  // Tab Invitaciones
  invDeactivateBtn: 'px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors',
  invReactivateBtn: 'px-2 py-1 rounded-lg text-xs text-green-700 hover:bg-green-50 border border-green-200 transition-colors',
  invCode:          'text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded',
  // Empty states
  emptyState:       'text-center py-16 text-slate-400',
  emptyIcon:        'w-10 h-10 mx-auto mb-3 opacity-30',
  // Página principal
  page:             'p-6 max-w-6xl mx-auto',
  pageHeader:       'flex items-center justify-between mb-6',
  pageTitle:        'text-2xl font-bold text-slate-900 flex items-center gap-2',
  pageSubtitle:     'text-sm text-slate-400 mt-0.5',
  inviteBtn:        'flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-200',
  statsGrid:        'grid grid-cols-3 gap-4 mb-6',
  statCard:         'bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4',
  statIconBox:      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
  statValue:        'text-2xl font-bold text-slate-900',
  statLabel:        'text-xs text-slate-400 font-medium',
  tabsCard:         'bg-white rounded-2xl border border-slate-100 shadow-sm',
  tabsRow:          'flex overflow-x-auto border-b border-slate-100 scrollbar-none',
  tabBtnBase:       'flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
  tabBtnInactive:   'border-transparent text-slate-400 hover:text-slate-600',
  tabCountActive:   'px-1.5 py-0.5 rounded-full text-xs',
  tabCountInactive: 'px-1.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-400',
  tabContent:       'min-h-[320px]',
  tabLoading:       'py-16 text-center text-slate-400 text-sm',
  // Icon sizes
  iconSm:           'w-4 h-4',
  iconSendLg:       'w-5 h-5 text-blue-600',
  iconUsersLg:      'w-6 h-6 text-blue-600',
  iconAlertSm:      'w-4 h-4 mt-0.5 shrink-0',
  iconCheckSm:      'w-4 h-4 mt-0.5 shrink-0',
  iconCopied:       'w-4 h-4 text-green-600',
  iconClockXs:      'w-3.5 h-3.5',
  // Misc
  selectWrap:       'relative',
  formSpace:        'space-y-4',
  emptyTextSm:      'text-sm',
  emptyTextXs:      'text-xs mt-1',
  rutText:          'text-xs text-slate-400',
  expiredBadge:     'ml-1 text-red-500',
  userNameCell:     'font-medium text-slate-700',
  userEmailCell:    'text-xs text-slate-400',
  spaceY4:          'space-y-4',
}

const ESTADO_BADGE = {
  activo:     'bg-green-100 text-green-700',
  vacaciones: 'bg-amber-100 text-amber-700',
  inactivo:   'bg-slate-100 text-slate-500',
}
const ROL_LABEL = {
  pabellon:     'Pabellón',
  admin_clinica:'Titular de Clínica',
  doctor:       'Médico',
}
const ROL_BADGE = {
  pabellon:     'bg-blue-100 text-blue-700',
  admin_clinica:'bg-purple-100 text-purple-700',
  doctor:       'bg-green-100 text-green-700',
}
const TIPO_ACTIVIDAD = {
  cirugia_aceptada:   { label: 'Cirugía aceptada',    cls: 'bg-green-100 text-green-700' },
  cirugia_rechazada:  { label: 'Cirugía rechazada',   cls: 'bg-red-100 text-red-700' },
  cirugia_reagendada: { label: 'Cirugía reagendada',  cls: 'bg-amber-100 text-amber-700' },
  cirugia_actualizada:{ label: 'Estado actualizado',  cls: 'bg-slate-100 text-slate-600' },
  bloqueo_creado:     { label: 'Bloqueo de horario',  cls: 'bg-blue-100 text-blue-700' },
  usuario_invitado:   { label: 'Usuario invitado',    cls: 'bg-purple-100 text-purple-700' },
}

function getInvitacionStatus(inv) {
  if (inv.usado)            return { label: 'Aceptada',    cls: 'bg-green-100 text-green-700' }
  if (inv.activo === false) return { label: 'Desactivada', cls: 'bg-slate-100 text-slate-500' }
  if (new Date(inv.expires_at) < new Date()) return { label: 'Expirada', cls: 'bg-red-100 text-red-600' }
  return { label: 'Pendiente', cls: 'bg-blue-100 text-blue-700' }
}

// ─── Modal de Invitación ──────────────────────────────────────────────────────
function ModalInvitar({ rolPreset, onClose, onSuccess }) {
  const [email, setEmail]       = useState('')
  const [rol, setRol]           = useState(rolPreset || 'doctor')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [resultado, setResultado] = useState(null)
  const [copiado, setCopiado]   = useState(null) // 'codigo' | 'link' | null

  const enviar = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión activa.')

      const res = await fetch(`${FUNCTIONS_URL}/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
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
              <p className={STYLES.modalHint}>
                Se enviará un email con un código de acceso válido por 3 meses.
              </p>

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
                    placeholder="usuario@email.com"
                    className={STYLES.modalInput} />
                </div>
              </div>

              <div>
                <label className={STYLES.modalLabel}>Tipo de cuenta</label>
                <div className={STYLES.selectWrap}>
                  <select value={rol} onChange={e => setRol(e.target.value)}
                    className={STYLES.modalSelect}>
                    <option value="doctor">Médico</option>
                    <option value="pabellon">Pabellón (personal operativo)</option>
                    <option value="admin_clinica">Titular de Clínica</option>
                  </select>
                  <ChevronDown className={STYLES.modalSelectIcon} />
                </div>
                <p className={STYLES.modalRolHint}>
                  {rol === 'doctor'       && 'Podrá crear pacientes, solicitar cirugías y ver su calendario personal.'}
                  {rol === 'pabellon'     && 'Podrá gestionar solicitudes quirúrgicas, calendario e insumos.'}
                  {rol === 'admin_clinica'&& 'Titular de la cuenta SurgicalHUB. Gestiona equipo, configuración y plan.'}
                </p>
              </div>

              <div className={STYLES.modalFooter}>
                <button type="button" onClick={onClose} className={STYLES.modalCancelBtn}>
                  Cancelar
                </button>
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

              <button onClick={onClose} className={STYLES.resultCloseBtn}>
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab Médicos ──────────────────────────────────────────────────────────────
function TabMedicos({ medicos }) {
  const qc = useQueryClient()
  const toggleEstado = useMutation({
    mutationFn: ({ id, estado }) => toggleMedicoEstado(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipo-medicos'] }),
  })

  if (!medicos.length) return (
    <div className={STYLES.emptyState}>
      <Stethoscope className={STYLES.emptyIcon} />
      <p className={STYLES.emptyTextSm}>No hay médicos registrados aún</p>
      <p className={STYLES.emptyTextXs}>Usa el botón "Invitar" para agregar médicos a tu clínica</p>
    </div>
  )

  return (
    <div className={STYLES.tableWrap}>
      <table className={STYLES.table}>
        <thead>
          <tr className={STYLES.tableHead}>
            {['Nombre', 'Email', 'Especialidad', 'Estado', 'Acceso', ''].map(h => (
              <th key={h} className={STYLES.tableTh}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={STYLES.tableTbody}>
          {medicos.map(m => (
            <tr key={m.id} className={`${STYLES.tableTr} ${m.estado === 'inactivo' ? 'opacity-60' : ''}`}>
              <td className={`${STYLES.tableTd} font-medium text-slate-800`}>
                {m.nombre} {m.apellido}
                {m.rut && <div className={STYLES.rutText}>{m.rut}</div>}
              </td>
              <td className={STYLES.tableCellMuted}>{m.email}</td>
              <td className={`${STYLES.tableCellMuted} text-xs`}>{getLabelEspecialidad(m.especialidad)}</td>
              <td className={STYLES.tableTd}>
                <span className={`${STYLES.badge} ${ESTADO_BADGE[m.estado] || ESTADO_BADGE.inactivo}`}>
                  {m.estado}
                </span>
              </td>
              <td className={STYLES.tableTd}>
                <span className={`${STYLES.badge} ${m.acceso_web_enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {m.acceso_web_enabled ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </td>
              <td className={STYLES.tableCellRight}>
                <button
                  onClick={() => toggleEstado.mutate({ id: m.id, estado: m.estado === 'activo' ? 'inactivo' : 'activo' })}
                  title={m.estado === 'activo' ? 'Desactivar médico' : 'Activar médico'}
                  className={STYLES.toggleBtn}>
                  <RefreshCw className={STYLES.iconSm} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tab Personal ─────────────────────────────────────────────────────────────
function TabPersonal({ personal }) {
  const qc = useQueryClient()
  const [confirmEliminar, setConfirmEliminar] = useState(null) // { id, email }

  const eliminar = useMutation({
    mutationFn: (userId) => deleteUsuarioPabellon(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipo-personal'] }),
  })
  const toggleActivo = useMutation({
    mutationFn: ({ userId, nuevoActivo }) => toggleUsuarioActivo(userId, nuevoActivo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipo-personal'] }),
  })

  if (!personal.length) return (
    <div className={STYLES.emptyState}>
      <Building2 className={STYLES.emptyIcon} />
      <p className={STYLES.emptyTextSm}>No hay personal de pabellón registrado</p>
      <p className={STYLES.emptyTextXs}>Usa el botón "Invitar" para agregar personal</p>
    </div>
  )

  return (
    <>
    <ConfirmModal
      isOpen={!!confirmEliminar}
      onClose={() => setConfirmEliminar(null)}
      onConfirm={() => { eliminar.mutate(confirmEliminar.id); setConfirmEliminar(null) }}
      title="Eliminar usuario"
      message={`¿Eliminar permanentemente a ${confirmEliminar?.email}? Esta acción no se puede deshacer.`}
      confirmText="Eliminar"
      variant="danger"
    />
    <div className={STYLES.tableWrap}>
      <table className={STYLES.table}>
        <thead>
          <tr className={STYLES.tableHead}>
            {['Nombre', 'Email', 'Rol', 'Desde', 'Acceso', ''].map(h => (
              <th key={h} className={STYLES.tableTh}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={STYLES.tableTbody}>
          {personal.map(u => {
            const esActivo = u.activo !== false
            return (
              <tr key={u.id} className={`${STYLES.tableTr} ${!esActivo ? 'opacity-60' : ''}`}>
                <td className={`${STYLES.tableTd} font-medium text-slate-800`}>{u.nombre || '—'}</td>
                <td className={STYLES.tableCellMuted}>{u.email}</td>
                <td className={STYLES.tableTd}>
                  <span className={`${STYLES.badge} ${ROL_BADGE[u.role] || 'bg-slate-100 text-slate-500'}`}>
                    {ROL_LABEL[u.role] || u.role}
                  </span>
                </td>
                <td className={STYLES.tableCellSm}>
                  {format(new Date(u.created_at), 'dd MMM yyyy', { locale: es })}
                </td>
                <td className={STYLES.tableTd}>
                  <span className={`${STYLES.badge} ${esActivo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {esActivo ? 'Activo' : 'Desactivado'}
                  </span>
                </td>
                <td className={STYLES.tableCellRight}>
                  <div className={STYLES.tableActionsWrap}>
                    <button
                      onClick={() => toggleActivo.mutate({ userId: u.id, nuevoActivo: !esActivo })}
                      title={esActivo ? 'Desactivar acceso' : 'Reactivar acceso'}
                      className={esActivo ? STYLES.toggleActiveBtn : STYLES.toggleInactiveBtn}>
                      {esActivo ? <PowerOff className={STYLES.iconSm} /> : <Power className={STYLES.iconSm} />}
                    </button>
                    <button
                      onClick={() => setConfirmEliminar({ id: u.id, email: u.email })}
                      title="Eliminar usuario"
                      className={STYLES.deleteBtn}>
                      <Trash2 className={STYLES.iconSm} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </>
  )
}

// ─── Tab Invitaciones ─────────────────────────────────────────────────────────
function TabInvitaciones({ invitaciones }) {
  const qc = useQueryClient()
  const revocar = useMutation({
    mutationFn: (id) => revocarInvitacion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipo-invitaciones'] }),
  })
  const reactivar = useMutation({
    mutationFn: (id) => reactivarInvitacion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipo-invitaciones'] }),
  })

  if (!invitaciones.length) return (
    <div className={STYLES.emptyState}>
      <MailOpen className={STYLES.emptyIcon} />
      <p className={STYLES.emptyTextSm}>No hay invitaciones enviadas aún</p>
      <p className={STYLES.emptyTextXs}>Las invitaciones aparecerán aquí al enviarlas</p>
    </div>
  )

  return (
    <div className={STYLES.tableWrap}>
      <table className={STYLES.table}>
        <thead>
          <tr className={STYLES.tableHead}>
            {['Email', 'Rol', 'Estado', 'Expira', 'Código', ''].map(h => (
              <th key={h} className={STYLES.tableTh}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={STYLES.tableTbody}>
          {invitaciones.map(inv => {
            const status  = getInvitacionStatus(inv)
            const isExpired = new Date(inv.expires_at) < new Date()
            return (
              <tr key={inv.id} className={STYLES.tableTr}>
                <td className={`${STYLES.tableTd} text-slate-700`}>{inv.email}</td>
                <td className={STYLES.tableTd}>
                  <span className={`${STYLES.badge} ${ROL_BADGE[inv.rol] || 'bg-slate-100 text-slate-500'}`}>
                    {ROL_LABEL[inv.rol] || inv.rol}
                  </span>
                </td>
                <td className={STYLES.tableTd}>
                  <span className={`${STYLES.badge} ${status.cls}`}>
                    {status.label}
                  </span>
                </td>
                <td className={STYLES.tableCellSm}>
                  {format(new Date(inv.expires_at), 'dd MMM yyyy', { locale: es })}
                  {isExpired && !inv.usado && <span className={STYLES.expiredBadge}>• vencida</span>}
                </td>
                <td className={STYLES.tableTd}>
                  <code className={STYLES.invCode}>{inv.codigo}</code>
                </td>
                <td className={STYLES.tableCellRight}>
                  {!inv.usado && !isExpired && (
                    inv.activo !== false ? (
                      <button onClick={() => revocar.mutate(inv.id)} className={STYLES.invDeactivateBtn}>
                        Desactivar
                      </button>
                    ) : (
                      <button onClick={() => reactivar.mutate(inv.id)} className={STYLES.invReactivateBtn}>
                        Reactivar
                      </button>
                    )
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tab Actividad ────────────────────────────────────────────────────────────
function TabActividad({ actividad }) {
  if (!actividad.length) return (
    <div className={STYLES.emptyState}>
      <Activity className={STYLES.emptyIcon} />
      <p className={STYLES.emptyTextSm}>No hay actividad registrada aún</p>
      <p className={STYLES.emptyTextXs}>Aquí aparecerán las acciones del equipo: cirugías aceptadas, bloqueos de horario, etc.</p>
    </div>
  )

  return (
    <div className={STYLES.tableWrap}>
      <table className={STYLES.table}>
        <thead>
          <tr className={STYLES.tableHead}>
            {['Fecha', 'Usuario', 'Acción', 'Descripción'].map(h => (
              <th key={h} className={STYLES.tableTh}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={STYLES.tableTbody}>
          {actividad.map(a => {
            const tipo = TIPO_ACTIVIDAD[a.tipo] || { label: a.tipo, cls: 'bg-slate-100 text-slate-500' }
            return (
              <tr key={a.id} className={STYLES.tableTr}>
                <td className={`${STYLES.tableCellSm} whitespace-nowrap`}>
                  {format(new Date(a.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                </td>
                <td className={STYLES.tableTd}>
                  <div className={STYLES.userNameCell}>{a.user?.nombre || '—'}</div>
                  <div className={STYLES.userEmailCell}>{a.user?.email || ''}</div>
                </td>
                <td className={STYLES.tableTd}>
                  <span className={`${STYLES.badge} ${tipo.cls}`}>
                    {tipo.label}
                  </span>
                </td>
                <td className={STYLES.tableCellMuted}>{a.descripcion}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function Equipo() {
  const [tab, setTab]           = useState('medicos')
  const [showInvitar, setShowInvitar] = useState(false)
  const qc = useQueryClient()

  const { data: medicos = [],      isLoading: loadMedicos }      = useQuery({ queryKey: ['equipo-medicos'],      queryFn: fetchMedicos })
  const { data: personal = [],     isLoading: loadPersonal }     = useQuery({ queryKey: ['equipo-personal'],     queryFn: fetchPersonalPabellon })
  const { data: invitaciones = [], isLoading: loadInvitaciones } = useQuery({ queryKey: ['equipo-invitaciones'], queryFn: fetchInvitaciones })
  const { data: actividad = [],    isLoading: loadActividad }    = useQuery({ queryKey: ['equipo-actividad'],    queryFn: fetchActividad })

  const pendientes = invitaciones.filter(
    i => !i.usado && i.activo !== false && new Date(i.expires_at) > new Date()
  ).length

  const TABS = [
    { key: 'medicos',      Icon: Stethoscope, label: 'Médicos',      count: medicos.length,  active: 'border-green-500 text-green-700',  badge: 'bg-green-100 text-green-700'  },
    { key: 'personal',     Icon: Building2,   label: 'Personal',     count: personal.length, active: 'border-blue-500 text-blue-700',    badge: 'bg-blue-100 text-blue-700'    },
    { key: 'invitaciones', Icon: MailOpen,    label: 'Invitaciones', count: pendientes,      active: 'border-purple-500 text-purple-700',badge: 'bg-purple-100 text-purple-700'},
    { key: 'actividad',    Icon: Activity,    label: 'Actividad',    count: null,            active: 'border-slate-500 text-slate-700',  badge: 'bg-slate-100 text-slate-600'  },
  ]

  const loading = { medicos: loadMedicos, personal: loadPersonal, invitaciones: loadInvitaciones, actividad: loadActividad }

  return (
    <div className={STYLES.page}>
      {/* Header */}
      <div className={STYLES.pageHeader}>
        <div>
          <h1 className={STYLES.pageTitle}>
            <Users className={STYLES.iconUsersLg} /> Equipo
          </h1>
          <p className={STYLES.pageSubtitle}>
            Gestiona médicos, personal e invitaciones de tu clínica
          </p>
        </div>
        <button onClick={() => setShowInvitar(true)} className={STYLES.inviteBtn}>
          <UserPlus className={STYLES.iconSm} /> Invitar usuario
        </button>
      </div>

      {/* Stats */}
      <div className={STYLES.statsGrid}>
        {[
          { Icon: Stethoscope, count: medicos.length,  label: 'Médicos',         bg: 'bg-green-100',  ic: 'text-green-600'  },
          { Icon: Building2,   count: personal.length, label: 'Personal',        bg: 'bg-blue-100',   ic: 'text-blue-600'   },
          { Icon: MailOpen,    count: pendientes,      label: 'Inv. pendientes', bg: 'bg-purple-100', ic: 'text-purple-600' },
        ].map(({ Icon, count, label, bg, ic }) => (
          <div key={label} className={STYLES.statCard}>
            <div className={`${STYLES.statIconBox} ${bg}`}>
              <Icon className={`w-5 h-5 ${ic}`} />
            </div>
            <div>
              <p className={STYLES.statValue}>{count}</p>
              <p className={STYLES.statLabel}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Contenido */}
      <div className={STYLES.tabsCard}>
        <div className={STYLES.tabsRow}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`${STYLES.tabBtnBase} ${tab === t.key ? t.active : STYLES.tabBtnInactive}`}>
              <t.Icon className={STYLES.iconSm} />
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className={tab === t.key ? `${STYLES.tabCountActive} ${t.badge}` : STYLES.tabCountInactive}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={STYLES.tabContent}>
          {loading[tab]
            ? <div className={STYLES.tabLoading}>Cargando...</div>
            : tab === 'medicos'      ? <TabMedicos      medicos={medicos}           />
            : tab === 'personal'     ? <TabPersonal     personal={personal}         />
            : tab === 'invitaciones' ? <TabInvitaciones invitaciones={invitaciones} />
            : tab === 'actividad'    ? <TabActividad    actividad={actividad}       />
            : null
          }
        </div>
      </div>

      {showInvitar && (
        <ModalInvitar
          rolPreset={tab === 'medicos' ? 'doctor' : 'pabellon'}
          onClose={() => setShowInvitar(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['equipo-invitaciones'] })}
        />
      )}
    </div>
  )
}
