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
} from '../mfaService'

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
