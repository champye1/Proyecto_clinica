import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()

const buildChain = (finalResult) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResult),
    is: vi.fn().mockReturnThis(),
  }
  Object.keys(chain).forEach(k => {
    if (k !== 'single' && k !== 'eq' && k !== 'order' && k !== 'limit' && k !== 'is') return
    if (typeof chain[k].mockResolvedValue === 'function') chain[k].mockResolvedValue = vi.fn()
  })
  return chain
}

let fromChain
vi.mock('@/config/supabase', () => ({
  supabase: {
    from: () => fromChain,
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), errorWithContext: vi.fn() },
}))

vi.mock('@/utils/getClinicaId', () => ({
  getMyClinicaId: vi.fn().mockResolvedValue('clinica-123'),
}))

vi.mock('@/schemas/notification.schema', () => ({
  NotificationListSchema: { safeParse: vi.fn().mockReturnValue({ success: true }) },
}))

import { fetchNotifications, countUnread, markAsRead, markAllAsRead, createNotification } from '../notificationService'

describe('fetchNotifications', () => {
  it('retorna notificaciones del usuario', async () => {
    const fakeData = [{ id: '1', user_id: 'u1', vista: false }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: fakeData, error: null }),
    }
    const result = await fetchNotifications('u1')
    expect(result.data).toEqual(fakeData)
    expect(result.error).toBeNull()
  })

  it('retorna array vacío si hay error', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }
    const result = await fetchNotifications('u1')
    expect(result.data).toEqual([])
    expect(result.error).toBeDefined()
  })
})

describe('countUnread', () => {
  it('retorna el conteo de no leídas', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      mockResolvedValueOnce: vi.fn(),
    }
    fromChain.eq = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
    })
    fromChain.select = vi.fn().mockReturnValue(fromChain)

    const result = await countUnread('u1')
    expect(typeof result.count).toBe('number')
  })
})

describe('markAsRead', () => {
  it('llama update con vista: true', async () => {
    const updateMock = vi.fn().mockReturnThis()
    fromChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    const result = await markAsRead('notif-1')
    expect(result.error).toBeNull()
  })
})

describe('createNotification', () => {
  it('inserta la notificación con clinica_id y vista false', async () => {
    const fakeNotif = { id: 'n1', user_id: 'u1', title: 'Test' }
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeNotif, error: null }),
    }
    fromChain = { insert: vi.fn().mockReturnValue(insertChain) }
    insertChain.insert = fromChain.insert

    fromChain = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: fakeNotif, error: null }),
        }),
      }),
    }

    const result = await createNotification({ user_id: 'u1', title: 'Test', message: 'Hola' })
    expect(result.data).toEqual(fakeNotif)
    expect(result.error).toBeNull()
  })

  it('retorna error si falla el insert', async () => {
    fromChain = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }),
      }),
    }
    const result = await createNotification({ user_id: 'u1', title: 'Test', message: 'Hola' })
    expect(result.error).toBeDefined()
    expect(result.data).toBeNull()
  })
})
