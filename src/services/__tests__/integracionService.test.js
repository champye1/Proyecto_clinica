import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRpc = vi.fn()
const mockInvoke = vi.fn()

vi.mock('@/config/supabase', () => ({
  supabase: {
    rpc: (...args) => mockRpc(...args),
    functions: { invoke: (...args) => mockInvoke(...args) },
  },
}))
vi.mock('@/utils/logger', () => ({ logger: { errorWithContext: vi.fn() } }))

import {
  getMyClinicIntegrations, saveTwilioConfig, toggleGmailPolling,
  disconnectGmail, exchangeGmailCode, testWhatsapp,
} from '../integracionService'

beforeEach(() => { vi.clearAllMocks() })

describe('getMyClinicIntegrations', () => {
  it('retorna data en éxito', async () => {
    const payload = { gmail_connected: true, whatsapp_enabled: false }
    mockRpc.mockResolvedValueOnce({ data: payload, error: null })
    const result = await getMyClinicIntegrations()
    expect(result.data).toEqual(payload)
    expect(result.error).toBeNull()
  })
  it('retorna null y error en fallo', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Error' } })
    const result = await getMyClinicIntegrations()
    expect(result.data).toBeNull()
    expect(result.error).toBeDefined()
  })
})

describe('saveTwilioConfig', () => {
  it('llama al RPC correcto y retorna null error', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    const result = await saveTwilioConfig({ accountSid: 'AC123', authToken: 'tok', whatsappFrom: '+1234', enabled: true })
    expect(mockRpc).toHaveBeenCalledWith('save_twilio_config', {
      p_account_sid: 'AC123',
      p_auth_token: 'tok',
      p_whatsapp_from: '+1234',
      p_enabled: true,
    })
    expect(result.error).toBeNull()
  })
  it('usa cadena vacía cuando los campos son undefined', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await saveTwilioConfig({ enabled: false })
    expect(mockRpc).toHaveBeenCalledWith('save_twilio_config', {
      p_account_sid: '',
      p_auth_token: '',
      p_whatsapp_from: '',
      p_enabled: false,
    })
  })
})

describe('toggleGmailPolling', () => {
  it('pasa el valor enabled correctamente', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await toggleGmailPolling(true)
    expect(mockRpc).toHaveBeenCalledWith('toggle_gmail_polling', { p_enabled: true })
  })
})

describe('disconnectGmail', () => {
  it('retorna null error en éxito', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    const result = await disconnectGmail()
    expect(result.error).toBeNull()
    expect(mockRpc).toHaveBeenCalledWith('disconnect_gmail')
  })
})

describe('exchangeGmailCode', () => {
  it('invoca la edge function con code y redirectUri', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { ok: true }, error: null })
    const result = await exchangeGmailCode('CODE123', 'https://app/callback')
    expect(mockInvoke).toHaveBeenCalledWith('gmail-exchange-token', {
      body: { code: 'CODE123', redirectUri: 'https://app/callback' },
    })
    expect(result.data).toEqual({ ok: true })
  })
  it('retorna error cuando la función falla', async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'Network error' } })
    const result = await exchangeGmailCode('BAD', 'https://app/callback')
    expect(result.error).toBeDefined()
    expect(result.data).toBeNull()
  })
  it('retorna error cuando data contiene error', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { error: 'invalid_grant' }, error: null })
    const result = await exchangeGmailCode('EXPIRED', 'https://app/callback')
    expect(result.error).toBeInstanceOf(Error)
  })
})

describe('testWhatsapp', () => {
  it('retorna null error en éxito', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { success: true }, error: null })
    const result = await testWhatsapp('+56999999999', 'clinica-1')
    expect(result.error).toBeNull()
    expect(mockInvoke).toHaveBeenCalledWith('send-whatsapp', {
      body: { to: '+56999999999', type: 'test', data: {}, clinicaId: 'clinica-1' },
    })
  })
  it('retorna error cuando success es false', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { success: false, error: 'Twilio error' }, error: null })
    const result = await testWhatsapp('+56999999999', 'clinica-1')
    expect(result.error).toBeInstanceOf(Error)
  })
})
