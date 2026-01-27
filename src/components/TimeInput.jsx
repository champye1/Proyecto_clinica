import { useState, useEffect } from 'react'

/**
 * Componente de input de hora que permite escritura numérica directa
 * Permite escribir "13" y automáticamente lo convierte a "13:00"
 */
export default function TimeInput({ 
  value, 
  onChange, 
  min, 
  max,
  className = '',
  id,
  required = false,
  disabled = false,
  ...props 
}) {
  const [displayValue, setDisplayValue] = useState(value || '')
  const [isFocused, setIsFocused] = useState(false)

  // Sincronizar con el valor externo cuando cambia
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value || '')
    }
  }, [value, isFocused])

  // Convertir formato numérico simple a formato HH:MM
  const parseNumericInput = (input) => {
    // Eliminar todo excepto números
    const numbers = input.replace(/\D/g, '')
    
    if (!numbers) return ''
    
    // Si solo tiene 1-2 dígitos, asumir que son horas
    if (numbers.length <= 2) {
      const hours = parseInt(numbers, 10)
      if (hours >= 0 && hours <= 23) {
        return `${hours.toString().padStart(2, '0')}:00`
      }
      return ''
    }
    
    // Si tiene 3-4 dígitos, interpretar como HHMM
    if (numbers.length <= 4) {
      const hours = parseInt(numbers.slice(0, -2), 10)
      const minutes = parseInt(numbers.slice(-2), 10)
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      }
    }
    
    // Si ya tiene formato HH:MM, validarlo
    if (input.includes(':')) {
      const [h, m] = input.split(':')
      const hours = parseInt(h, 10)
      const minutes = parseInt(m, 10)
      
      if (!isNaN(hours) && !isNaN(minutes) && 
          hours >= 0 && hours <= 23 && 
          minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      }
    }
    
    return ''
  }

  const handleChange = (e) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    
    // Si está escribiendo numéricamente (sin :), convertir
    if (!inputValue.includes(':') && inputValue.length > 0) {
      const parsed = parseNumericInput(inputValue)
      if (parsed) {
        setDisplayValue(parsed)
        onChange({ ...e, target: { ...e.target, value: parsed } })
        return
      }
    }
    
    // Si tiene formato válido (HH:MM o HH:M o solo números), actualizar
    if (inputValue.match(/^\d{1,2}:\d{0,2}$/) || inputValue.match(/^\d{1,4}$/) || inputValue === '') {
      // Si tiene formato completo HH:MM, validar y actualizar
      if (inputValue.match(/^\d{1,2}:\d{2}$/)) {
        const [h, m] = inputValue.split(':')
        const hours = parseInt(h, 10)
        const minutes = parseInt(m, 10)
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          setDisplayValue(formatted)
          onChange({ ...e, target: { ...e.target, value: formatted } })
          return
        }
      }
      // Si está escribiendo, permitir formato parcial
      onChange(e)
    }
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    
    // Al perder el foco, asegurar formato correcto
    const parsed = parseNumericInput(displayValue)
    if (parsed) {
      setDisplayValue(parsed)
      onChange({ ...e, target: { ...e.target, value: parsed } })
    } else if (displayValue && !displayValue.match(/^\d{2}:\d{2}$/)) {
      // Si tiene valor pero formato incorrecto, intentar parsear
      const parsed = parseNumericInput(displayValue)
      if (parsed) {
        setDisplayValue(parsed)
        onChange({ ...e, target: { ...e.target, value: parsed } })
      } else {
        // Si no se puede parsear, restaurar valor anterior
        setDisplayValue(value || '')
      }
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleKeyDown = (e) => {
    // Permitir teclas de navegación y edición
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
      return
    }
    
    // Permitir números y dos puntos
    if (!/[0-9:]/.test(e.key)) {
      e.preventDefault()
    }
  }

  return (
    <input
      type="text"
      id={id}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      min={min}
      max={max}
      className={className}
      required={required}
      disabled={disabled}
      placeholder="HH:MM o solo números (ej: 13 o 1300)"
      pattern="[0-9]{1,2}:[0-9]{2}"
      {...props}
    />
  )
}
