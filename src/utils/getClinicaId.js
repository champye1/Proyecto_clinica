/**
 * Utilidad para obtener el clinica_id del usuario autenticado.
 * Cachea el resultado en memoria para evitar queries repetidas.
 */
import { supabase } from '@/config/supabase'

let _clinicaId = null

/**
 * Retorna el clinica_id del usuario actual.
 * Si no está cacheado, lo consulta desde la tabla users.
 * @returns {Promise<string|null>}
 */
export async function getMyClinicaId() {
  if (_clinicaId) return _clinicaId

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('clinica_id')
    .eq('id', user.id)
    .single()

  if (error) return null  // no cachear en fallo de red, se reintentará en la próxima llamada

  _clinicaId = data?.clinica_id ?? null
  return _clinicaId
}

/**
 * Limpia el cache. Llamar al cerrar sesión.
 */
export function clearClinicaIdCache() {
  _clinicaId = null
}
