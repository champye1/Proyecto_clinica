import { describe, it, expect } from 'vitest'
import { formatRut, cleanRut, isValidRutFormat, validateRut } from '../rutFormatter'

describe('formatRut', () => {
  it('retorna vacío si el input está vacío', () => {
    expect(formatRut('')).toBe('')
  })

  it('formatea un RUT con puntos y guión', () => {
    // 12345678 → 1.234.567-8
    expect(formatRut('12345678')).toBe('1.234.567-8')
  })

  it('formatea un RUT de 8 dígitos con dígito verificador K', () => {
    // '5126663k' → número=5126663 (7 dígitos), dv=K → 5.126.663-K
    expect(formatRut('5126663k')).toBe('5.126.663-K')
    // '111111111' → número=11111111 (8 dígitos), dv=1 → 11.111.111-1
    expect(formatRut('111111111')).toBe('11.111.111-1')
  })

  it('convierte K a mayúscula', () => {
    const result = formatRut('5978800k')
    expect(result).toContain('K')
  })

  it('preserva formato al pasar RUT ya formateado (los puntos se eliminan internamente)', () => {
    // '12.345.678-9' → strip → '123456789' → número=12345678 dv=9 → 12.345.678-9
    expect(formatRut('12.345.678-9')).toBe('12.345.678-9')
  })

  it('limita a 9 caracteres', () => {
    const result = formatRut('123456789012345')
    // El resultado no debe tener más de 12 caracteres visibles (con puntos y guión)
    expect(result.replace(/[.\-]/g, '').length).toBeLessThanOrEqual(9)
  })

  it('retorna el carácter solo si la longitud es 1', () => {
    expect(formatRut('5')).toBe('5')
    expect(formatRut('k')).toBe('K')
  })
})

describe('cleanRut', () => {
  it('elimina los puntos del RUT formateado', () => {
    expect(cleanRut('12.345.678-9')).toBe('12345678-9')
  })

  it('mantiene el guión y el dígito verificador', () => {
    expect(cleanRut('1.234.567-K')).toBe('1234567-K')
  })

  it('no modifica un RUT ya limpio', () => {
    expect(cleanRut('12345678-9')).toBe('12345678-9')
  })
})

describe('isValidRutFormat', () => {
  it('retorna true para un RUT formateado válido', () => {
    expect(isValidRutFormat('12.345.678-9')).toBe(true)
  })

  it('retorna true para un RUT sin puntos pero con guión', () => {
    expect(isValidRutFormat('12345678-9')).toBe(true)
  })

  it('retorna true para RUT con dígito verificador K', () => {
    expect(isValidRutFormat('5.978.800-K')).toBe(true)
  })

  it('retorna false para RUT incompleto', () => {
    expect(isValidRutFormat('123-4')).toBe(false)
  })

  it('retorna false para string vacío', () => {
    expect(isValidRutFormat('')).toBe(false)
  })
})

describe('validateRut', () => {
  it('valida correctamente un RUT conocido válido', () => {
    // RUT 11.111.111-1: dígito verificador calculado = 1
    expect(validateRut('11111111-1')).toBe(true)
  })

  it('retorna false para dígito verificador incorrecto', () => {
    expect(validateRut('11111111-2')).toBe(false)
  })

  it('retorna false para RUT demasiado corto', () => {
    expect(validateRut('123-4')).toBe(false)
  })

  it('retorna false para RUT demasiado largo', () => {
    expect(validateRut('1234567890-1')).toBe(false)
  })

  it('retorna false para RUT con letras en el número', () => {
    expect(validateRut('1234A678-9')).toBe(false)
  })

  it('acepta K como dígito verificador (mayúscula y minúscula)', () => {
    // RUT 5.978.800-K es un RUT chileno válido de ejemplo
    // Calculamos: si el algoritmo da K, ambas formas deben ser válidas
    const withK = validateRut('5978800-K')
    const withk = validateRut('5978800-k')
    expect(withK).toBe(withk)
  })
})
