import { CalendarClock, CheckCircle, Eye } from 'lucide-react'
import { format } from 'date-fns'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { STYLES } from './solicitudes.styles'

export default function SolicitudCard({
  solicitud,
  isDark,
  isMedical,
  onVerDetalle,
  onAceptarHorario,
  onAvisoReagendacion,
  onAceptarYProgramar,
  onGestionarHora,
  onReagendar,
  tieneHorarioPreferido,
  getPriorityColor,
  getPriorityBadge,
  getInitial,
  getProcedureName,
  programarConHorarioDelMedico,
  reagendarConHorarioDelMedico,
  solicitudAceptandoHorario,
}) {
  const initial        = getInitial(solicitud.patients?.nombre)
  const priorityColor  = getPriorityColor(solicitud)
  const priorityBadge  = getPriorityBadge(solicitud)
  const procedureName  = getProcedureName(solicitud.codigo_operacion)

  return (
    <div className={isDark ? STYLES.cardDark : isMedical ? STYLES.cardMedical : STYLES.cardLight}>
      <div className={`w-12 h-12 sm:w-14 sm:h-14 ${priorityColor} rounded-full flex items-center justify-center font-black text-base sm:text-lg text-white shadow-inner mb-3 sm:mb-0 flex-shrink-0`}>
        {initial}
      </div>

      <div className={STYLES.cardCenter}>
        <div className={STYLES.cardHeaderRow}>
          <h4 className={isDark ? STYLES.cardNameDark : STYLES.cardNameLight}>
            {solicitud.patients?.nombre} {solicitud.patients?.apellido}
          </h4>
          <span className={`px-2 py-0.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${priorityBadge.bg} ${priorityBadge.textColor} flex-shrink-0`}>
            {priorityBadge.text}
          </span>
        </div>

        <div className={isDark ? STYLES.cardMetaDark : STYLES.cardMetaLight}>
          {procedureName} •{' '}
          <span className={isDark ? STYLES.cardDoctorDark : STYLES.cardDoctorLight}>
            Dr. {solicitud.doctors?.apellido || solicitud.doctors?.nombre} {solicitud.doctors?.apellido}
          </span>
        </div>

        {solicitud.reagendamiento_notificado_at && (
          <div className={isDark ? STYLES.reagendBadgeDark : STYLES.reagendBadgeLight}>
            <CalendarClock className={STYLES.iconCalClock} />
            <span>El doctor solicitó reagendamiento ({format(new Date(solicitud.reagendamiento_notificado_at), 'dd/MM/yyyy HH:mm')})</span>
          </div>
        )}

        <div className={STYLES.cardActions}>
          <button
            onClick={() => onVerDetalle(solicitud)}
            className={isDark ? STYLES.viewBtnDark : STYLES.viewBtnLight}
            title="Ver detalles"
          >
            <Eye className={STYLES.iconSm4} />
          </button>

          {solicitud.estado === 'aceptada' && solicitud.reagendamiento_notificado_at && (
            <>
              {tieneHorarioPreferido(solicitud) && (
                <button
                  onClick={() => onAceptarHorario(solicitud)}
                  disabled={programarConHorarioDelMedico.isPending || reagendarConHorarioDelMedico.isPending}
                  className={STYLES.acceptBtn}
                  title="Aceptar horario propuesto por el médico"
                >
                  {reagendarConHorarioDelMedico.isPending && solicitudAceptandoHorario?.id === solicitud.id ? (
                    <><LoadingSpinner size="sm" />Aceptando...</>
                  ) : (
                    <><CheckCircle className={STYLES.iconSm4} />ACEPTAR HORARIO MÉDICO</>
                  )}
                </button>
              )}
              <button
                onClick={() => onReagendar(solicitud)}
                className={STYLES.reagendarBtn}
                title="Cambiar fecha/hora de la cirugía"
              >
                <CalendarClock className={STYLES.iconSm4} />
                REAGENDAR
              </button>
            </>
          )}

          {solicitud.estado === 'pendiente' && (
            <>
              {tieneHorarioPreferido(solicitud) && (
                <button
                  onClick={() => onAceptarHorario(solicitud)}
                  disabled={programarConHorarioDelMedico.isPending || reagendarConHorarioDelMedico.isPending}
                  className={STYLES.acceptBtn}
                >
                  {programarConHorarioDelMedico.isPending && solicitudAceptandoHorario?.id === solicitud.id ? (
                    <><LoadingSpinner size="sm" />Aceptando...</>
                  ) : (
                    <><CheckCircle className={STYLES.iconSm4} />ACEPTAR HORARIO MÉDICO</>
                  )}
                </button>
              )}
              {tieneHorarioPreferido(solicitud) && (
                <button
                  onClick={() => onAvisoReagendacion(solicitud)}
                  className={STYLES.reagendarBtn}
                  title="Enviar aviso al médico para nueva propuesta de horario"
                >
                  <CalendarClock className={STYLES.iconSm4} />
                  ENVIAR AVISO DE REAGENDACIÓN
                </button>
              )}
              {!solicitud.dejar_fecha_a_pabellon && (
                <button
                  onClick={() => onAceptarYProgramar(solicitud)}
                  className={STYLES.gestionarBtn}
                >
                  GESTIONAR CUPO
                </button>
              )}
              {solicitud.dejar_fecha_a_pabellon && (
                <button
                  onClick={() => onGestionarHora(solicitud)}
                  className={STYLES.gestionarHoraBtn}
                  title="Abrir calendario diario para elegir horario"
                >
                  GESTIONAR HORA
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
