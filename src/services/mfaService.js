import { supabase } from '@/config/supabase'

/**
 * Verifica el nivel de seguridad actual de la sesión.
 * currentLevel: 'aal1' (solo password) | 'aal2' (password + MFA)
 * nextLevel:    'aal1' (sin MFA inscrito) | 'aal2' (tiene MFA inscrito, debe verificar)
 */
export async function getAssuranceLevel() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  return { data, error }
}

/** Retorna los factores MFA inscritos del usuario actual. */
export async function listFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors()
  return { factors: data?.totp ?? [], error }
}

/**
 * Inicia la inscripción de un factor TOTP.
 * Retorna la URI para generar el QR y el secreto manual.
 */
export async function enrollTOTP() {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
  if (error) return { factor: null, error }
  return {
    factor: {
      id:     data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri:    data.totp.uri,
    },
    error: null,
  }
}

/**
 * Crea un challenge para un factor MFA.
 * Debe llamarse antes de verify.
 */
export async function createChallenge(factorId) {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId })
  return { challengeId: data?.id ?? null, error }
}

/**
 * Verifica el código TOTP del usuario.
 * Eleva la sesión a AAL2 si es correcto.
 */
export async function verifyChallenge(factorId, challengeId, code) {
  const { data, error } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
  return { data, error }
}

/**
 * Elimina un factor MFA inscrito.
 * El usuario queda con solo password (AAL1).
 */
export async function unenrollFactor(factorId) {
  const { data, error } = await supabase.auth.mfa.unenroll({ factorId })
  return { data, error }
}

/**
 * Flujo completo: crea challenge y verifica el código en un solo paso.
 */
export async function challengeAndVerify(factorId, code) {
  const { challengeId, error: challengeError } = await createChallenge(factorId)
  if (challengeError) return { error: challengeError }
  return verifyChallenge(factorId, challengeId, code)
}
