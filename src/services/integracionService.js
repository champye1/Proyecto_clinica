import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'

export async function getMyClinicIntegrations() {
  const { data, error } = await supabase.rpc('get_my_clinic_integrations')
  if (error) { logger.errorWithContext('integracionService.getMyClinicIntegrations', error); return { data: null, error } }
  return { data, error: null }
}

export async function saveTwilioConfig({ accountSid, authToken, whatsappFrom, enabled }) {
  const { error } = await supabase.rpc('save_twilio_config', {
    p_account_sid:    accountSid ?? '',
    p_auth_token:     authToken ?? '',
    p_whatsapp_from:  whatsappFrom ?? '',
    p_enabled:        enabled,
  })
  if (error) { logger.errorWithContext('integracionService.saveTwilioConfig', error); return { error } }
  return { error: null }
}

export async function toggleGmailPolling(enabled) {
  const { error } = await supabase.rpc('toggle_gmail_polling', { p_enabled: enabled })
  if (error) { logger.errorWithContext('integracionService.toggleGmailPolling', error); return { error } }
  return { error: null }
}

export async function disconnectGmail() {
  const { error } = await supabase.rpc('disconnect_gmail')
  if (error) { logger.errorWithContext('integracionService.disconnectGmail', error); return { error } }
  return { error: null }
}

export async function exchangeGmailCode(code, redirectUri) {
  const { data, error } = await supabase.functions.invoke('gmail-exchange-token', {
    body: { code, redirectUri },
  })
  if (error) { logger.errorWithContext('integracionService.exchangeGmailCode', error); return { data: null, error } }
  if (data?.error) return { data: null, error: new Error(data.error) }
  return { data, error: null }
}

export async function testWhatsapp(to, clinicaId) {
  const { data, error } = await supabase.functions.invoke('send-whatsapp', {
    body: { to, type: 'test', data: {}, clinicaId },
  })
  if (error) { logger.errorWithContext('integracionService.testWhatsapp', error); return { error } }
  if (data?.success === false) return { error: new Error(data.error ?? 'Error al enviar') }
  return { error: null }
}
