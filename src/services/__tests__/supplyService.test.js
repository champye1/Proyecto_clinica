import { describe, it, expect, vi } from 'vitest'

let fromChain

vi.mock('@/config/supabase', () => ({
  supabase: { from: () => fromChain },
}))

vi.mock('@/utils/logger', () => ({
  logger: { errorWithContext: vi.fn() },
}))

import { fetchSupplies, fetchActiveSupplies, checkCodeExists, createSupply, updateSupply, deleteSupply } from '../supplyService'

describe('fetchSupplies', () => {
  it('retorna insumos sin filtro', async () => {
    const supplies = [{ id: 's1', nombre: 'Bisturí', activo: true }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: supplies, error: null }),
    }
    const result = await fetchSupplies()
    expect(result.data).toEqual(supplies)
    expect(result.error).toBeNull()
  })

  it('retorna array vacío si hay error', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
    }
    const result = await fetchSupplies()
    expect(result.data).toEqual([])
    expect(result.error).toBeDefined()
  })

  it('aplica filtro de búsqueda por nombre', async () => {
    const supplies = [{ id: 's1', nombre: 'Bisturí' }]
    const ilikeMock = vi.fn().mockResolvedValue({ data: supplies, error: null })
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      ilike: ilikeMock,
    }
    fromChain.order.mockReturnValue({ ...fromChain, ilike: ilikeMock })
    fromChain.is.mockReturnValue({ ...fromChain })
    fromChain.eq.mockReturnValue({ ...fromChain })
    const result = await fetchSupplies({ search: 'bisturí' })
    expect(result.data).toEqual(supplies)
  })
})

describe('fetchActiveSupplies', () => {
  it('retorna insumos activos', async () => {
    const supplies = [{ id: 's1', nombre: 'Bisturí' }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: supplies, error: null }),
    }
    const result = await fetchActiveSupplies()
    expect(result.data).toEqual(supplies)
    expect(result.error).toBeNull()
  })
})

describe('checkCodeExists', () => {
  it('retorna exists: true si código existe', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 's1' }, error: null }),
    }
    const result = await checkCodeExists('CODE-001')
    expect(result.exists).toBe(true)
    expect(result.error).toBeNull()
  })

  it('retorna exists: false si código no existe', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const result = await checkCodeExists('CODE-999')
    expect(result.exists).toBe(false)
  })
})

describe('createSupply', () => {
  it('crea insumo exitosamente', async () => {
    const supply = { id: 's1', nombre: 'Bisturí', codigo: 'B001' }
    fromChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: supply, error: null }),
    }
    const result = await createSupply({ nombre: 'Bisturí', codigo: 'B001' })
    expect(result.data).toEqual(supply)
    expect(result.error).toBeNull()
  })

  it('retorna error si falla el insert', async () => {
    fromChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Duplicate' } }),
    }
    const result = await createSupply({ nombre: 'Bisturí', codigo: 'B001' })
    expect(result.data).toBeNull()
    expect(result.error).toBeDefined()
  })
})

describe('updateSupply', () => {
  it('actualiza insumo exitosamente', async () => {
    const supply = { id: 's1', nombre: 'Bisturí actualizado' }
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: supply, error: null }),
    }
    const result = await updateSupply('s1', { nombre: 'Bisturí actualizado' })
    expect(result.data).toEqual(supply)
    expect(result.error).toBeNull()
  })
})

describe('deleteSupply', () => {
  it('elimina insumo (soft delete)', async () => {
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    const result = await deleteSupply('s1')
    expect(result.error).toBeNull()
  })

  it('retorna error si falla', async () => {
    const err = { message: 'Delete failed' }
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: err }),
    }
    const result = await deleteSupply('s1')
    expect(result.error).toEqual(err)
  })
})
