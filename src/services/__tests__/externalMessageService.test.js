import { describe, it, expect, vi } from 'vitest'

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

import { fetchMessages, fetchMessageCounts, markAsRead, archiveMessage, saveNotes, deleteMessage, createContactMessage } from '../externalMessageService'

describe('fetchMessages', () => {
  it('retorna mensajes no leídos por defecto', async () => {
    const messages = [{ id: 'm1', leido: false, archivado: false }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    fromChain.eq.mockReturnValueOnce({ ...fromChain, eq: vi.fn().mockResolvedValue({ data: messages, error: null }) })
    const result = await fetchMessages()
    expect(result.data).toEqual(messages)
    expect(result.error).toBeNull()
  })

  it('retorna array vacío si hay error', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      }),
    }
    const result = await fetchMessages()
    expect(result.data).toEqual([])
  })
})

describe('markAsRead', () => {
  it('marca mensaje como leído', async () => {
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    const result = await markAsRead('m1')
    expect(result.error).toBeNull()
  })
})

describe('archiveMessage', () => {
  it('archiva mensaje', async () => {
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    const result = await archiveMessage('m1', true)
    expect(result.error).toBeNull()
  })

  it('desarchiva mensaje', async () => {
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    const result = await archiveMessage('m1', false)
    expect(result.error).toBeNull()
  })
})

describe('saveNotes', () => {
  it('guarda notas internas', async () => {
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    const result = await saveNotes('m1', 'Nota de prueba')
    expect(result.error).toBeNull()
  })
})

describe('deleteMessage', () => {
  it('elimina mensaje (soft delete)', async () => {
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    const result = await deleteMessage('m1')
    expect(result.error).toBeNull()
  })
})

describe('createContactMessage', () => {
  it('crea mensaje de contacto exitosamente', async () => {
    fromChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    const result = await createContactMessage({
      nombre_remitente: 'Juan',
      email_remitente: 'juan@test.com',
      asunto: 'Consulta',
      mensaje: 'Hola',
      urgencia: 'normal',
    })
    expect(result.error).toBeNull()
  })

  it('retorna error si falla el insert', async () => {
    const err = { message: 'Insert failed' }
    fromChain = {
      insert: vi.fn().mockResolvedValue({ error: err }),
    }
    const result = await createContactMessage({ nombre_remitente: 'Juan', email_remitente: 'j@t.com', asunto: 'X', mensaje: 'Y', urgencia: 'normal' })
    expect(result.error).toEqual(err)
  })
})
