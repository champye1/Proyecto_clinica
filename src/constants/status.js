/**
 * Estados del sistema.
 * Usar siempre estas constantes en lugar de strings literales.
 */

/** Estados de una solicitud de cirugía */
export const SURGERY_REQUEST_STATUS = {
  PENDIENTE:  'pendiente',
  ACEPTADA:   'aceptada',
  RECHAZADA:  'rechazada',
  REAGENDADA: 'reagendada',
  CANCELADA:  'cancelada',
}

/** Estados de un médico (tabla doctors) */
export const DOCTOR_STATUS = {
  ACTIVO:     'activo',
  INACTIVO:   'inactivo',
  VACACIONES: 'vacaciones',
}

/** Estados de una invitación */
export const INVITATION_STATUS = {
  PENDIENTE:   'pendiente',
  ACEPTADA:    'aceptada',
  EXPIRADA:    'expirada',
  DESACTIVADA: 'desactivada',
}

/** Tipos de evento en la tabla clinica_actividad */
export const ACTIVIDAD_TIPO = {
  CIRUGIA_ACEPTADA:    'cirugia_aceptada',
  CIRUGIA_RECHAZADA:   'cirugia_rechazada',
  CIRUGIA_REAGENDADA:  'cirugia_reagendada',
  CIRUGIA_ACTUALIZADA: 'cirugia_actualizada',
  BLOQUEO_CREADO:      'bloqueo_creado',
  USUARIO_INVITADO:    'usuario_invitado',
}
