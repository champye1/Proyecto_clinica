import { describe, it, expect, vi, beforeEach } from 'vitest'

let fromChain

vi.mock('@/config/supabase', () => ({
  supabase: { from: () => fromChain },
}))
vi.mock('@/utils/logger', () => ({ logger: { errorWithContext: vi.fn() } }))

import { findPatientByRut, createPatient, updatePatient, deletePatient } from '../patientService'

beforeEach(() => { vi.clearAllMocks() })

function buildChain(resolvedValue) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
  }
  return chain
}

describe('findPatientByRut', () => {
  it('retorna paciente encontrado', async () => {
    const patient = { id: 'p1', nombre: 'Juan', apellido: 'Pérez' }
    fromChain = buildChain({ data: patient, error: null })
    const result = await findPatientByRut('d1', '12.345.678-9')
    expect(result.data).toEqual(patient)
    expect(result.error).toBeNull()
  })
  it('retorna null cuando no hay paciente', async () => {
    fromChain = buildChain({ data: null, error: null })
    const result = await findPatientByRut('d1', '00.000.000-0')
    expect(result.data).toBeNull()
    expect(result.error).toBeNull()
  })
  it('retorna error en fallo de DB', async () => {
    fromChain = buildChain({ data: null, error: { message: 'DB error' } })
    const result = await findPatientByRut('d1', 'bad')
    expect(result.error).toBeDefined()
  })
})

describe('createPatient', () => {
  it('retorna el paciente creado', async () => {
    const patient = { id: 'p2', nombre: 'Ana' }
    fromChain = buildChain({ data: patient, error: null })
    const result = await createPatient({ nombre: 'Ana', doctor_id: 'd1' })
    expect(result.data).toEqual(patient)
    expect(result.error).toBeNull()
  })
  it('retorna null y error en fallo', async () => {
    fromChain = buildChain({ data: null, error: { message: 'Constraint' } })
    const result = await createPatient({ nombre: 'X' })
    expect(result.data).toBeNull()
    expect(result.error).toBeDefined()
  })
})

describe('updatePatient', () => {
  it('retorna el paciente actualizado', async () => {
    const updated = { id: 'p1', nombre: 'Nuevo' }
    fromChain = buildChain({ data: updated, error: null })
    const result = await updatePatient('p1', { nombre: 'Nuevo' })
    expect(result.data).toEqual(updated)
    expect(result.error).toBeNull()
  })
  it('retorna error en fallo', async () => {
    fromChain = buildChain({ data: null, error: { message: 'Not found' } })
    const result = await updatePatient('bad-id', { nombre: 'X' })
    expect(result.error).toBeDefined()
  })
})

describe('deletePatient', () => {
  it('retorna null error en soft delete exitoso', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    fromChain = { update: vi.fn().mockReturnValue({ eq: eqFn }) }
    const result = await deletePatient('p1')
    expect(result.error).toBeNull()
  })
  it('retorna error en fallo', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: { message: 'Fallo' } })
    fromChain = { update: vi.fn().mockReturnValue({ eq: eqFn }) }
    const result = await deletePatient('p1')
    expect(result.error).toBeDefined()
  })
})
