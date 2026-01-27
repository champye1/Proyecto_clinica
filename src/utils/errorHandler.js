import { supabase } from '../config/supabase'
import { logger } from './logger'

/**
 * Maneja errores de autenticación y red de forma consistente
 * @param {Error} error - El error a manejar
 * @param {Function} showError - Función para mostrar errores al usuario
 * @returns {boolean} - true si el error fue manejado, false si debe manejarse normalmente
 */
export function handleMutationError(error, showError) {
  const errorMessage = error?.message || error?.toString() || 'Error desconocido'
  
  // Manejar sesión expirada (401)
  if (
    error?.status === 401 || 
    error?.code === 'PGRST301' ||
    errorMessage?.includes('JWT') || 
    errorMessage?.includes('expired') || 
    errorMessage?.includes('unauthorized') ||
    errorMessage?.includes('Invalid JWT')
  ) {
    logger.warn('Sesión expirada detectada. Redirigiendo al login...')
    supabase.auth.signOut().then(() => {
      window.location.href = '/'
    })
    return true // Error manejado
  }
  
  // Manejar errores de red
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
    return true // Error manejado
  }
  
  return false // Error no manejado, debe manejarse normalmente
}
