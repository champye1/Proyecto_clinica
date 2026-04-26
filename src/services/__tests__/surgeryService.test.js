import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRpc = vi.fn()
let fromChain

vi.mock('@/config/supabase', () => ({
  supabase: {
    rpc: (...args) => mockRpc(...args),
    from: () => fromChain,
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: { errorWithContext: vi.fn() },
}))

import {
  scheduleSurgery, rescheduleSurgery, cancelSurgery,
  fetchSurgeryById, fetchSurgeriesByDateRange, fetchSurgeriesForDoctor,
} from '../surgeryService'

describe('scheduleSurgery', () => {
  beforeEach(() => mockRpc.mockReset())

  it('retorna data al programar exitosamente', async () => {
    mockRpc.mockResolvedValue({ data: { id: 's1' }, error: null })
    const result = await scheduleSurgery({ surgeryRequestId: 'r1', operatingRoomId: 'or1', fecha: '2026-05-01', horaInicio: '08:00', horaFin: '10:00' })
    expect(result.data).toEqual({ id: 's1' })
    expect(result.error).toBeNull()
  })

  it('retorna error si falla el RPC', async () => {
    const err = { message: 'RPC error' }
    mockRpc.mockResolvedValue({ data: null, error: err })
    const result = await scheduleSurgery({ surgeryRequestId: 'r1', operatingRoomId: 'or1', fecha: '2026-05-01', horaInicio: '08:00', horaFin: '10:00' })
    expect(result.error).toEqual(err)
  })
})

describe('rescheduleSurgery', () => {
  it('retorna null error en éxito', async () => {
    fromChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    const result = await rescheduleSurgery('s1', { fecha: '2026-05-02', horaInicio: '09:00', horaFin: '11:00', operatingRoomId: 'or1' })
    expect(result.error).toBeNull()
  })

  it('retorna error si falla el update', async () => {
    const err = { message: 'Update failed' }
    fromChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: err }),
      }),
    }
    const result = await rescheduleSurgery('s1', { fecha: '2026-05-02', horaInicio: '09:00', horaFin: '11:00', operatingRoomId: 'or1' })
    expect(result.error).toEqual(err)
  })
})

describe('cancelSurgery', () => {
  it('retorna null error en éxito', async () => {
    fromChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    const result = await cancelSurgery('s1')
    expect(result.error).toBeNull()
  })
})

describe('fetchSurgeryById', () => {
  it('retorna la cirugía encontrada', async () => {
    const surgery = { id: 's1', doctor_id: 'd1', fecha: '2026-05-01' }
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: surgery, error: null }),
    }
    const result = await fetchSurgeryById('s1')
    expect(result.data).toEqual(surgery)
    expect(result.error).toBeNull()
  })
})

describe('fetchSurgeriesByDateRange', () => {
  it('retorna lista de cirugías', async () => {
    const cirugias = [{ id: 's1', fecha: '2026-05-01' }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: cirugias, error: null }),
    }
    const result = await fetchSurgeriesByDateRange('2026-05-01', '2026-05-31')
    expect(result.data).toEqual(cirugias)
  })

  it('retorna array vacío si hay error', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
    }
    const result = await fetchSurgeriesByDateRange('2026-05-01', '2026-05-31')
    expect(result.data).toEqual([])
  })
})

describe('fetchSurgeriesForDoctor', () => {
  it('retorna cirugías del doctor', async () => {
    const data = [{ id: 's1', doctor_id: 'd1' }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data, error: null }),
    }
    fromChain.order.mockReturnValue({ ...fromChain, order: vi.fn().mockReturnValue({ ...fromChain }) })
    fromChain.gte.mockResolvedValue({ data, error: null })
    const result = await fetchSurgeriesForDoctor('d1')
    expect(result.data).toEqual(data)
    expect(result.error).toBeNull()
  })

  it('retorna array vacío si hay error', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      order: vi.fn().mockReturnThis(),
    }
    const result = await fetchSurgeriesForDoctor('d1')
    expect(result.data).toEqual([])
    expect(result.error).toBeDefined()
  })
})
