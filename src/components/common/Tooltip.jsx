import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Tooltip animado con cuatro posiciones de anclaje.
 * @param {React.ReactNode} children - Elemento que dispara el tooltip al pasar el cursor
 * @param {string} content - Texto a mostrar en el tooltip
 * @param {'top'|'bottom'|'left'|'right'} [position='top'] - Posición relativa al elemento
 */
export default function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 9)}`

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const STYLES = { wrapper: 'relative inline-block' }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900',
  }

  return (
    <div
      className={STYLES.wrapper}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      aria-describedby={isVisible ? tooltipId : undefined}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, y: position === 'top' ? 5 : -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === 'top' ? 5 : -5 }}
            className={`absolute z-50 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap ${positionClasses[position]}`}
          >
            {content}
            <div className={`absolute ${arrowClasses[position]}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
