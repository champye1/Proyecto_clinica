import { describe, it, expect } from 'vitest'
import {
  sanitizeString,
  sanitizeFormData,
  sanitizeNumber,
  sanitizeTime,
  sanitizeEmail,
  sanitizeRut,
  sanitizeCode,
  sanitizePassword,
} from '../sanitizeInput'

describe('sanitizeString', () => {
  it('retorna vacío para null o undefined', () => {
    expect(sanitizeString(null)).toBe('')
    expect(sanitizeString(undefined)).toBe('')
  })

  it('retorna vacío para tipos no-string', () => {
    expect(sanitizeString(123)).toBe('')
    expect(sanitizeString({})).toBe('')
  })

  it('hace trim por defecto', () => {
    expect(sanitizeString('  hola  ')).toBe('hola')
  })

  it('elimina tags script', () => {
    const input = 'texto<script>alert("xss")</script>normal'
    expect(sanitizeString(input)).not.toContain('<script>')
    expect(sanitizeString(input)).toContain('normal')
  })

  it('elimina tags iframe', () => {
    const input = '<iframe src="evil.com"></iframe>texto'
    expect(sanitizeString(input)).not.toContain('<iframe>')
  })

  it('elimina event handlers (onclick, etc.)', () => {
    const input = '<div onclick="evil()">texto</div>'
    const result = sanitizeString(input)
    expect(result).not.toContain('onclick')
  })

  it('elimina javascript: URLs', () => {
    const input = 'javascript:alert(1)'
    expect(sanitizeString(input)).not.toContain('javascript:')
  })

  it('elimina comentarios SQL (--)', () => {
    const input = "SELECT * FROM users -- comentario"
    expect(sanitizeString(input)).not.toContain('--')
  })

  it('elimina palabras clave SQL peligrosas', () => {
    const input = 'DROP TABLE users'
    expect(sanitizeString(input)).not.toMatch(/DROP\s+/i)
  })

  it('respeta maxLength', () => {
    const result = sanitizeString('hola mundo', { maxLength: 4 })
    expect(result.length).toBeLessThanOrEqual(4)
  })

  it('elimina caracteres de control', () => {
    const input = 'texto\x00\x1Fnormal'
    const result = sanitizeString(input)
    expect(result).not.toContain('\x00')
    expect(result).toContain('normal')
  })
})

describe('sanitizeNumber', () => {
  it('retorna vacío para null', () => {
    expect(sanitizeNumber(null)).toBe('')
  })

  it('permite dígitos y punto decimal', () => {
    expect(sanitizeNumber('12.34')).toBe('12.34')
  })

  it('elimina caracteres no numéricos', () => {
    expect(sanitizeNumber('abc123def')).toBe('123')
  })

  it('solo permite un punto decimal', () => {
    expect(sanitizeNumber('1.2.3')).toBe('1.23')
  })

  it('acepta números nativos', () => {
    expect(sanitizeNumber(42)).toBe('42')
  })
})

describe('sanitizeTime', () => {
  it('retorna vacío para null', () => {
    expect(sanitizeTime(null)).toBe('')
  })

  it('acepta formato HH:MM', () => {
    expect(sanitizeTime('08:30')).toBe('08:30')
  })

  it('elimina caracteres no permitidos', () => {
    expect(sanitizeTime('08:30abc')).toBe('08:30')
  })

  it('solo permite un colon', () => {
    expect(sanitizeTime('08:30:45')).toBe('08:30')
  })
})

describe('sanitizeEmail', () => {
  it('retorna vacío para null', () => {
    expect(sanitizeEmail(null)).toBe('')
  })

  it('permite caracteres de email válidos', () => {
    expect(sanitizeEmail('usuario@ejemplo.com')).toBe('usuario@ejemplo.com')
  })

  it('elimina caracteres especiales no permitidos en email', () => {
    const result = sanitizeEmail('user<script>@test.com')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
  })

  it('elimina espacios', () => {
    expect(sanitizeEmail('user @test.com')).toBe('user@test.com')
  })
})

describe('sanitizeRut', () => {
  it('retorna vacío para null', () => {
    expect(sanitizeRut(null)).toBe('')
  })

  it('permite dígitos, puntos, guiones y K', () => {
    expect(sanitizeRut('12.345.678-9')).toBe('12.345.678-9')
    expect(sanitizeRut('12345678-K')).toBe('12345678-K')
  })

  it('elimina caracteres no permitidos', () => {
    expect(sanitizeRut('12<script>345')).toBe('12345')
  })
})

describe('sanitizeCode', () => {
  it('elimina caracteres HTML peligrosos', () => {
    expect(sanitizeCode('<código>')).toBe('código')
    expect(sanitizeCode('código&123')).toBe('código123')
  })

  it('hace trim', () => {
    expect(sanitizeCode('  ABC123  ')).toBe('ABC123')
  })
})

describe('sanitizePassword', () => {
  it('retorna vacío para null', () => {
    expect(sanitizePassword(null)).toBe('')
  })

  it('elimina null bytes', () => {
    const result = sanitizePassword('pass\x00word')
    expect(result).not.toContain('\x00')
  })

  it('no hace trim (las contraseñas pueden tener espacios al inicio/fin)', () => {
    const result = sanitizePassword(' mypass ')
    expect(result).toContain(' ')
  })

  it('no escapa caracteres especiales de contraseña', () => {
    const password = 'P@ss#123!'
    expect(sanitizePassword(password)).toContain('@')
    expect(sanitizePassword(password)).toContain('#')
    expect(sanitizePassword(password)).toContain('!')
  })
})

describe('sanitizeFormData', () => {
  it('sanitiza todas las propiedades string del objeto', () => {
    const data = { nombre: '  Juan  ', email: 'juan<script>@test.com' }
    const result = sanitizeFormData(data)
    expect(result.nombre).toBe('Juan')
    expect(result.email).not.toContain('<script>')
  })

  it('mantiene valores no-string sin cambios', () => {
    const data = { edad: 25, activo: true }
    const result = sanitizeFormData(data)
    expect(result.edad).toBe(25)
    expect(result.activo).toBe(true)
  })

  it('sanitiza arrays de strings', () => {
    const data = { tags: ['<script>xss</script>', 'normal'] }
    const result = sanitizeFormData(data)
    expect(result.tags[0]).not.toContain('<script>')
    expect(result.tags[1]).toBe('normal')
  })

  it('retorna data sin cambios si no es objeto', () => {
    expect(sanitizeFormData(null)).toBe(null)
    expect(sanitizeFormData('string')).toBe('string')
  })
})
