import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRpc = vi.fn()

vi.mock('@/config/supabase', () => ({
  supabase: { rpc: (...args) => mockRpc(...args) },
}))
vi.mock('@/utils/logger', () => ({ logger: { errorWithContext: vi.fn() } }))

import { updateClinicaInfo } from '../clinicaService'

beforeEach(() => { vi.clearAllMocks() })

describe('updateClinicaInfo', () => {
  it('retorna null error en éxito', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    const result = await updateClinicaInfo({ nombre: 'Clínica A', ciudad: 'Santiago', telefono: '+56912345678', emailContacto: 'a@b.com' })
    expect(result.error).toBeNull()
    expect(mockRpc).toHaveBeenCalledWith('update_clinica_info', {
      p_nombre: 'Clínica A',
      p_ciudad: 'Santiago',
      p_telefono: '+56912345678',
      p_email_contacto: 'a@b.com',
    })
  })

  it('pasa null cuando el campo no se provee', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await updateClinicaInfo({ nombre: 'Test' })
    expect(mockRpc).toHaveBeenCalledWith('update_clinica_info', {
      p_nombre: 'Test',
      p_ciudad: null,
      p_telefono: null,
      p_email_contacto: null,
    })
  })

  it('retorna error en fallo', async () => {
    mockRpc.mockResolvedValueOnce({ error: { message: 'No autorizado' } })
    const result = await updateClinicaInfo({ nombre: 'X' })
    expect(result.error).toBeDefined()
  })
})
