import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetSession = vi.fn()
const mockInvoke = vi.fn()
let fromChain

vi.mock('@/config/supabase', () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
    from: () => fromChain,
    functions: { invoke: (...args) => mockInvoke(...args) },
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: { errorWithContext: vi.fn() },
}))

import { listDoctors, getDoctorByUserId, getDoctorUserIdById, updateDoctor, toggleDoctorAccess, toggleDoctorStatus } from '../doctorService'

describe('listDoctors', () => {
  it('retorna lista de médicos', async () => {
    const doctors = [{ id: 'd1', nombre: 'Juan', apellido: 'Pérez' }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: doctors, error: null }),
    }
    const result = await listDoctors()
    expect(result.data).toEqual(doctors)
    expect(result.error).toBeNull()
  })

  it('retorna array vacío si hay error', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
    }
    const result = await listDoctors()
    expect(result.data).toEqual([])
  })
})

describe('getDoctorByUserId', () => {
  it('retorna el médico del usuario', async () => {
    const doctor = { id: 'd1', user_id: 'u1' }
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: doctor, error: null }),
    }
    const result = await getDoctorByUserId('u1')
    expect(result.data).toEqual(doctor)
    expect(result.error).toBeNull()
  })

  it('retorna null si no existe', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const result = await getDoctorByUserId('u999')
    expect(result.data).toBeNull()
  })
})

describe('getDoctorUserIdById', () => {
  it('retorna el user_id del médico', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { user_id: 'u1' }, error: null }),
    }
    const result = await getDoctorUserIdById('d1')
    expect(result.data?.user_id).toBe('u1')
  })
})

describe('updateDoctor', () => {
  it('retorna null error en éxito', async () => {
    fromChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    const result = await updateDoctor('d1', { nombre: 'Pedro' })
    expect(result.error).toBeNull()
  })
})

describe('toggleDoctorAccess', () => {
  it('actualiza acceso_web_enabled', async () => {
    fromChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    const result = await toggleDoctorAccess('d1', false)
    expect(result.error).toBeNull()
  })
})

describe('toggleDoctorStatus', () => {
  it('cambia estado activo a vacaciones', async () => {
    fromChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    const result = await toggleDoctorStatus('d1', 'activo')
    expect(result.nuevoEstado).toBe('vacaciones')
    expect(result.error).toBeNull()
  })

  it('cambia estado vacaciones a activo', async () => {
    fromChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    const result = await toggleDoctorStatus('d1', 'vacaciones')
    expect(result.nuevoEstado).toBe('activo')
  })
})
