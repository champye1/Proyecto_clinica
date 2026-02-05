/**
 * Utilidades para sanitización de inputs en formularios
 * Previene XSS, SQL Injection y otros ataques
 */

/**
 * Sanitiza un string removiendo caracteres peligrosos y scripts
 * @param {string} input - El string a sanitizar
 * @param {Object} options - Opciones de sanitización
 * @returns {string} - String sanitizado
 */
export function sanitizeString(input, options = {}) {
  if (typeof input !== 'string') {
    return input
  }

  const {
    allowHTML = false,
    maxLength = null,
    trim = true,
    removeScripts = true,
    removeSQL = true,
  } = options

  let sanitized = input

  // Trim si está habilitado
  if (trim) {
    sanitized = sanitized.trim()
  }

  // Remover scripts y tags HTML peligrosos si no se permite HTML
  if (!allowHTML || removeScripts) {
    // Remover tags script, iframe, object, embed
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    
    // Remover atributos peligrosos de eventos (onclick, onerror, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    
    // Remover javascript: y data: URLs peligrosas
    sanitized = sanitized.replace(/javascript:/gi, '')
    sanitized = sanitized.replace(/data:text\/html/gi, '')
  }

  // Remover patrones SQL peligrosos
  if (removeSQL) {
    // Remover comentarios SQL
    sanitized = sanitized.replace(/--/g, '')
    sanitized = sanitized.replace(/\/\*/g, '')
    sanitized = sanitized.replace(/\*\//g, '')
    
    // Remover comandos SQL peligrosos (solo en contexto de strings, no en palabras completas)
    const sqlKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'EXEC', 'EXECUTE']
    sqlKeywords.forEach(keyword => {
      // Solo remover si está seguido de espacio o punto y coma (no en medio de palabras)
      const regex = new RegExp(`\\b${keyword}\\s+`, 'gi')
      sanitized = sanitized.replace(regex, '')
    })
  }

  // Escapar caracteres especiales HTML si no se permite HTML
  if (!allowHTML) {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  // Limitar longitud si se especifica
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

/**
 * Sanitiza un objeto completo de datos de formulario
 * @param {Object} data - Objeto con los datos del formulario
 * @param {Object} options - Opciones de sanitización por campo
 * @returns {Object} - Objeto sanitizado
 */
export function sanitizeFormData(data, options = {}) {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sanitized = {}

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Usar opciones específicas del campo si existen, sino usar las generales
      const fieldOptions = options[key] || options.default || {}
      sanitized[key] = sanitizeString(value, fieldOptions)
    } else if (Array.isArray(value)) {
      // Sanitizar arrays recursivamente
      sanitized[key] = value.map(item => {
        if (typeof item === 'string') {
          const fieldOptions = options[key] || options.default || {}
          return sanitizeString(item, fieldOptions)
        } else if (typeof item === 'object') {
          return sanitizeFormData(item, options)
        }
        return item
      })
    } else if (typeof value === 'object' && value !== null) {
      // Sanitizar objetos anidados recursivamente
      sanitized[key] = sanitizeFormData(value, options)
    } else {
      // Mantener otros tipos de datos sin cambios
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Hook helper para sanitizar inputs en tiempo real
 * @param {Function} setValue - Función para actualizar el valor
 * @param {Object} options - Opciones de sanitización
 * @returns {Function} - Función para usar en onChange
 */
export function createSanitizedHandler(setValue, options = {}) {
  return (e) => {
    const value = e.target ? e.target.value : e
    const sanitized = sanitizeString(value, options)
    setValue(sanitized)
  }
}

/**
 * Sanitiza un número (solo permite dígitos y puntos decimales)
 * @param {string} input - String a sanitizar
 * @returns {string} - String con solo números y punto decimal
 */
export function sanitizeNumber(input) {
  if (typeof input !== 'string') {
    return input
  }
  // Solo permite dígitos y un punto decimal
  return input.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
}

/**
 * Sanitiza un email (solo permite caracteres válidos para email)
 * @param {string} input - String a sanitizar
 * @returns {string} - String sanitizado para email
 */
export function sanitizeEmail(input) {
  if (typeof input !== 'string') {
    return input
  }
  // Solo permite caracteres válidos para email: letras, números, @, ., -, _
  return input.replace(/[^a-zA-Z0-9@._-]/g, '')
}

/**
 * Sanitiza un RUT (solo permite dígitos, puntos, guiones y K)
 * @param {string} input - String a sanitizar
 * @returns {string} - String sanitizado para RUT
 */
export function sanitizeRut(input) {
  if (typeof input !== 'string') {
    return input
  }
  // Solo permite dígitos, puntos, guiones y K/k
  return input.replace(/[^\d.\-kK]/g, '')
}

/**
 * Sanitiza un código de insumo. Libre para que cada clínica use su formato
 * (ej. ins-013, ABC.123, 001). Solo se eliminan caracteres de control y riesgosos.
 * @param {string} input - String a sanitizar
 * @returns {string} - String sanitizado para código
 */
export function sanitizeCode(input) {
  if (typeof input !== 'string') {
    return input
  }
  // Permite letras, números, guiones, guiones bajos, puntos, barras y espacios
  return input.replace(/[\x00-\x1F\x7F]/g, '')
}

/**
 * Sanitiza un campo de contraseña: solo elimina scripts e inyecciones,
 * sin escapar caracteres especiales (para no alterar la contraseña).
 * @param {string} input - String a sanitizar
 * @returns {string} - String sanitizado para contraseña
 */
export function sanitizePassword(input) {
  if (typeof input !== 'string') {
    return input
  }
  return sanitizeString(input, { allowHTML: true, trim: false })
}
