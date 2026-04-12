/**
 * Constantes para las claves de sessionStorage.
 * Centraliza todos los strings para evitar typos y facilitar renombrados.
 */
export const SESSION_KEYS = {
  /** Flag que indica que el login está siendo validado (evita redirección prematura) */
  VALIDATING_LOGIN: 'validating_login',

  /** Flag que indica que la sesión expiró (muestra aviso en la pantalla de inicio) */
  SESSION_EXPIRED: 'session_expired',

  /** Slot de horario seleccionado desde HorariosDisponibles hacia Solicitudes */
  SLOT_SELECCIONADO: 'slot_seleccionado',

  /** ID de la solicitud que está siendo gestionada en el flujo de calendario */
  SOLICITUD_GESTIONANDO: 'solicitud_gestionando',

  /** Flag para centrar el calendario en el día de hoy al navegar */
  CALENDARIO_IR_HOY: 'calendario_ir_hoy',
}
