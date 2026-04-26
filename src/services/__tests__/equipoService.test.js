import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetSession = vi.fn()
let fromChain

vi.mock('@/config/supabase', () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
    from: () => fromChain,
  },
}))

import { fetchMedicos, fetchPersonalPabellon, toggleMedicoEstado, fetchInvitaciones, revocarInvitacion, toggleUsuarioActivo } from '../equipoService'

describe('fetchMedicos', () => {
  it('retorna lista de médicos', async () => {
    const medicos = [{ id: 'd1', nombre: 'Ana', apellido: 'García' }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: medicos, error: null }),
    }
    const result = await fetchMedicos()
    expect(result).toEqual(medicos)
  })

  it('lanza error si hay error de DB', async () => {
    fromChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }
    await expect(fetchMedicos()).rejects.toBeDefined()
  })
})

describe('fetchPersonalPabellon', () => {
  it('retorna personal de pabellón', async () => {
    const personal = [{ id: 'u1', nombre: 'Carlos', role: 'pabellon' }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: personal, error: null }),
    }
    const result = await fetchPersonalPabellon()
    expect(result).toEqual(personal)
  })
})

describe('toggleMedicoEstado', () => {
  it('actualiza el estado del médico', async () => {
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    await expect(toggleMedicoEstado('d1', 'vacaciones')).resolves.not.toThrow()
  })

  it('lanza error si falla el update', async () => {
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: { message: 'Error' } }),
    }
    await expect(toggleMedicoEstado('d1', 'activo')).rejects.toBeDefined()
  })
})

describe('fetchInvitaciones', () => {
  it('retorna lista de invitaciones', async () => {
    const invites = [{ id: 'i1', email: 'test@test.com', activo: true }]
    fromChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: invites, error: null }),
    }
    const result = await fetchInvitaciones()
    expect(result).toEqual(invites)
  })
})

describe('revocarInvitacion', () => {
  it('revoca invitación exitosamente', async () => {
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    await expect(revocarInvitacion('i1')).resolves.not.toThrow()
  })
})

describe('toggleUsuarioActivo', () => {
  it('activa/desactiva usuario', async () => {
    fromChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    await expect(toggleUsuarioActivo('u1', false)).resolves.not.toThrow()
  })
})
