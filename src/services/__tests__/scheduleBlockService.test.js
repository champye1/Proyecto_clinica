import { describe, it, expect, vi, beforeEach } from 'vitest'

let fromChain

vi.mock('@/config/supabase', () => ({
  supabase: { from: () => fromChain },
}))

vi.mock('@/utils/logger', () => ({
  logger: { errorWithContext: vi.fn() },
}))

vi.mock('@/services/authService', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ user: { id: 'u1' } }),
}))

import { fetchBlocks, fetchBlocksForSlot, createBlock, updateBlock, deleteBlock } from '../scheduleBlockService'

describe('fetchBlocks', () => {
  it('retorna lista de bloqueos', async () => {
    const blocks = [{ id: 'b1', fecha: '2026-05-01' }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      order2: vi.fn().mockResolvedValue({ data: blocks, error: null }),
    }
    fromChain.order.mockReturnValueOnce({ ...fromChain, order: vi.fn().mockResolvedValue({ data: blocks, error: null }) })
    const result = await fetchBlocks()
    expect(result.data).toEqual(blocks)
    expect(result.error).toBeNull()
  })

  it('retorna array vacío si hay error', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValueOnce({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      }),
    }
    const result = await fetchBlocks()
    expect(result.data).toEqual([])
    expect(result.error).toBeDefined()
  })
})

describe('fetchBlocksForSlot', () => {
  it('retorna bloqueos para el slot', async () => {
    const blocks = [{ id: 'b1', hora_inicio: '08:00', hora_fin: '10:00' }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockResolvedValue({ data: blocks, error: null }),
    }
    const result = await fetchBlocksForSlot('2026-05-01', 'or1')
    expect(result.data).toEqual(blocks)
    expect(result.error).toBeNull()
  })

  it('retorna array vacío si hay error', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
    }
    const result = await fetchBlocksForSlot('2026-05-01', 'or1')
    expect(result.data).toEqual([])
  })
})

describe('createBlock', () => {
  it('crea bloqueo exitosamente', async () => {
    const block = { id: 'b1', fecha: '2026-05-01' }
    fromChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: block, error: null }),
    }
    const result = await createBlock({ fecha: '2026-05-01', operating_room_id: 'or1', hora_inicio: '08:00', hora_fin: '10:00' })
    expect(result.data).toEqual(block)
    expect(result.error).toBeNull()
  })

  it('retorna error si falla el insert', async () => {
    fromChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
    }
    const result = await createBlock({ fecha: '2026-05-01' })
    expect(result.data).toBeNull()
    expect(result.error).toBeDefined()
  })
})

describe('updateBlock', () => {
  it('actualiza bloqueo exitosamente', async () => {
    const updated = { id: 'b1', hora_inicio: '09:00' }
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    }
    const result = await updateBlock('b1', { hora_inicio: '09:00' })
    expect(result.data).toEqual(updated)
    expect(result.error).toBeNull()
  })
})

describe('deleteBlock', () => {
  it('elimina bloqueo (soft delete)', async () => {
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    const result = await deleteBlock('b1')
    expect(result.error).toBeNull()
  })

  it('retorna error si falla', async () => {
    const err = { message: 'Delete failed' }
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: err }),
    }
    const result = await deleteBlock('b1')
    expect(result.error).toEqual(err)
  })
})
