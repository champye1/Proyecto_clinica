import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

// IMPORTANTE: Reemplazar con tus credenciales de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key'

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('tu-proyecto')) {
  logger.warn('⚠️ Configura las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Tipos de roles
export const ROLES = {
  PABELLON: 'pabellon',
  DOCTOR: 'doctor',
}

// Helper para obtener el rol del usuario actual
export const getCurrentUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return data?.role || null
}

// Helper para verificar si el usuario es Pabellón
export const isPabellon = async () => {
  const role = await getCurrentUserRole()
  return role === ROLES.PABELLON
}

// Helper para verificar si el usuario es Doctor
export const isDoctor = async () => {
  const role = await getCurrentUserRole()
  return role === ROLES.DOCTOR
}
