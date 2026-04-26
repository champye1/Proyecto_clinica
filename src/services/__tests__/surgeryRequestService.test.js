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
vi.mock('@/schemas/surgeryRequest.schema', () => ({
  SurgeryRequestListSchema: { safeParse: vi.fn().mockReturnValue({ success: true }) },
}))

import {
  fetchRequests, fetchRequestsByDoctor, fetchPendingRequestsByDoctor, fetchRequestById,
  createRequest, acceptRequest, rejectRequest, updateRequestStatus, deleteRequest,
  fetchRequestsByDoctorFull, updateRequest, deleteRequestSupplies, addRequestSupplies,
} from '../surgeryRequestService'

beforeEach(() => { vi.clearAllMocks() })

function makeQueryChain(resolved) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
  }
  // Terminal resolvers
  chain.order.mockResolvedValue(resolved)
  chain.single = vi.fn().mockResolvedValue(resolved)
  chain.maybeSingle = vi.fn().mockResolvedValue(resolved)
  // Re-chain after eq/is/or/not
  Object.keys(chain).forEach(k => {
    if (typeof chain[k] === 'function' && k !== 'order' && k !== 'single' && k !== 'maybeSingle') {
      chain[k].mockReturnValue(chain)
    }
  })
  return chain
}

describe('fetchRequests', () => {
  it('retorna lista en éxito', async () => {
    const requests = [{ id: 'sr1', estado: 'pendiente' }]
    fromChain = makeQueryChain({ data: requests, error: null })
    const result = await fetchRequests()
    expect(result.data).toEqual(requests)
    expect(result.error).toBeNull()
  })
  it('retorna array vacío en error', async () => {
    fromChain = makeQueryChain({ data: null, error: { message: 'Error' } })
    const result = await fetchRequests()
    expect(result.data).toEqual([])
  })
})

describe('fetchRequestsByDoctor', () => {
  it('retorna solicitudes del doctor', async () => {
    const requests = [{ id: 'sr2' }]
    fromChain = makeQueryChain({ data: requests, error: null })
    const result = await fetchRequestsByDoctor('d1')
    expect(result.data).toEqual(requests)
  })
})

describe('fetchPendingRequestsByDoctor', () => {
  it('retorna solo solicitudes pendientes', async () => {
    const requests = [{ id: 'sr3', estado: 'pendiente' }]
    fromChain = makeQueryChain({ data: requests, error: null })
    const result = await fetchPendingRequestsByDoctor('d1')
    expect(result.data).toEqual(requests)
    expect(result.error).toBeNull()
  })
})

describe('fetchRequestById', () => {
  it('retorna la solicitud por id', async () => {
    const request = { id: 'sr1', estado: 'aceptada' }
    fromChain = makeQueryChain({ data: request, error: null })
    const result = await fetchRequestById('sr1')
    expect(result.data).toEqual(request)
  })
  it('retorna null y error cuando no existe', async () => {
    fromChain = makeQueryChain({ data: null, error: { message: 'Not found' } })
    const result = await fetchRequestById('bad')
    expect(result.data).toBeNull()
    expect(result.error).toBeDefined()
  })
})

function makeInsertChain(resolved) {
  const chain = { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue(resolved) }
  chain.insert.mockReturnValue(chain)
  chain.select.mockReturnValue(chain)
  return chain
}

function makeUpdateChain(resolved) {
  const chain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue(resolved) }
  chain.update.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.select.mockReturnValue(chain)
  return chain
}

describe('createRequest', () => {
  it('retorna la solicitud creada', async () => {
    const newReq = { id: 'sr4', estado: 'pendiente' }
    fromChain = makeInsertChain({ data: newReq, error: null })
    const result = await createRequest({ doctor_id: 'd1', patient_id: 'p1' })
    expect(result.data).toEqual(newReq)
    expect(result.error).toBeNull()
  })
})

describe('acceptRequest', () => {
  it('actualiza estado a aceptada con usuario en sesión', async () => {
    mockGetCurrentUser.mockResolvedValueOnce({ user: { id: 'u1' } })
    const accepted = { id: 'sr1', estado: 'aceptada', aceptada_por: 'u1' }
    fromChain = makeUpdateChain({ data: accepted, error: null })
    const result = await acceptRequest('sr1')
    expect(result.data).toEqual(accepted)
    expect(result.error).toBeNull()
  })
})

describe('rejectRequest', () => {
  it('actualiza estado a rechazada con motivo', async () => {
    const rejected = { id: 'sr1', estado: 'rechazada', motivo_rechazo: 'Sin disponibilidad' }
    fromChain = makeUpdateChain({ data: rejected, error: null })
    const result = await rejectRequest('sr1', 'Sin disponibilidad')
    expect(result.data).toEqual(rejected)
  })
})

describe('updateRequestStatus', () => {
  it('actualiza el estado pasado', async () => {
    const updated = { id: 'sr1', estado: 'cancelada' }
    fromChain = makeUpdateChain({ data: updated, error: null })
    const result = await updateRequestStatus('sr1', 'cancelada')
    expect(result.data).toEqual(updated)
  })
})

describe('deleteRequest', () => {
  it('soft delete: retorna null error en éxito', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    fromChain = { update: vi.fn().mockReturnValue({ eq: eqFn }) }
    const result = await deleteRequest('sr1')
    expect(result.error).toBeNull()
  })
})

describe('updateRequest', () => {
  it('actualiza campos del request', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    fromChain = { update: vi.fn().mockReturnValue({ eq: eqFn }) }
    const result = await updateRequest('sr1', { notas: 'Nueva nota' })
    expect(eqFn).toHaveBeenCalledWith('id', 'sr1')
    expect(result.error).toBeNull()
  })
})

describe('deleteRequestSupplies', () => {
  it('elimina insumos de la solicitud', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    fromChain = { delete: vi.fn().mockReturnValue({ eq: eqFn }) }
    const result = await deleteRequestSupplies('sr1')
    expect(eqFn).toHaveBeenCalledWith('surgery_request_id', 'sr1')
    expect(result.error).toBeNull()
  })
})

describe('addRequestSupplies', () => {
  it('inserta los insumos mapeados con clinica_id', async () => {
    fromChain = { insert: vi.fn().mockResolvedValue({ error: null }) }
    const insumos = [{ supply_id: 's1', cantidad: 2 }]
    const result = await addRequestSupplies('sr1', insumos, 'c1')
    expect(fromChain.insert).toHaveBeenCalledWith([{
      surgery_request_id: 'sr1',
      supply_id: 's1',
      cantidad: 2,
      clinica_id: 'c1',
    }])
    expect(result.error).toBeNull()
  })
})
