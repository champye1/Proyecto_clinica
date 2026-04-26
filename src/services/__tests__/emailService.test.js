import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInvoke = vi.fn()

vi.mock('@/config/supabase', () => ({
  supabase: {
    functions: { invoke: (...args) => mockInvoke(...args) },
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: { warn: vi.fn(), errorWithContext: vi.fn() },
}))

import { sendEmail, emailSolicitudRechazada, emailCirugiaProgramada } from '../emailService'
import { logger } from '@/utils/logger'

describe('sendEmail', () => {
  beforeEach(() => { mockInvoke.mockReset(); vi.clearAllMocks() })

  it('invoca la Edge Function con los parámetros correctos', async () => {
    mockInvoke.mockResolvedValue({ error: null })
    await sendEmail('solicitud_recibida', { to: 'test@test.com', data: { nombre: 'Juan' } })
    expect(mockInvoke).toHaveBeenCalledWith('send-email', {
      body: { to: 'test@test.com', userId: undefined, type: 'solicitud_recibida', data: { nombre: 'Juan' } },
    })
  })

  it('loggea el error sin lanzar cuando la función falla', async () => {
    mockInvoke.mockResolvedValue({ error: { message: 'Function error' } })
    await expect(sendEmail('solicitud_aceptada', { userId: 'u1', data: {} })).resolves.not.toThrow()
    expect(logger.errorWithContext).toHaveBeenCalled()
  })

  it('no lanza cuando hay excepción de red', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'))
    await expect(sendEmail('cirugia_programada', { to: 'test@test.com', data: {} })).resolves.not.toThrow()
    expect(logger.errorWithContext).toHaveBeenCalled()
  })
})

describe('emailSolicitudRechazada', () => {
  it('invoca sendEmail con el userId correcto del médico', async () => {
    mockInvoke.mockResolvedValue({ error: null })
    const solicitud = {
      doctors: { user_id: 'u1', nombre: 'Ana', apellido: 'García' },
      patients: { nombre: 'Pedro', apellido: 'López' },
      fecha_preferida: '2026-05-01',
    }
    await emailSolicitudRechazada(solicitud)
    expect(mockInvoke).toHaveBeenCalledWith('send-email', expect.objectContaining({
      body: expect.objectContaining({ type: 'solicitud_rechazada', userId: 'u1' }),
    }))
  })
})

describe('emailCirugiaProgramada', () => {
  it('invoca sendEmail con los datos de la cirugía', async () => {
    mockInvoke.mockResolvedValue({ error: null })
    const solicitud = {
      doctors: { user_id: 'u1', nombre: 'Ana', apellido: 'García' },
      patients: { nombre: 'Pedro', apellido: 'López' },
    }
    await emailCirugiaProgramada(solicitud, { fecha: '2026-05-01', hora_inicio: '08:00', hora_fin: '10:00' }, 'Pabellón 1')
    expect(mockInvoke).toHaveBeenCalledWith('send-email', expect.objectContaining({
      body: expect.objectContaining({ type: 'cirugia_programada', userId: 'u1' }),
    }))
  })
})
