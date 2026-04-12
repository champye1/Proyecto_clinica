/**
 * Hook para obtener el ID del usuario autenticado actual.
 * Extrae la lógica duplicada de ambos layouts (PabellonLayout, DoctorLayout).
 */
import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

/**
 * Retorna el ID del usuario autenticado, suscribiéndose a cambios de sesión.
 * @returns {string|null} userId — null si no hay sesión activa
 */
export function useCurrentUserId() {
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return userId
}
