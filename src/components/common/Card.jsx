import { memo } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeContext'

function Card({ children, className = '', hover = true, ...props }) {
  const { theme } = useTheme()
  
  const getCardClasses = () => {
    const baseClasses = 'rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] p-4 sm:p-6 lg:p-8'
    
    if (theme === 'dark') {
      return `${baseClasses} bg-slate-800 border-slate-700 shadow-lg ${className}`
    } else if (theme === 'medical') {
      return `${baseClasses} bg-white border-blue-100 shadow-sm ${className}`
    } else {
      // Tema claro: tarjetas blancas con sombra más pronunciada para destacar sobre fondo gris
      return `${baseClasses} bg-white border-slate-200 shadow-md hover:shadow-lg transition-shadow ${className}`
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={getCardClasses()}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default memo(Card)
