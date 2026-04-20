import { memo } from 'react'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const SIZE_CLASSES = {
  sm: 'h-4 w-4 border-b',
  md: 'h-6 w-6 border-b-2',
  lg: 'h-12 w-12 border-b-2',
}

const BASE_CLASSES = 'animate-spin rounded-full border-blue-600'

const STYLES = {
  srOnly: 'sr-only',
}

/**
 * Spinner de carga accesible con tres tamaños.
 * @param {'sm'|'md'|'lg'} [size='md'] - Tamaño del spinner
 * @param {string} [className=''] - Clases CSS adicionales para posicionamiento
 */
function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md

  return (
    <div
      role="status"
      aria-label="Cargando..."
      className={`${BASE_CLASSES} ${sizeClass} ${className}`}
    >
      <span className={STYLES.srOnly}>Cargando...</span>
    </div>
  )
}

export default memo(LoadingSpinner)
