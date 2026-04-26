import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRpc = vi.fn()
let fromChain
const mockSignUp = vi.fn()
const mockResend = vi.fn()
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock('@/config/supabase', () => ({
  supabase: {
    rpc:  (...args) => mockRpc(...args),
    from: () => fromChain,
    auth: {
      signUp: (...args) => mockSignUp(...args),
      resend: (...args) => mockResend(...args),
      getSession: (...args) => mockGetSession(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
      updateUser: (...args) => mockUpdateUser(...args),
    },
  },
}))
vi.mock('@/utils/logger', () => ({ logger: { errorWithContext: vi.fn() } }))

import {
  signUpClinica, registerClinica, resendConfirmation, getSession,
  choosePlan, updatePassword, signUpInvitedUser, createUserRecord,
  createDoctorRecord, updateUserRecord, checkInvitationCode,
  markInvitationUsed, markInvitationUsedById, checkSuperAdminExists,
  setupSuperAdminRecord,
} from '../onboardingService'

beforeEach(() => { vi.clearAllMocks() })

describe('signUpClinica', () => {
  it('retorna data del usuario creado', async () => {
    const user = { id: 'u1', email: 'a@b.com' }
    mockSignUp.mockResolvedValueOnce({ data: { user }, error: null })
    const result = await signUpClinica('a@b.com', 'pass123')
    expect(result.data).toEqual({ user })
    expect(result.error).toBeNull()
  })
  it('pasa metadata y redirectTo', async () => {
    mockSignUp.mockResolvedValueOnce({ data: {}, error: null })
    await signUpClinica('a@b.com', 'pass', { metadata: { nombre: 'Test' }, redirectTo: 'https://app/confirm' })
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pass',
      options: { data: { nombre: 'Test' }, emailRedirectTo: 'https://app/confirm' },
    })
  })
  it('retorna error en fallo', async () => {
    mockSignUp.mockResolvedValueOnce({ data: null, error: { message: 'Email en uso' } })
    const result = await signUpClinica('dup@b.com', 'pass')
    expect(result.error).toBeDefined()
  })
})

describe('registerClinica', () => {
  it('llama al RPC correcto', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    const result = await registerClinica({ p_nombre: 'Clínica' })
    expect(mockRpc).toHaveBeenCalledWith('registrar_clinica', { p_nombre: 'Clínica' })
    expect(result.error).toBeNull()
  })
})

describe('resendConfirmation', () => {
  it('llama a auth.resend con tipo signup', async () => {
    mockResend.mockResolvedValueOnce({ error: null })
    await resendConfirmation('a@b.com')
    expect(mockResend).toHaveBeenCalledWith({ type: 'signup', email: 'a@b.com' })
  })
})

describe('getSession', () => {
  it('retorna la sesión', async () => {
    const session = { access_token: 'tok' }
    mockGetSession.mockResolvedValueOnce({ data: { session }, error: null })
    const result = await getSession()
    expect(result.session).toEqual(session)
  })
})

describe('choosePlan', () => {
  it('llama al RPC con el plan id', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await choosePlan('plan-pro')
    expect(mockRpc).toHaveBeenCalledWith('actualizar_plan_clinica', { p_plan_id: 'plan-pro' })
  })
})

describe('updatePassword', () => {
  it('llama a auth.updateUser', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: null })
    const result = await updatePassword('newPass123')
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newPass123' })
    expect(result.error).toBeNull()
  })
})

describe('createUserRecord', () => {
  it('llama a from("users").insert', async () => {
    fromChain = { insert: vi.fn().mockResolvedValue({ error: null }) }
    const result = await createUserRecord({ id: 'u1', role: 'pabellon' })
    expect(fromChain.insert).toHaveBeenCalledWith({ id: 'u1', role: 'pabellon' })
    expect(result.error).toBeNull()
  })
})

describe('createDoctorRecord', () => {
  it('llama a from("doctors").insert', async () => {
    fromChain = { insert: vi.fn().mockResolvedValue({ error: null }) }
    const result = await createDoctorRecord({ nombre: 'Dr. Test' })
    expect(fromChain.insert).toHaveBeenCalledWith({ nombre: 'Dr. Test' })
    expect(result.error).toBeNull()
  })
})

describe('updateUserRecord', () => {
  it('llama a from("users").update', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    fromChain = { update: vi.fn().mockReturnValue({ eq: eqFn }) }
    const result = await updateUserRecord('u1', { role: 'admin_clinica' })
    expect(fromChain.update).toHaveBeenCalledWith({ role: 'admin_clinica' })
    expect(eqFn).toHaveBeenCalledWith('id', 'u1')
    expect(result.error).toBeNull()
  })
})

describe('checkInvitationCode', () => {
  it('retorna la respuesta del RPC', async () => {
    const rpcData = { valido: true, clinica_id: 'c1' }
    mockRpc.mockResolvedValueOnce({ data: rpcData, error: null })
    const result = await checkInvitationCode('CODE123')
    expect(result).toEqual(rpcData)
  })
  it('retorna valido:false en error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Error' } })
    const result = await checkInvitationCode('BAD')
    expect(result.valido).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('markInvitationUsed', () => {
  it('actualiza la fila por token', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    fromChain = { update: vi.fn().mockReturnValue({ eq: eqFn }) }
    const result = await markInvitationUsed('tok123')
    expect(eqFn).toHaveBeenCalledWith('token', 'tok123')
    expect(result.error).toBeNull()
  })
})

describe('markInvitationUsedById', () => {
  it('actualiza la fila por id con userId', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    fromChain = { update: vi.fn().mockReturnValue({ eq: eqFn }) }
    await markInvitationUsedById('inv1', 'u1')
    expect(eqFn).toHaveBeenCalledWith('id', 'inv1')
  })
})

describe('checkSuperAdminExists', () => {
  it('retorna data del RPC', async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null })
    const result = await checkSuperAdminExists()
    expect(result.data).toBe(true)
    expect(result.error).toBeNull()
  })
})

describe('setupSuperAdminRecord', () => {
  it('llama al RPC con userId y email', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await setupSuperAdminRecord('u1', 'admin@app.com')
    expect(mockRpc).toHaveBeenCalledWith('setup_super_admin_record', { p_user_id: 'u1', p_email: 'admin@app.com' })
  })
})
