import { memo } from 'react'

/**
 * Spinner de carga accesible con tres tamaños.
 * @param {'sm'|'md'|'lg'} [size='md'] - Tamaño del spinner
 * @param {string} [className=''] - Clases CSS adicionales para posicionamiento
 */
function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-b',
    md: 'h-6 w-6 border-b-2',
    lg: 'h-12 w-12 border-b-2'
  }
  
  const sizeClass = sizeClasses[size] || sizeClasses.md
  
  return (
    <div
      role="status"
      aria-label="Cargando..."
      className={`animate-spin rounded-full ${sizeClass} border-blue-600 ${className}`}
    >
      <span className="sr-only">Cargando...</span>
    </div>
  )
}

export default memo(LoadingSpinner)
  