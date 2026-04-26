import { describe, it, expect, vi, beforeEach } from 'vitest'

let fromChain
const mockGetCurrentUser = vi.fn()

vi.mock('@/config/supabase', () => ({
  supabase: { from: () => fromChain },
}))
vi.mock('@/utils/logger', () => ({ logger: { errorWithContext: vi.fn() } }))
vi.mock('@/services/authService', () => ({
  getCurrentUser: (...args) => mockGetCurrentUser(...args),
}))

import { fetchReminders, createReminder, markReminderRead, deleteReminder } from '../reminderService'

beforeEach(() => { vi.clearAllMocks() })

describe('fetchReminders', () => {
  it('retorna lista cuando hay sesión', async () => {
    mockGetCurrentUser.mockResolvedValueOnce({ user: { id: 'u1' } })
    const reminders = [{ id: 'r1', text: 'Recordar insumos' }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: reminders, error: null }),
    }
    const result = await fetchReminders()
    expect(result.data).toEqual(reminders)
    expect(result.error).toBeNull()
  })

  it('retorna array vacío cuando no hay sesión', async () => {
    mockGetCurrentUser.mockResolvedValueOnce({ user: null })
    const result = await fetchReminders()
    expect(result.data).toEqual([])
    expect(result.error).toBeNull()
  })

  it('retorna array vacío en error de DB', async () => {
    mockGetCurrentUser.mockResolvedValueOnce({ user: { id: 'u1' } })
    fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }
    const result = await fetchReminders()
    expect(result.data).toEqual([])
    expect(result.error).toBeDefined()
  })
})

describe('createReminder', () => {
  it('inserta con user_id del usuario en sesión', async () => {
    mockGetCurrentUser.mockResolvedValueOnce({ user: { id: 'u1' } })
    const reminder = { id: 'r2', text: 'Nuevo', user_id: 'u1' }
    fromChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: reminder, error: null }),
    }
    const result = await createReminder({ text: 'Nuevo' })
    expect(result.data).toEqual(reminder)
    expect(fromChain.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u1' }))
  })

  it('retorna error cuando no hay sesión', async () => {
    mockGetCurrentUser.mockResolvedValueOnce({ user: null })
    const result = await createReminder({ text: 'X' })
    expect(result.error).toBeInstanceOf(Error)
    expect(result.data).toBeNull()
  })
})

describe('markReminderRead', () => {
  it('actualiza visto a true', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    fromChain = { update: vi.fn().mockReturnValue({ eq: eqFn }) }
    const result = await markReminderRead('r1')
    expect(fromChain.update).toHaveBeenCalledWith({ visto: true })
    expect(eqFn).toHaveBeenCalledWith('id', 'r1')
    expect(result.error).toBeNull()
  })
})

describe('deleteReminder', () => {
  it('soft delete: actualiza deleted_at', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    fromChain = { update: vi.fn().mockReturnValue({ eq: eqFn }) }
    const result = await deleteReminder('r1')
    expect(fromChain.update).toHaveBeenCalledWith(expect.objectContaining({ deleted_at: expect.any(String) }))
    expect(result.error).toBeNull()
  })
})
