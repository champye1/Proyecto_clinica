import { memo } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'

/**
 * Tarjeta con animación de entrada y soporte multi-tema.
 * @param {React.ReactNode} children - Contenido de la tarjeta
 * @param {string} [className=''] - Clases CSS adicionales
 * @param {boolean} [hover=true] - Activa el efecto de elevación al pasar el cursor
 */
function Card({ children, className = '', hover = true, ...props }) {
  const { theme } = useTheme()
  const t = tc(theme)

  const borderClass = theme === 'dark'
    ? 'border border-slate-700 shadow-lg'
    : theme === 'medical'
      ? 'border border-blue-100 shadow-sm'
      : 'border border-slate-200 shadow-md hover:shadow-lg transition-shadow'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={`rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 ${t.cardBg} ${borderClass} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default memo(Card)
