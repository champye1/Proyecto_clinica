import { Clock, CheckCircle2, XCircle, Edit, CalendarClock } from 'lucide-react'
import { format } from 'date-fns'

const S = {
  card:               'card',
  cardHeader:         'flex justify-between items-start mb-4',
  patientNameDark:    'text-lg font-bold text-white',
  patientNameLight:   'text-lg font-bold',
  patientMetaDark:    'text-sm text-slate-300',
  patientMetaLight:   'text-sm text-gray-600',
  stateBadge:         'px-3 py-1 rounded flex items-center gap-2',
  reagendNotice:      'text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2',
  reagendIcon:        'w-4 h-4 flex-shrink-0 text-amber-600',
  reagendDate:        'text-amber-600/80 text-xs',
  reagendRow:         'flex justify-end',
  reagendBtn:         'flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50',
  detailSection:      'mb-4 space-y-2',
  inlineRow:          'mb-2',
  inlineLabelDark:    'text-sm font-medium text-slate-300',
  inlineLabelLight:   'text-sm font-medium',
  inlineValDark:      'text-sm text-slate-200',
  inlineValLight:     'text-sm text-gray-600',
  insumosWrap:        'mt-1 flex flex-wrap gap-2',
  insumoTagDark:      'text-xs px-2 py-1 rounded border bg-slate-600/90 text-slate-100 border-slate-500',
  insumoTagLight:     'text-xs px-2 py-1 rounded border bg-gray-100 text-gray-800 border-gray-200',
  surgeryBox:         'mt-4 p-3 bg-green-50 rounded-lg',
  surgeryBoxTitle:    'text-sm font-medium text-green-800 mb-1',
  surgeryBoxText:     'text-sm text-green-700',
  surgeryReschNote:   'text-xs text-amber-700 mt-2 pt-2 border-t border-amber-200',
  cardFooter:         'mt-4 flex items-center justify-between',
  createdDark:        'text-xs text-slate-400',
  createdLight:       'text-xs text-gray-500',
  editBtn:            'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2',
  iconSm:             'w-4 h-4',
}

const ESTADO_BADGE = {
  pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  aceptada:  { bg: 'bg-green-100',  text: 'text-green-800',  icon: CheckCircle2 },
  rechazada: { bg: 'bg-red-100',    text: 'text-red-800',    icon: XCircle },
  cancelada: { bg: 'bg-gray-100',   text: 'text-gray-800',   icon: XCircle },
}

export default function SolicitudDoctorCard({ solicitud, isDark, isReschedulePending, onEditarClick, onSolicitarReagendamiento }) {
  const estadoInfo = ESTADO_BADGE[solicitud.estado] || ESTADO_BADGE.pendiente
  const EstadoIcon = estadoInfo.icon

  return (
    <div className={S.card}>
      <div className={S.cardHeader}>
        <div>
          <h3 className={isDark ? S.patientNameDark : S.patientNameLight}>
            {solicitud.patients?.nombre} {solicitud.patients?.apellido}
          </h3>
          <p className={isDark ? S.patientMetaDark : S.patientMetaLight}>RUT: {solicitud.patients?.rut}</p>
          <p className={isDark ? S.patientMetaDark : S.patientMetaLight}>
            Código Operación: {solicitud.codigo_operacion}
          </p>
        </div>
        <span className={`${S.stateBadge} ${estadoInfo.bg} ${estadoInfo.text}`}>
          <EstadoIcon className={S.iconSm} />
          {solicitud.estado}
        </span>
      </div>

      {(solicitud.estado === 'aceptada' || solicitud.estado === 'pendiente') && (
        <div className={S.detailSection}>
          {solicitud.reagendamiento_notificado_at && (
            <p className={S.reagendNotice}>
              <CheckCircle2 className={S.reagendIcon} />
              Ya se notificó sobre el reagendamiento
              <span className={S.reagendDate}>
                ({format(new Date(solicitud.reagendamiento_notificado_at), 'dd/MM/yyyy HH:mm')})
              </span>
            </p>
          )}
          <div className={S.reagendRow}>
            <button
              type="button"
              onClick={() => onSolicitarReagendamiento(solicitud)}
              disabled={isReschedulePending}
              className={S.reagendBtn}
              title="Notificar a pabellón que el paciente solicitó reagendamiento"
            >
              <CalendarClock className={S.iconSm} />
              Reagendar
            </button>
          </div>
        </div>
      )}

      {(solicitud.hora_recomendada || solicitud.fecha_preferida) && (
        <div className={S.inlineRow}>
          <span className={isDark ? S.inlineLabelDark : S.inlineLabelLight}>
            {solicitud.fecha_preferida ? 'Horario solicitado (vacío, sin reservas ni bloqueos): ' : 'Hora recomendada: '}
          </span>
          <span className={isDark ? S.inlineValDark : S.inlineValLight}>
            {solicitud.fecha_preferida && (
              <>
                {format(new Date(solicitud.fecha_preferida), 'dd/MM/yyyy')}
                {solicitud.hora_recomendada && (
                  <> · {typeof solicitud.hora_recomendada === 'string' ? solicitud.hora_recomendada.slice(0, 5) : solicitud.hora_recomendada}
                    {solicitud.hora_fin_recomendada && `–${typeof solicitud.hora_fin_recomendada === 'string' ? solicitud.hora_fin_recomendada.slice(0, 5) : solicitud.hora_fin_recomendada}`}
                  </>
                )}
              </>
            )}
            {!solicitud.fecha_preferida && solicitud.hora_recomendada && (typeof solicitud.hora_recomendada === 'string' ? solicitud.hora_recomendada.slice(0, 5) : solicitud.hora_recomendada)}
          </span>
        </div>
      )}

      {solicitud.observaciones && (
        <div className={S.inlineRow}>
          <span className={isDark ? S.inlineLabelDark : S.inlineLabelLight}>Observaciones: </span>
          <span className={isDark ? S.inlineValDark : S.inlineValLight}>{solicitud.observaciones}</span>
        </div>
      )}

      {solicitud.surgery_request_supplies?.length > 0 && (
        <div className={S.inlineRow}>
          <span className={isDark ? S.inlineLabelDark : S.inlineLabelLight}>Insumos: </span>
          <div className={S.insumosWrap}>
            {solicitud.surgery_request_supplies.map((item, idx) => (
              <span key={idx} className={isDark ? S.insumoTagDark : S.insumoTagLight}>
                {item.supplies?.nombre} (x{item.cantidad})
              </span>
            ))}
          </div>
        </div>
      )}

      {solicitud.surgeries?.length > 0 && (
        <div className={S.surgeryBox}>
          <p className={S.surgeryBoxTitle}>Cirugía Programada:</p>
          <p className={S.surgeryBoxText}>
            {format(new Date(solicitud.surgeries[0].fecha), 'dd/MM/yyyy')} a las {typeof solicitud.surgeries[0].hora_inicio === 'string' ? solicitud.surgeries[0].hora_inicio.substring(0, 5) : solicitud.surgeries[0].hora_inicio}
          </p>
          <p className={S.surgeryBoxText}>
            Pabellón: {solicitud.surgeries[0].operating_rooms?.nombre}
          </p>
          {solicitud.surgeries[0].estado_hora === 'reagendado' && solicitud.surgeries[0].fecha_anterior && (
            <p className={S.surgeryReschNote}>
              Fecha original (ya no aplica): {format(new Date(solicitud.surgeries[0].fecha_anterior), 'dd/MM/yyyy')} a las {typeof solicitud.surgeries[0].hora_inicio_anterior === 'string' ? solicitud.surgeries[0].hora_inicio_anterior.substring(0, 5) : solicitud.surgeries[0].hora_inicio_anterior}
            </p>
          )}
        </div>
      )}

      <div className={S.cardFooter}>
        <div className={isDark ? S.createdDark : S.createdLight}>
          Creada el {format(new Date(solicitud.created_at), 'dd/MM/yyyy HH:mm')}
        </div>
        {solicitud.estado === 'pendiente' && (
          <button onClick={() => onEditarClick(solicitud)} className={S.editBtn}>
            <Edit className={S.iconSm} />
            Editar
          </button>
        )}
      </div>
    </div>
  )
}
