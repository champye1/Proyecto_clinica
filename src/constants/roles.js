/**
 * Roles de usuario del sistema.
 * Usar siempre estas constantes en lugar de strings literales.
 */
export const ROLES = {
  /** Administrador de la plataforma SurgicalHUB */
  SUPER_ADMIN:   'super_admin',
  /** Titular de la clínica — comprador del plan */
  ADMIN_CLINICA: 'admin_clinica',
  /** Personal de pabellón — gestiona solicitudes, calendario e insumos */
  PABELLON:      'pabellon',
  /** Médico — crea solicitudes y ve su calendario */
  DOCTOR:        'doctor',
}

/** Roles que tienen acceso al panel de pabellón */
export const ROLES_PABELLON = [ROLES.PABELLON, ROLES.ADMIN_CLINICA]

/** Roles que pueden invitar a otros usuarios */
export const ROLES_PUEDEN_INVITAR = [ROLES.PABELLON, ROLES.ADMIN_CLINICA]

/** Etiquetas legibles para mostrar en la UI */
export const ROL_LABEL = {
  [ROLES.SUPER_ADMIN]:   'Super Admin',
  [ROLES.ADMIN_CLINICA]: 'Titular de Clínica',
  [ROLES.PABELLON]:      'Pabellón',
  [ROLES.DOCTOR]:        'Médico',
}
