import { describe, it, expect, vi } from 'vitest'

const tableChains = {}

vi.mock('@/config/supabase', () => ({
  supabase: {
    from: (table) => tableChains[table] ?? tableChains['_default'],
  },
}))

import { getPeriodDates, fetchAnalyticsData } from '../analyticsService'

describe('getPeriodDates', () => {
  it('retorna rango de la semana', () => {
    const { start, end } = getPeriodDates('semana')
    expect(start).toBeDefined()
    expect(end).toBeDefined()
    expect(start < end || start === end).toBe(true)
  })

  it('retorna rango del mes', () => {
    const { start, end } = getPeriodDates('mes')
    expect(start).toBeDefined()
    expect(end).toBeDefined()
  })

  it('retorna rango personalizado cuando periodo es custom', () => {
    const { start, end } = getPeriodDates('custom', '2026-01-01', '2026-01-31')
    expect(start).toBe('2026-01-01')
    expect(end).toBe('2026-01-31')
  })

  it('usa mes por defecto para periodo desconocido', () => {
    const mes = getPeriodDates('mes')
    const unknown = getPeriodDates('xyz')
    expect(unknown.start).toBe(mes.start)
    expect(unknown.end).toBe(mes.end)
  })
})

describe('fetchAnalyticsData', () => {
  const makeChain = (data) => ({
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error: null }),
  })

  it('retorna datos de cirugías, solicitudes, salas y médicos', async () => {
    tableChains['surgeries']       = makeChain([{ id: 's1' }])
    tableChains['surgery_requests'] = makeChain([{ id: 'r1' }])
    tableChains['operating_rooms'] = makeChain([{ id: 'or1', nombre: 'Pab 1' }])
    tableChains['doctors']         = makeChain([{ id: 'd1' }])

    const result = await fetchAnalyticsData('2026-01-01', '2026-01-31')
    expect(result.surgeries).toEqual([{ id: 's1' }])
    expect(result.rooms).toEqual([{ id: 'or1', nombre: 'Pab 1' }])
    expect(result.doctors).toEqual([{ id: 'd1' }])
  })

  it('lanza error si falla la consulta de cirugías', async () => {
    tableChains['surgeries'] = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Surgery query error' } }),
    }
    tableChains['surgery_requests'] = makeChain([])
    tableChains['operating_rooms']  = makeChain([])
    tableChains['doctors']          = makeChain([])

    await expect(fetchAnalyticsData('2026-01-01', '2026-01-31')).rejects.toBeDefined()
  })
})
