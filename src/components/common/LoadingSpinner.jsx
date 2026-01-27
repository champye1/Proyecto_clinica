import { memo } from 'react'

function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-b',
    md: 'h-6 w-6 border-b-2',
    lg: 'h-12 w-12 border-b-2'
  }
  
  const sizeClass = sizeClasses[size] || sizeClasses.md
  
  return (
    <div className={`animate-spin rounded-full ${sizeClass} border-blue-600 ${className}`}>    </div>
  )
}

export default memo(LoadingSpinner)
