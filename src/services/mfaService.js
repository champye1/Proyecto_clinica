import { supabase } from '@/config/supabase'

// ─── Backup codes ──────────────────────────────────────────────────────────────

const BACKUP_CODE_COUNT  = 8
const BACKUP_CODE_CHARS  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin chars ambiguos

function generateRawCode() {
  return Array.from({ length: 16 }, () =>
    BACKUP_CODE_CHARS[Math.floor(Math.random() * BACKUP_CODE_CHARS.length)]
  ).join('').match(/.{4}/g).join('-') // XXXX-XXXX-XXXX-XXXX
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function normalizeCode(raw) {
  return raw.toUpperCase().replace(/-/g, '').replace(/\s/g, '')
}

/**
 * Genera 8 nuevos códigos de respaldo, los almacena hasheados y retorna los
 * códigos en texto plano (solo visibles en este momento).
 */
export async function generateBackupCodes(userId) {
  const codes = Array.from({ length: BACKUP_CODE_COUNT }, generateRawCode)
  const hashes = await Promise.all(codes.map(c => sha256(normalizeCode(c))))

  // Eliminar los anteriores y guardar los nuevos
  await supabase.from('mfa_backup_codes').delete().eq('user_id', userId)
  const { error } = await supabase.from('mfa_backup_codes').insert(
    hashes.map(code_hash => ({ user_id: userId, code_hash }))
  )
  if (error) return { codes: null, error }
  return { codes, error: null }
}

/**
 * Verifica un código de respaldo. Si es válido, lo marca como usado.
 * Retorna { valid: true } o { valid: false, error }.
 */
export async function verifyBackupCode(userId, rawCode) {
  const hash = await sha256(normalizeCode(rawCode))

  const { data, error } = await supabase
    .from('mfa_backup_codes')
    .select('id')
    .eq('user_id', userId)
    .eq('code_hash', hash)
    .is('used_at', null)
    .maybeSingle()

  if (error) return { valid: false, error }
  if (!data)  return { valid: false, error: new Error('Código inválido o ya utilizado.') }

  const { error: updateError } = await supabase
    .from('mfa_backup_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id)

  if (updateError) return { valid: false, error: updateError }
  return { valid: true, error: null }
}

/**
 * Retorna cuántos códigos de respaldo le quedan sin usar al usuario.
 */
export async function countRemainingBackupCodes(userId) {
  const { count, error } = await supabase
    .from('mfa_backup_codes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('used_at', null)
  return { count: count ?? 0, error }
}

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
