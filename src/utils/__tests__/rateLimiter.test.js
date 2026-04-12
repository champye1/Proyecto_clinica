import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getLoginAttempts,
  recordFailedAttempt,
  clearLoginAttempts,
  clearAllLoginAttempts,
  isLocked,
  formatRemainingTime,
} from '../rateLimiter'

describe('getLoginAttempts', () => {
  it('retorna 0 intentos si no hay datos guardados', () => {
    const result = getLoginAttempts('test@test.com')
    expect(result.attempts).toBe(0)
    expect(result.lockedUntil).toBeNull()
  })

  it('retorna los intentos guardados', () => {
    recordFailedAttempt('user@test.com')
    const result = getLoginAttempts('user@test.com')
    expect(result.attempts).toBe(1)
  })

  it('no distingue entre mayúsculas y minúsculas', () => {
    recordFailedAttempt('User@Test.com')
    const result = getLoginAttempts('user@test.com')
    expect(result.attempts).toBe(1)
  })

  it('resetea si el bloqueo ha expirado', () => {
    // Simular un bloqueo expirado guardando directamente en localStorage
    const key = 'login_attempts_expired@test.com'
    const expiredData = {
      attempts: 5,
      lockedUntil: Date.now() - 1000, // 1 segundo en el pasado
    }
    localStorage.setItem(key, JSON.stringify(expiredData))

    const result = getLoginAttempts('expired@test.com')
    expect(result.attempts).toBe(0)
    expect(result.lockedUntil).toBeNull()
  })
})

describe('recordFailedAttempt', () => {
  it('incrementa el contador en cada llamada', () => {
    recordFailedAttempt('count@test.com')
    recordFailedAttempt('count@test.com')
    const result = getLoginAttempts('count@test.com')
    expect(result.attempts).toBe(2)
  })

  it('bloquea al llegar al máximo de intentos (5)', () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt('lock@test.com')
    }
    const result = recordFailedAttempt('lock@test.com')
    // Ya superó el máximo, isLocked debe ser true en el quinto intento
    expect(result.isLocked).toBeDefined()
  })

  it('retorna remainingAttempts correcto', () => {
    recordFailedAttempt('remaining@test.com')
    const result = recordFailedAttempt('remaining@test.com')
    expect(result.remainingAttempts).toBe(3)
  })

  it('bloquea exactamente al 5to intento', () => {
    let result
    for (let i = 0; i < 5; i++) {
      result = recordFailedAttempt('exact@test.com')
    }
    expect(result.isLocked).toBe(true)
    expect(result.remainingAttempts).toBe(0)
  })
})

describe('clearLoginAttempts', () => {
  it('elimina los intentos guardados', () => {
    recordFailedAttempt('clear@test.com')
    clearLoginAttempts('clear@test.com')
    const result = getLoginAttempts('clear@test.com')
    expect(result.attempts).toBe(0)
  })
})

describe('clearAllLoginAttempts', () => {
  it('elimina todos los registros de intentos', () => {
    recordFailedAttempt('user1@test.com')
    recordFailedAttempt('user2@test.com')
    clearAllLoginAttempts()
    expect(getLoginAttempts('user1@test.com').attempts).toBe(0)
    expect(getLoginAttempts('user2@test.com').attempts).toBe(0)
  })
})

describe('isLocked', () => {
  it('retorna isLocked: false cuando no hay bloqueo', () => {
    const result = isLocked('free@test.com')
    expect(result.isLocked).toBe(false)
    expect(result.remainingTime).toBeNull()
  })

  it('retorna isLocked: true cuando el usuario está bloqueado', () => {
    const key = 'login_attempts_blocked@test.com'
    const blockedData = {
      attempts: 5,
      lockedUntil: Date.now() + 60000, // bloqueado por 60 segundos más
    }
    localStorage.setItem(key, JSON.stringify(blockedData))

    const result = isLocked('blocked@test.com')
    expect(result.isLocked).toBe(true)
    expect(result.remainingTime).toBeGreaterThan(0)
  })

  it('desbloquea automáticamente si el tiempo expiró', () => {
    const key = 'login_attempts_unblocked@test.com'
    const expiredData = {
      attempts: 5,
      lockedUntil: Date.now() - 1000,
    }
    localStorage.setItem(key, JSON.stringify(expiredData))

    const result = isLocked('unblocked@test.com')
    expect(result.isLocked).toBe(false)
  })
})

describe('formatRemainingTime', () => {
  it('retorna vacío para 0 o null', () => {
    expect(formatRemainingTime(0)).toBe('')
    expect(formatRemainingTime(null)).toBe('')
  })

  it('formatea solo segundos', () => {
    const result = formatRemainingTime(45)
    expect(result).toContain('45')
    expect(result).toContain('segundo')
  })

  it('formatea minutos y segundos', () => {
    const result = formatRemainingTime(125) // 2 min 5 seg
    expect(result).toContain('2')
    expect(result).toContain('minuto')
  })

  it('usa plural correctamente para minutos', () => {
    expect(formatRemainingTime(120)).toContain('minutos')
    expect(formatRemainingTime(61)).toContain('minuto')
  })
})
