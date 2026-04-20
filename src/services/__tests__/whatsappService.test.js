import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendWhatsApp, notifyDoctorSolicitudAceptada, notifyDoctorSolicitudRechazada, notifyDoctorCirugiaProgramada, notifyDoctorReagendamiento, notifyPabellonNuevaSolicitud } from '../whatsappService'

const mockInvoke = vi.fn()

vi.mock('@/config/supabase', () => ({
  supabase: {
    functions: { invoke: (...args) => mockInvoke(...args) },
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn() },
}))

describe('sendWhatsApp', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockInvoke.mockResolvedValue({ error: null })
  })

  it('no hace nada si telefono está vacío', async () => {
    await sendWhatsApp('', 'solicitud_aceptada', {})
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('no hace nada si telefono es null', async () => {
    await sendWhatsApp(null, 'solicitud_aceptada', {})
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('invoca la Edge Function con los parámetros correctos', async () => {
    await sendWhatsApp('+56912345678', 'solicitud_aceptada', { nombreDoctor: 'Juan' })
    expect(mockInvoke).toHaveBeenCalledWith('send-whatsapp', {
      body: { to: '+56912345678', type: 'solicitud_aceptada', data: { nombreDoctor: 'Juan' } },
    })
  })

  it('no lanza excepción si la Edge Function retorna error', async () => {
    mockInvoke.mockResolvedValue({ error: { message: 'Twilio error' } })
    await expect(sendWhatsApp('+56912345678', 'solicitud_aceptada', {})).resolves.not.toThrow()
  })

  it('no lanza excepción si la invocación falla con excepción', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'))
    await expect(sendWhatsApp('+56912345678', 'solicitud_aceptada', {})).resolves.not.toThrow()
  })
})

describe('notifyDoctorSolicitudAceptada', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockInvoke.mockResolvedValue({ error: null })
  })

  it('envía el tipo correcto', async () => {
    await notifyDoctorSolicitudAceptada({ telefono: '+56912345678', nombreDoctor: 'Dr. Juan', nombrePaciente: 'Pedro', procedimiento: 'Apendicectomía' })
    expect(mockInvoke).toHaveBeenCalledWith('send-whatsapp', expect.objectContaining({
      body: expect.objectContaining({ type: 'solicitud_aceptada' }),
    }))
  })

  it('no envía si no hay teléfono', async () => {
    await notifyDoctorSolicitudAceptada({ telefono: null, nombreDoctor: 'Dr. Juan', nombrePaciente: 'Pedro', procedimiento: 'Apendicectomía' })
    expect(mockInvoke).not.toHaveBeenCalled()
  })
})

describe('notifyDoctorSolicitudRechazada', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockInvoke.mockResolvedValue({ error: null })
  })

  it('envía el tipo correcto con motivo', async () => {
    await notifyDoctorSolicitudRechazada({ telefono: '+56912345678', nombreDoctor: 'Dr. Juan', nombrePaciente: 'Pedro', procedimiento: 'Apendicectomía', motivo: 'Sin disponibilidad' })
    expect(mockInvoke).toHaveBeenCalledWith('send-whatsapp', expect.objectContaining({
      body: expect.objectContaining({ type: 'solicitud_rechazada', data: expect.objectContaining({ motivo: 'Sin disponibilidad' }) }),
    }))
  })
})

describe('notifyDoctorCirugiaProgramada', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockInvoke.mockResolvedValue({ error: null })
  })

  it('envía fecha, hora y sala', async () => {
    await notifyDoctorCirugiaProgramada({ telefono: '+56912345678', nombreDoctor: 'Dr. Juan', nombrePaciente: 'Pedro', procedimiento: 'Apendicectomía', fecha: '2026-05-01', hora: '09:00', sala: 'Pabellón 1' })
    expect(mockInvoke).toHaveBeenCalledWith('send-whatsapp', expect.objectContaining({
      body: expect.objectContaining({
        type: 'cirugia_programada',
        data: expect.objectContaining({ fecha: '2026-05-01', hora: '09:00', sala: 'Pabellón 1' }),
      }),
    }))
  })
})

describe('notifyDoctorReagendamiento', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockInvoke.mockResolvedValue({ error: null })
  })

  it('envía el tipo reagendamiento', async () => {
    await notifyDoctorReagendamiento({ telefono: '+56912345678', nombreDoctor: 'Dr. Juan', nombrePaciente: 'Pedro', procedimiento: 'Apendicectomía', motivo: 'Sala ocupada' })
    expect(mockInvoke).toHaveBeenCalledWith('send-whatsapp', expect.objectContaining({
      body: expect.objectContaining({ type: 'reagendamiento' }),
    }))
  })
})

describe('notifyPabellonNuevaSolicitud', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockInvoke.mockResolvedValue({ error: null })
  })

  it('envía el tipo solicitud_recibida', async () => {
    await notifyPabellonNuevaSolicitud({ telefono: '+56912345678', nombreDoctor: 'Dr. Juan', nombrePaciente: 'Pedro', procedimiento: 'Apendicectomía' })
    expect(mockInvoke).toHaveBeenCalledWith('send-whatsapp', expect.objectContaining({
      body: expect.objectContaining({ type: 'solicitud_recibida' }),
    }))
  })
})
