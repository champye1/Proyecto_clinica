import { useState, useRef, useEffect, useCallback } from 'react'
import { logger } from '../utils/logger'

/**
 * Hook personalizado para manejar el resize horizontal de un elemento
 * 
 * @param {Object} options - Opciones de configuración
 * @param {number} options.initialWidth - Ancho inicial en píxeles (default: null, usa el ancho del elemento)
 * @param {number} options.minWidth - Ancho mínimo en píxeles (default: 300)
 * @param {number} options.maxWidth - Ancho máximo en píxeles (default: null, sin límite)
 * @param {string} options.side - Lado desde donde se hace resize: 'left' | 'right' (default: 'right')
 * @returns {Object} - { width, isResizing, resizeRef, handleRef }
 */
export const useResize = ({
  initialWidth = null,
  minWidth = 300,
  maxWidth = null,
  side = 'right'
} = {}) => {
  const [width, setWidth] = useState(initialWidth)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef(null)
  const handleRef = useRef(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // Inicializar el ancho desde el elemento si no se proporciona
  useEffect(() => {
    if (resizeRef.current && initialWidth === null) {
      const rect = resizeRef.current.getBoundingClientRect()
      setWidth(rect.width)
    } else if (initialWidth !== null) {
      setWidth(initialWidth)
    }
  }, [initialWidth])

  // Función para iniciar el resize
  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!resizeRef.current) {
      logger.warn('resizeRef.current is null')
      return
    }

    const rect = resizeRef.current.getBoundingClientRect()
    if (!rect.width) {
      logger.warn('Element has no width')
      return
    }

    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = rect.width

    // Prevenir selección de texto durante el resize
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    document.body.style.pointerEvents = 'none'
    
    // Restaurar pointer events solo en el handle
    if (handleRef.current) {
      handleRef.current.style.pointerEvents = 'auto'
    }
  }, [])

  // Función para actualizar el ancho durante el arrastre
  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !resizeRef.current) return

    const deltaX = side === 'right' 
      ? e.clientX - startXRef.current 
      : startXRef.current - e.clientX

    let newWidth = startWidthRef.current + deltaX

    // Aplicar límites
    if (minWidth !== null && newWidth < minWidth) {
      newWidth = minWidth
    }
    if (maxWidth !== null && newWidth > maxWidth) {
      newWidth = maxWidth
    }

    setWidth(newWidth)
  }, [isResizing, minWidth, maxWidth, side])

  // Función para finalizar el resize
  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    document.body.style.pointerEvents = ''
    
    if (handleRef.current) {
      handleRef.current.style.pointerEvents = 'auto'
    }
  }, [])

  // Agregar event listeners cuando se inicia el resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // Conectar el handleRef con el evento mousedown
  useEffect(() => {
    const handle = handleRef.current
    if (handle) {
      // Usar captura para asegurar que se capture el evento
      handle.addEventListener('mousedown', handleMouseDown, true)
      return () => {
        handle.removeEventListener('mousedown', handleMouseDown, true)
      }
    }
  }, [handleMouseDown])

  return {
    width,
    isResizing,
    resizeRef,
    handleRef
  }
}
