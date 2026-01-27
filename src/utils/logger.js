/**
 * Sistema de logging para la aplicación
 * Reemplaza console.log/error/warn con un sistema más controlado
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
}

// En producción, solo mostrar ERROR y WARN
const CURRENT_LOG_LEVEL = import.meta.env.PROD ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG

/**
 * Logger principal
 */
export const logger = {
  debug: (...args) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log('[DEBUG]', ...args)
    }
  },
  
  info: (...args) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.info('[INFO]', ...args)
    }
  },
  
  warn: (...args) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      console.warn('[WARN]', ...args)
    }
  },
  
  error: (...args) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error('[ERROR]', ...args)
    }
  },
  
  // Para errores de mutaciones/operaciones críticas
  errorWithContext: (context, error, additionalData = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${context}:`, {
        message: error?.message || error?.toString() || 'Error desconocido',
        error,
        ...additionalData,
      })
    }
  },
}
