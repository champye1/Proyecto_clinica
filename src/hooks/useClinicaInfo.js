import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'

/**
 * Retorna información de la clínica actual: nombre, ciudad, plan, trial.
 * Estado puede ser: 'trial' | 'activo' | 'expirado' | 'suspendido'
 */
export function useClinicaInfo() {
  return useQuery({
    queryKey: ['clinica-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinicas')
        .select('id, nombre, ciudad, trial_hasta, estado, plan_id, planes(id, nombre, precio_mensual_usd, max_doctores, max_salas)')
        .single()

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

/**
 * Calcula el estado del trial a partir de la info de la clínica.
 * @param {object|null} clinicaInfo
 * @returns {{ daysLeft: number|null, isExpired: boolean, isWarning: boolean, isActive: boolean }}
 */
export function useTrialStatus(clinicaInfo) {
  if (!clinicaInfo) {
    return { daysLeft: null, isExpired: false, isWarning: false, isActive: false }
  }

  const isActive = clinicaInfo.estado === 'activo'

  if (isActive) {
    return { daysLeft: null, isExpired: false, isWarning: false, isActive: true }
  }

  const trialHasta = clinicaInfo.trial_hasta
  if (!trialHasta) {
    return { daysLeft: null, isExpired: false, isWarning: false, isActive: false }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(trialHasta)
  end.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))

  return {
    daysLeft,
    // Expirado cuando ya se cumplió el día límite (daysLeft <= 0)
    isExpired: daysLeft <= 0,
    // Mostrar aviso cuando quedan 5 días o menos (pero aún no expiró)
    // El mensaje exacto de días se muestra en el banner
    isWarning: daysLeft > 0 && daysLeft <= 5,
    isActive: false,
  }
}
