import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRpc = vi.fn()
let fromChain
const mockResetPassword = vi.fn()

vi.mock('@/config/supabase', () => ({
  supabase: {
    rpc:  (...args) => mockRpc(...args),
    from: () => fromChain,
    auth: { resetPasswordForEmail: (...args) => mockResetPassword(...args) },
  },
}))
vi.mock('@/utils/logger', () => ({ logger: { errorWithContext: vi.fn() } }))

import {
  getAdminStats, getAllClinics, getAllUsers, getAuditLogs,
  createClinic, deactivateUser, reactivateUser, forceLogoutUser,
  extendTrial, activatePlan, suspendClinic, reactivateClinic,
  fetchPlans, sendBroadcast, deactivateBroadcast, sendPasswordReset,
} from '../adminService'

beforeEach(() => { vi.clearAllMocks() })

describe('getAdminStats', () => {
  it('retorna data en éxito', async () => {
    mockRpc.mockResolvedValueOnce({ data: { total_clinicas: 5 }, error: null })
    const result = await getAdminStats()
    expect(result.data).toEqual({ total_clinicas: 5 })
    expect(result.error).toBeNull()
  })
  it('retorna null y error en fallo', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Acceso denegado' } })
    const result = await getAdminStats()
    expect(result.data).toBeNull()
    expect(result.error).toBeDefined()
  })
})

describe('getAllClinics', () => {
  it('retorna lista de clínicas', async () => {
    const clinics = [{ id: 'c1', nombre: 'Clínica A' }]
    mockRpc.mockResolvedValueOnce({ data: clinics, error: null })
    const result = await getAllClinics()
    expect(result.data).toEqual(clinics)
    expect(result.error).toBeNull()
  })
  it('retorna array vacío en error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Error' } })
    const result = await getAllClinics()
    expect(result.data).toEqual([])
  })
  it('retorna array vacío cuando data es null sin error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })
    const result = await getAllClinics()
    expect(result.data).toEqual([])
  })
})

describe('getAllUsers', () => {
  it('retorna lista de usuarios', async () => {
    const users = [{ user_id: 'u1', email: 'a@b.com' }]
    mockRpc.mockResolvedValueOnce({ data: users, error: null })
    const result = await getAllUsers()
    expect(result.data).toEqual(users)
  })
})

describe('getAuditLogs', () => {
  it('llama con parámetros correctos', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null })
    await getAuditLogs({ page: 2, limit: 10 })
    expect(mockRpc).toHaveBeenCalledWith('get_audit_logs_admin', expect.objectContaining({
      p_limit: 10, p_offset: 20,
    }))
  })
  it('usa valores por defecto', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null })
    await getAuditLogs()
    expect(mockRpc).toHaveBeenCalledWith('get_audit_logs_admin', expect.objectContaining({
      p_limit: 50, p_offset: 0,
    }))
  })
})

describe('createClinic', () => {
  it('retorna data en éxito', async () => {
    mockRpc.mockResolvedValueOnce({ data: { success: true, clinica_id: 'c1' }, error: null })
    const result = await createClinic({ p_nombre: 'Test' })
    expect(result.data).toEqual({ success: true, clinica_id: 'c1' })
  })
})

describe('deactivateUser / reactivateUser', () => {
  it('deactivateUser llama al RPC correcto', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    const result = await deactivateUser('u1')
    expect(mockRpc).toHaveBeenCalledWith('admin_desactivar_usuario', { p_user_id: 'u1' })
    expect(result.error).toBeNull()
  })
  it('reactivateUser llama al RPC correcto', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await reactivateUser('u1')
    expect(mockRpc).toHaveBeenCalledWith('admin_reactivar_usuario', { p_user_id: 'u1' })
  })
})

describe('extendTrial', () => {
  it('pasa clinicaId y dias', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await extendTrial('c1', 7)
    expect(mockRpc).toHaveBeenCalledWith('extender_trial', { p_clinica_id: 'c1', p_dias: 7 })
  })
})

describe('activatePlan / suspendClinic / reactivateClinic', () => {
  it('activatePlan llama al RPC correcto', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await activatePlan('c1', 'p1')
    expect(mockRpc).toHaveBeenCalledWith('admin_activar_plan', { p_clinica_id: 'c1', p_plan_id: 'p1' })
  })
  it('suspendClinic retorna null error', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    const result = await suspendClinic('c1')
    expect(result.error).toBeNull()
  })
  it('reactivateClinic retorna null error', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    const result = await reactivateClinic('c1')
    expect(result.error).toBeNull()
  })
})

describe('fetchPlans', () => {
  it('retorna planes activos', async () => {
    const planes = [{ id: 'p1', nombre: 'Pro', precio_mensual_usd: 49 }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: planes, error: null }),
    }
    const result = await fetchPlans()
    expect(result.data).toEqual(planes)
  })
})

describe('sendPasswordReset', () => {
  it('llama a resetPasswordForEmail', async () => {
    mockResetPassword.mockResolvedValueOnce({ error: null })
    const result = await sendPasswordReset('a@b.com', 'https://app.com/reset')
    expect(mockResetPassword).toHaveBeenCalledWith('a@b.com', { redirectTo: 'https://app.com/reset' })
    expect(result.error).toBeNull()
  })
})

describe('sendBroadcast / deactivateBroadcast', () => {
  it('sendBroadcast retorna null error en éxito', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    const result = await sendBroadcast({ p_titulo: 'Test' })
    expect(result.error).toBeNull()
  })
  it('deactivateBroadcast pasa el id correcto', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await deactivateBroadcast('b1')
    expect(mockRpc).toHaveBeenCalledWith('admin_desactivar_broadcast', { p_id: 'b1' })
  })
})
