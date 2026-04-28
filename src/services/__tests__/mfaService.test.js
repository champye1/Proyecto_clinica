import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock crypto.subtle for SHA-256 hashing
const mockDigest = vi.fn()
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: { digest: mockDigest },
    getRandomValues: (arr) => { arr.fill(42); return arr },
  },
  writable: true,
})

const mockMfaGetLevel   = vi.fn()
const mockMfaList       = vi.fn()
const mockMfaEnroll     = vi.fn()
const mockMfaChallenge  = vi.fn()
const mockMfaVerify     = vi.fn()
const mockMfaUnenroll   = vi.fn()
const mockFrom          = vi.fn()

vi.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      mfa: {
        getAuthenticatorAssuranceLevel: () => mockMfaGetLevel(),
        listFactors:   () => mockMfaList(),
        enroll:        (args) => mockMfaEnroll(args),
        challenge:     (args) => mockMfaChallenge(args),
        verify:        (args) => mockMfaVerify(args),
        unenroll:      (args) => mockMfaUnenroll(args),
      },
    },
    from: (table) => mockFrom(table),
  },
}))

import {
  getAssuranceLevel,
  listFactors,
  enrollTOTP,
  createChallenge,
  verifyChallenge,
  unenrollFactor,
  challengeAndVerify,
  generateBackupCodes,
  verifyBackupCode,
  countRemainingBackupCodes,
} from '../mfaService'

beforeEach(() => { vi.clearAllMocks() })

// Helper: devuelve un objeto chainable de Supabase cuyo resultado final es `result`.
// Las llamadas intermedias (.eq, .is, .select, .update, .delete) devuelven el mismo
// chain; .insert/.maybeSingle/.single resuelven la promesa con `result`.
// El chain también es thenable para soportar `await chain.delete().eq(...)`.
function makeChain(result) {
  const chain = {}
  ;['delete', 'select', 'update', 'eq', 'is', 'limit', 'neq', 'lt'].forEach(
    m => { chain[m] = () => chain },
  )
  chain.insert      = () => Promise.resolve(result)
  chain.maybeSingle = () => Promise.resolve(result)
  chain.single      = () => Promise.resolve(result)
  chain.then        = (res, rej) => Promise.resolve(result).then(res, rej)
  chain.catch       = rej => Promise.resolve(result).catch(rej)
  return chain
}

// ─── getAssuranceLevel ────────────────────────────────────────────────────────
describe('getAssuranceLevel', () => {
  it('retorna los datos del nivel AAL', async () => {
    mockMfaGetLevel.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null })
    const { data, error } = await getAssuranceLevel()
    expect(data.currentLevel).toBe('aal1')
    expect(data.nextLevel).toBe('aal2')
    expect(error).toBeNull()
  })
})

// ─── listFactors ──────────────────────────────────────────────────────────────
describe('listFactors', () => {
  it('retorna los factores TOTP inscritos', async () => {
    mockMfaList.mockResolvedValue({ data: { totp: [{ id: 'factor-1', friendly_name: 'App' }] }, error: null })
    const { factors, error } = await listFactors()
    expect(factors).toHaveLength(1)
    expect(factors[0].id).toBe('factor-1')
    expect(error).toBeNull()
  })

  it('retorna array vacío si no hay factores', async () => {
    mockMfaList.mockResolvedValue({ data: { totp: [] }, error: null })
    const { factors } = await listFactors()
    expect(factors).toHaveLength(0)
  })
})

// ─── enrollTOTP ───────────────────────────────────────────────────────────────
describe('enrollTOTP', () => {
  it('retorna el factor con qrCode y secret', async () => {
    mockMfaEnroll.mockResolvedValue({
      data: { id: 'factor-new', totp: { qr_code: 'data:image/png;base64,...', secret: 'ABCDEF', uri: 'otpauth://...' } },
      error: null,
    })
    const { factor, error } = await enrollTOTP()
    expect(factor.id).toBe('factor-new')
    expect(factor.qrCode).toBe('data:image/png;base64,...')
    expect(factor.secret).toBe('ABCDEF')
    expect(error).toBeNull()
  })

  it('retorna error si falla la inscripción', async () => {
    mockMfaEnroll.mockResolvedValue({ data: null, error: new Error('Fallo') })
    const { factor, error } = await enrollTOTP()
    expect(factor).toBeNull()
    expect(error).toBeTruthy()
  })
})

// ─── createChallenge ──────────────────────────────────────────────────────────
describe('createChallenge', () => {
  it('retorna el challengeId', async () => {
    mockMfaChallenge.mockResolvedValue({ data: { id: 'challenge-1' }, error: null })
    const { challengeId, error } = await createChallenge('factor-1')
    expect(challengeId).toBe('challenge-1')
    expect(error).toBeNull()
  })
})

// ─── challengeAndVerify ───────────────────────────────────────────────────────
describe('challengeAndVerify', () => {
  it('crea challenge y verifica el código', async () => {
    mockMfaChallenge.mockResolvedValue({ data: { id: 'ch-1' }, error: null })
    mockMfaVerify.mockResolvedValue({ data: {}, error: null })
    const { error } = await challengeAndVerify('factor-1', '123456')
    expect(mockMfaChallenge).toHaveBeenCalledWith({ factorId: 'factor-1' })
    expect(mockMfaVerify).toHaveBeenCalledWith({ factorId: 'factor-1', challengeId: 'ch-1', code: '123456' })
    expect(error).toBeNull()
  })

  it('retorna error si createChallenge falla', async () => {
    mockMfaChallenge.mockResolvedValue({ data: null, error: new Error('Challenge fail') })
    const { error } = await challengeAndVerify('factor-1', '123456')
    expect(error).toBeTruthy()
    expect(mockMfaVerify).not.toHaveBeenCalled()
  })
})

// ─── unenrollFactor ───────────────────────────────────────────────────────────
describe('unenrollFactor', () => {
  it('desactiva el factor MFA', async () => {
    mockMfaUnenroll.mockResolvedValue({ data: {}, error: null })
    const { error } = await unenrollFactor('factor-1')
    expect(mockMfaUnenroll).toHaveBeenCalledWith({ factorId: 'factor-1' })
    expect(error).toBeNull()
  })
})

// ─── generateBackupCodes ──────────────────────────────────────────────────────
describe('generateBackupCodes', () => {
  beforeEach(() => {
    mockDigest.mockResolvedValue(new Uint8Array(32).fill(1).buffer)
  })

  it('genera 8 códigos en formato XXXX-XXXX-XXXX-XXXX', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ error: null }))  // delete anterior
      .mockReturnValueOnce(makeChain({ error: null }))  // insert nuevos
    const { codes, error } = await generateBackupCodes('user-123')
    expect(codes).toHaveLength(8)
    expect(error).toBeNull()
    codes.forEach(c =>
      expect(c).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    )
  })

  it('retorna error si el insert falla', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ error: null }))
      .mockReturnValueOnce(makeChain({ error: new Error('DB insert error') }))
    const { codes, error } = await generateBackupCodes('user-123')
    expect(codes).toBeNull()
    expect(error).toBeTruthy()
  })
})

// ─── verifyBackupCode ─────────────────────────────────────────────────────────
describe('verifyBackupCode', () => {
  beforeEach(() => {
    mockDigest.mockResolvedValue(new Uint8Array(32).fill(1).buffer)
  })

  it('retorna valid:true y marca el código como usado', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { id: 'code-1' }, error: null }))  // select
      .mockReturnValueOnce(makeChain({ error: null }))                           // update used_at
    const { valid, error } = await verifyBackupCode('user-123', 'AAAA-BBBB-CCCC-DDDD')
    expect(valid).toBe(true)
    expect(error).toBeNull()
  })

  it('retorna valid:false si el código no existe o ya fue usado', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }))
    const { valid, error } = await verifyBackupCode('user-123', 'XXXX-XXXX-XXXX-XXXX')
    expect(valid).toBe(false)
    expect(error).toBeTruthy()
  })

  it('retorna valid:false si el select devuelve error de DB', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: new Error('DB error') }))
    const { valid, error } = await verifyBackupCode('user-123', 'AAAA-BBBB-CCCC-DDDD')
    expect(valid).toBe(false)
    expect(error).toBeTruthy()
  })

  it('retorna valid:false si el update falla', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { id: 'code-1' }, error: null }))
      .mockReturnValueOnce(makeChain({ error: new Error('Update failed') }))
    const { valid, error } = await verifyBackupCode('user-123', 'AAAA-BBBB-CCCC-DDDD')
    expect(valid).toBe(false)
    expect(error).toBeTruthy()
  })
})

// ─── countRemainingBackupCodes ────────────────────────────────────────────────
describe('countRemainingBackupCodes', () => {
  it('retorna el conteo de códigos sin usar', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ count: 6, error: null }))
    const { count, error } = await countRemainingBackupCodes('user-123')
    expect(count).toBe(6)
    expect(error).toBeNull()
  })

  it('retorna 0 si no hay códigos disponibles', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ count: null, error: null }))
    const { count } = await countRemainingBackupCodes('user-123')
    expect(count).toBe(0)
  })
})
