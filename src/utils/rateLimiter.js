/**
 * Utilidad para rate limiting en el frontend
 * Previene ataques de fuerza bruta limitando intentos de login
 */

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutos en milisegundos
const STORAGE_KEY_PREFIX = 'login_attempts_'

/**
 * Obtiene el contador de intentos fallidos para un identificador
 * @param {string} identifier - Email o username del usuario
 * @returns {Object} - { attempts: number, lockedUntil: number | null }
 */
export function getLoginAttempts(identifier) {
  const key = `${STORAGE_KEY_PREFIX}${identifier.toLowerCase()}`
  const stored = localStorage.getItem(key)
  
  if (!stored) {
    return { attempts: 0, lockedUntil: null }
  }
  
  try {
    const data = JSON.parse(stored)
    const now = Date.now()
    
    // Si el lockout ha expirado, resetear
    if (data.lockedUntil && now > data.lockedUntil) {
      localStorage.removeItem(key)
      return { attempts: 0, lockedUntil: null }
    }
    
    return {
      attempts: data.attempts || 0,
      lockedUntil: data.lockedUntil || null,
    }
  } catch (e) {
    // Si hay error parseando, resetear
    localStorage.removeItem(key)
    return { attempts: 0, lockedUntil: null }
  }
}

/**
 * Registra un intento de login fallido
 * @param {string} identifier - Email o username del usuario
 * @returns {Object} - { isLocked: boolean, remainingAttempts: number, lockoutTime: number | null }
 */
export function recordFailedAttempt(identifier) {
  const key = `${STORAGE_KEY_PREFIX}${identifier.toLowerCase()}`
  const current = getLoginAttempts(identifier)
  const newAttempts = current.attempts + 1
  const now = Date.now()
  
  let lockedUntil = null
  let isLocked = false
  
  // Si alcanzó el máximo de intentos, bloquear
  if (newAttempts >= MAX_ATTEMPTS) {
    lockedUntil = now + LOCKOUT_DURATION
    isLocked = true
  }
  
  localStorage.setItem(key, JSON.stringify({
    attempts: newAttempts,
    lockedUntil,
    lastAttempt: now,
  }))
  
  return {
    isLocked,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - newAttempts),
    lockoutTime: lockedUntil,
  }
}

/**
 * Limpia los intentos de login para un identificador (cuando el login es exitoso)
 * @param {string} identifier - Email o username del usuario
 */
export function clearLoginAttempts(identifier) {
  const key = `${STORAGE_KEY_PREFIX}${identifier.toLowerCase()}`
  localStorage.removeItem(key)
}

/**
 * Limpia todos los intentos de login (útil al cerrar sesión)
 */
export function clearAllLoginAttempts() {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith(STORAGE_KEY_PREFIX)) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * Verifica si un identificador está bloqueado
 * @param {string} identifier - Email o username del usuario
 * @returns {Object} - { isLocked: boolean, remainingTime: number | null }
 */
export function isLocked(identifier) {
  const current = getLoginAttempts(identifier)
  const now = Date.now()
  
  if (!current.lockedUntil) {
    return { isLocked: false, remainingTime: null }
  }
  
  if (now > current.lockedUntil) {
    // El bloqueo expiró, limpiar
    clearLoginAttempts(identifier)
    return { isLocked: false, remainingTime: null }
  }
  
  const remainingTime = Math.ceil((current.lockedUntil - now) / 1000) // segundos restantes
  
  return {
    isLocked: true,
    remainingTime,
  }
}

/**
 * Formatea el tiempo restante en un mensaje legible
 * @param {number} seconds - Segundos restantes
 * @returns {string} - Mensaje formateado
 */
export function formatRemainingTime(seconds) {
  if (!seconds) return ''
  
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  
  if (minutes > 0) {
    return `${minutes} minuto${minutes > 1 ? 's' : ''} y ${secs} segundo${secs !== 1 ? 's' : ''}`
  }
  
  return `${secs} segundo${secs !== 1 ? 's' : ''}`
}
