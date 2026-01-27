import { useState, useEffect } from 'react'

/**
 * Hook para hacer debounce de un valor
 * @param {any} value - Valor a hacer debounce
 * @param {number} delay - Delay en milisegundos (default: 500)
 * @returns {any} - Valor con debounce aplicado
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
