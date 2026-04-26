const RULES = [
  { test: p => p.length >= 12,          message: 'Al menos 12 caracteres' },
  { test: p => /[A-Z]/.test(p),         message: 'Al menos una letra mayúscula' },
  { test: p => /[0-9]/.test(p),         message: 'Al menos un número' },
  { test: p => /[^A-Za-z0-9]/.test(p),  message: 'Al menos un carácter especial (!@#$%&*)' },
]

export function validatePasswordStrength(password) {
  const failed = RULES.filter(r => !r.test(password))
  return {
    isValid: failed.length === 0,
    errors: failed.map(r => r.message),
    score: RULES.length - failed.length,
  }
}

export function getPasswordStrengthLabel(score) {
  if (score <= 1) return { label: 'Muy débil', color: 'bg-red-500' }
  if (score === 2) return { label: 'Débil', color: 'bg-orange-500' }
  if (score === 3) return { label: 'Aceptable', color: 'bg-yellow-500' }
  return { label: 'Fuerte', color: 'bg-green-500' }
}
