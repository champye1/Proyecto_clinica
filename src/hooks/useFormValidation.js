import { useState, useCallback } from 'react'

/**
 * Hook para validación de formularios en tiempo real
 * @param {Object} initialValues - Valores iniciales del formulario
 * @param {Object} validationRules - Reglas de validación por campo
 * @returns {Object} - Estado y funciones de validación
 */
export function useFormValidation(initialValues = {}, validationRules = {}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Validar un campo específico
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name]
    if (!rules) return ''

    // Validación requerida
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return rules.requiredMessage || `${name} es requerido`
    }

    // Validación de email
    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return rules.emailMessage || 'El formato del email no es válido'
      }
    }

    // Validación de longitud mínima
    if (rules.minLength && value && value.length < rules.minLength) {
      return rules.minLengthMessage || `Debe tener al menos ${rules.minLength} caracteres`
    }

    // Validación de longitud máxima
    if (rules.maxLength && value && value.length > rules.maxLength) {
      return rules.maxLengthMessage || `No debe exceder ${rules.maxLength} caracteres`
    }

    // Validación personalizada
    if (rules.validate && typeof rules.validate === 'function') {
      const customError = rules.validate(value)
      if (customError) return customError
    }

    return ''
  }, [validationRules])

  // Manejar cambio de valor
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Si el campo ya fue tocado, validar inmediatamente
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }, [touched, validateField])

  // Manejar blur (cuando el campo pierde el foco)
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const value = values[name]
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [values, validateField])

  // Validar todo el formulario
  const validateForm = useCallback(() => {
    const newErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    // Marcar todos los campos como tocados
    const allTouched = {}
    Object.keys(validationRules).forEach(name => {
      allTouched[name] = true
    })
    setTouched(allTouched)

    return isValid
  }, [values, validationRules, validateField])

  // Resetear formulario
  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setValues,
    setErrors,
    setTouched,
  }
}
