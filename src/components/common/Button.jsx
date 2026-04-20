import { memo } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const BASE_CLASSES =
  'px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.25em] ' +
  'transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation leading-relaxed active:scale-95'

const VARIANT_CLASSES = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm',
  danger:    'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-200',
}

const STYLES = {
  loadingRow:  'flex items-center gap-2',
  spinnerIcon: 'animate-spin',
}

/**
 * Botón de acción reutilizable con soporte de loading y variantes visuales.
 * @param {React.ReactNode} children - Contenido del botón
 * @param {boolean} [loading=false] - Muestra spinner y deshabilita el botón
 * @param {'primary'|'secondary'|'danger'} [variant='primary'] - Estilo visual
 * @param {string} [className=''] - Clases CSS adicionales
 */
function Button({
  children,
  loading = false,
  variant = 'primary',
  className = '',
  ...props
}) {
  const isDisabled = loading || props.disabled

  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <span className={STYLES.loadingRow}>
          <Loader2 className={STYLES.spinnerIcon} size={16} aria-hidden="true" />
          Procesando...
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}

export default memo(Button)
