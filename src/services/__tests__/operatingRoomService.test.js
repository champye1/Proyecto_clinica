import { describe, it, expect, vi } from 'vitest'

let fromImpl

vi.mock('@/config/supabase', () => ({
  supabase: { from: (table) => fromImpl(table) },
}))

vi.mock('@/utils/logger', () => ({
  logger: { errorWithContext: vi.fn() },
}))

vi.mock('@/utils/getClinicaId', () => ({
  getMyClinicaId: vi.fn().mockResolvedValue('c1'),
}))

import { fetchRooms } from '../operatingRoomService'

describe('fetchRooms', () => {
  it('retorna salas activas', async () => {
    const rooms = [{ id: 'r1', nombre: 'Pabellón 1', activo: true }]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: rooms, error: null }),
    }
    fromImpl = () => chain
    const result = await fetchRooms()
    expect(result.data).toEqual(rooms)
    expect(result.error).toBeNull()
  })

  it('retorna array vacío si hay error', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
    }
    fromImpl = () => chain
    const result = await fetchRooms()
    expect(result.data).toEqual([])
    expect(result.error).toBeDefined()
  })
})
