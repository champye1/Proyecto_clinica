import { ShieldCheck } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'
import MFASetup from '@/components/common/MFASetup'

export default function Seguridad() {
  const { theme } = useTheme()
  const t = tc(theme)
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-black uppercase tracking-tighter ${t.textPrimary}`}>
          Seguridad
        </h1>
        <p className={`text-sm mt-1 ${t.textSecondary}`}>
          Configuración de seguridad de tu cuenta médica.
        </p>
      </div>
      <MFASetup />
    </div>
  )
}
