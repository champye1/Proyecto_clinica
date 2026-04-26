import {
  Mail, MailOpen, Archive, Trash2, StickyNote,
  User, Phone, Building2, ChevronDown, ChevronUp, AlertTriangle, Clock, CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const URGENCIA_CONFIG = {
  urgente: { label: 'Urgente', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: AlertTriangle },
  normal:  { label: 'Normal',  bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: Clock },
  electiva:{ label: 'Electiva',bg: 'bg-green-100',text: 'text-green-800',border: 'border-green-200',icon: CheckCircle2 },
}

const S = {
  cardUnreadDark:  'rounded-2xl border transition-all bg-blue-950/40 border-blue-700',
  cardUnreadLight: 'rounded-2xl border transition-all bg-blue-50 border-blue-200',
  cardReadDark:    'rounded-2xl border transition-all bg-slate-800 border-slate-700',
  cardReadLight:   'rounded-2xl border transition-all bg-white border-slate-200',
  row:             'flex items-start gap-4 p-4 sm:p-5 cursor-pointer',
  iconUnread:      'flex-shrink-0 mt-0.5 text-blue-500',
  iconReadDark:    'flex-shrink-0 mt-0.5 text-slate-500',
  iconReadLight:   'flex-shrink-0 mt-0.5 text-slate-300',
  content:         'flex-1 min-w-0',
  meta:            'flex flex-wrap items-center gap-2 mb-1',
  badgeGmailDark:  'text-[9px] font-black px-1.5 py-0.5 rounded-md border bg-red-900/40 text-red-300 border-red-700',
  badgeGmailLight: 'text-[9px] font-black px-1.5 py-0.5 rounded-md border bg-red-50 text-red-600 border-red-200',
  badgeFormDark:   'text-[9px] font-black px-1.5 py-0.5 rounded-md border bg-slate-700 text-slate-400 border-slate-600',
  badgeFormLight:  'text-[9px] font-black px-1.5 py-0.5 rounded-md border bg-slate-100 text-slate-500 border-slate-200',
  senderUnreadDark:'font-black text-sm truncate text-white',
  senderUnreadLight:'font-black text-sm truncate text-slate-900',
  senderReadDark:  'font-black text-sm truncate text-slate-300',
  senderReadLight: 'font-black text-sm truncate text-slate-600',
  unreadDot:       'w-2 h-2 rounded-full bg-blue-500 flex-shrink-0',
  subjectDark:     'text-sm font-bold truncate text-slate-200',
  subjectLight:    'text-sm font-bold truncate text-slate-800',
  previewDark:     'text-xs mt-0.5 truncate text-slate-400',
  previewLight:    'text-xs mt-0.5 truncate text-slate-500',
  right:           'flex-shrink-0 flex flex-col items-end gap-2 ml-2',
  date:            'text-[10px] font-bold text-slate-400',
  chevron:         'w-4 h-4 text-slate-400',
  detailDark:      'border-t px-4 sm:px-5 pb-5 pt-4 space-y-4 border-slate-700',
  detailLight:     'border-t px-4 sm:px-5 pb-5 pt-4 space-y-4 border-slate-100',
  infoGridDark:    'grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 rounded-xl bg-slate-700/50',
  infoGridLight:   'grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 rounded-xl bg-slate-50',
  infoRow:         'flex items-center gap-2',
  infoIcon:        'w-3.5 h-3.5 text-blue-500 flex-shrink-0',
  infoTextDark:    'text-slate-300',
  infoTextLight:   'text-slate-700',
  patientBoxDark:  'text-xs p-3 rounded-xl border bg-slate-700/30 border-slate-600',
  patientBoxLight: 'text-xs p-3 rounded-xl border bg-blue-50 border-blue-100',
  patientLabelDark:'font-black uppercase text-[10px] mb-2 text-slate-400',
  patientLabelLight:'font-black uppercase text-[10px] mb-2 text-slate-400',
  patientTextDark: 'text-slate-200',
  patientTextLight:'text-slate-700',
  sectionLabel:    'text-[10px] font-black uppercase mb-2 text-slate-400',
  sectionLabelRow: 'text-[10px] font-black uppercase mb-2 flex items-center gap-1.5 text-slate-400',
  msgTextDark:     'text-sm whitespace-pre-wrap leading-relaxed text-slate-200',
  msgTextLight:    'text-sm whitespace-pre-wrap leading-relaxed text-slate-700',
  textareaDark:    'w-full px-3 py-2 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500',
  textareaLight:   'w-full px-3 py-2 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-slate-200 text-slate-700 placeholder-slate-400',
  notesFooter:     'flex justify-end mt-2',
  saveNotesBtn:    'px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50',
  actionsRow:      'flex flex-wrap gap-2 pt-2',
  replyBtn:        'flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors',
  archiveBtnDark:  'flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors border-slate-600 text-slate-300 hover:bg-slate-700',
  archiveBtnLight: 'flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors border-slate-200 text-slate-600 hover:bg-slate-50',
  deleteBtn:       'flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors',
  emailLink:       'text-blue-500 hover:underline truncate',
  iconMd:          'w-5 h-5',
  iconXs:          'w-3.5 h-3.5',
}

export default function CorreoCard({
  m, isDark, isExpanded, onToggle,
  mensajeAbierto, notasEditando, setNotasEditando, guardandoNotas,
  onGuardarNotas, onArchivar, onDelete,
}) {
  const urgCfg = URGENCIA_CONFIG[m.urgencia] || URGENCIA_CONFIG.normal
  const UrgIcon = urgCfg.icon
  const cardClass = !m.leido
    ? (isDark ? S.cardUnreadDark : S.cardUnreadLight)
    : (isDark ? S.cardReadDark   : S.cardReadLight)

  return (
    <div className={cardClass}>
      <div className={S.row} onClick={onToggle}>
        <div className={!m.leido ? S.iconUnread : isDark ? S.iconReadDark : S.iconReadLight}>
          {!m.leido ? <Mail className={S.iconMd} /> : <MailOpen className={S.iconMd} />}
        </div>

        <div className={S.content}>
          <div className={S.meta}>
            {m.fuente === 'gmail'
              ? <span className={isDark ? S.badgeGmailDark : S.badgeGmailLight}>Gmail</span>
              : <span className={isDark ? S.badgeFormDark : S.badgeFormLight}>Formulario web</span>}
            <span className={!m.leido
              ? (isDark ? S.senderUnreadDark : S.senderUnreadLight)
              : (isDark ? S.senderReadDark : S.senderReadLight)}>
              {m.nombre_remitente}
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${urgCfg.bg} ${urgCfg.text} ${urgCfg.border}`}>
              <UrgIcon className="inline w-3 h-3 mr-0.5 -mt-0.5" />
              {urgCfg.label}
            </span>
            {!m.leido && <span className={S.unreadDot} />}
          </div>
          <p className={isDark ? S.subjectDark : S.subjectLight}>{m.asunto}</p>
          <p className={isDark ? S.previewDark : S.previewLight}>{m.mensaje}</p>
        </div>

        <div className={S.right}>
          <span className={S.date}>{format(new Date(m.created_at), 'd MMM', { locale: es })}</span>
          {isExpanded ? <ChevronUp className={S.chevron} /> : <ChevronDown className={S.chevron} />}
        </div>
      </div>

      {isExpanded && (
        <div className={isDark ? S.detailDark : S.detailLight}>
          <div className={isDark ? S.infoGridDark : S.infoGridLight}>
            <div className={S.infoRow}>
              <User className={S.infoIcon} />
              <span className={isDark ? S.infoTextDark : S.infoTextLight}>
                <span className="font-black">Dr. </span>{m.nombre_remitente}
                {m.especialidad_remitente && ` · ${m.especialidad_remitente}`}
              </span>
            </div>
            <div className={S.infoRow}>
              <Mail className={S.infoIcon} />
              <a href={`mailto:${m.email_remitente}`} className={S.emailLink} onClick={e => e.stopPropagation()}>
                {m.email_remitente}
              </a>
            </div>
            {m.telefono_remitente && (
              <div className={S.infoRow}>
                <Phone className={S.infoIcon} />
                <span className={isDark ? S.infoTextDark : S.infoTextLight}>{m.telefono_remitente}</span>
              </div>
            )}
            {m.institucion_remitente && (
              <div className={S.infoRow}>
                <Building2 className={S.infoIcon} />
                <span className={isDark ? S.infoTextDark : S.infoTextLight}>{m.institucion_remitente}</span>
              </div>
            )}
          </div>

          {(m.nombre_paciente || m.tipo_cirugia) && (
            <div className={isDark ? S.patientBoxDark : S.patientBoxLight}>
              <p className={isDark ? S.patientLabelDark : S.patientLabelLight}>Paciente</p>
              {m.nombre_paciente && (
                <p className={isDark ? S.patientTextDark : S.patientTextLight}>
                  Nombre: <span className="font-bold">{m.nombre_paciente}</span>
                  {m.rut_paciente && ` · RUT: ${m.rut_paciente}`}
                </p>
              )}
              {m.tipo_cirugia && (
                <p className={`mt-1 ${isDark ? S.infoTextDark : 'text-slate-600'}`}>
                  Cirugía: <span className="font-bold">{m.tipo_cirugia}</span>
                </p>
              )}
            </div>
          )}

          <div>
            <p className={S.sectionLabel}>Mensaje</p>
            <p className={isDark ? S.msgTextDark : S.msgTextLight}>{m.mensaje}</p>
          </div>

          <div>
            <p className={S.sectionLabelRow}>
              <StickyNote className={S.iconXs} /> Notas internas (solo pabellón)
            </p>
            <textarea
              value={mensajeAbierto?.id === m.id ? notasEditando : (m.notas_internas || '')}
              onChange={e => { if (mensajeAbierto?.id === m.id) setNotasEditando(e.target.value) }}
              onFocus={() => {
                if (mensajeAbierto?.id !== m.id) setNotasEditando(m.notas_internas || '')
              }}
              placeholder="Agregar notas de seguimiento, recordatorios, etc."
              rows={3}
              className={isDark ? S.textareaDark : S.textareaLight}
              maxLength={1000}
              onClick={e => e.stopPropagation()}
              aria-label="Notas internas (solo pabellón)"
            />
            <div className={S.notesFooter}>
              <button
                type="button"
                disabled={guardandoNotas}
                onClick={e => { e.stopPropagation(); onGuardarNotas(m.id) }}
                className={S.saveNotesBtn}
              >
                {guardandoNotas ? 'Guardando...' : 'Guardar notas'}
              </button>
            </div>
          </div>

          <div className={S.actionsRow}>
            <a
              href={`mailto:${m.email_remitente}?subject=Re: ${encodeURIComponent(m.asunto)}`}
              className={S.replyBtn}
              onClick={e => e.stopPropagation()}
            >
              <Mail className={S.iconXs} /> Responder por email
            </a>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onArchivar(m) }}
              className={isDark ? S.archiveBtnDark : S.archiveBtnLight}
            >
              <Archive className={S.iconXs} />
              {m.archivado ? 'Restaurar' : 'Archivar'}
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onDelete(m.id) }}
              className={S.deleteBtn}
            >
              <Trash2 className={S.iconXs} /> Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
