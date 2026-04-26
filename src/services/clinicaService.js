import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'

export async function updateClinicaInfo({ nombre, ciudad, telefono, emailContacto }) {
  const { error } = await supabase.rpc('update_clinica_info', {
    p_nombre:         nombre         ?? null,
    p_ciudad:         ciudad         ?? null,
    p_telefono:       telefono       ?? null,
    p_email_contacto: emailContacto  ?? null,
  })
  if (error) { logger.errorWithContext('clinicaService.updateClinicaInfo', error); return { error } }
  return { error: null }
}
