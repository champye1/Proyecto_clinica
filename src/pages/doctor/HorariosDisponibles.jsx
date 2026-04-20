import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import CalendarioPabellonesGrid from '@/components/CalendarioPabellonesGrid'
import { useTheme } from '@/contexts/ThemeContext'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page: 'space-y-6',
}

export default function HorariosDisponibles() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.fecha) {
      navigate(location.pathname, { state: {}, replace: true })
    }
  }, [location.state?.fecha, location.pathname, navigate])

  const handleConfirm = (payload) => {
    navigate('/doctor/paciente', {
      state: {
        desdeDisponibilidad: true,
        fechaPreferida: payload.fechaPreferida,
        fechaPreferida2: payload.fechaPreferida2,
        slot1: payload.slot1,
        slot2: payload.slot2,
      },
    })
  }

  return (
    <div className={STYLES.page}>
      <CalendarioPabellonesGrid
        theme={theme}
        inlineMode={false}
        onConfirm={handleConfirm}
        initialFecha={location.state?.fecha}
      />
    </div>
  )
}
