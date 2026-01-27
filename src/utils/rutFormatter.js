/**
 * Formatea un RUT chileno mientras el usuario escribe
 * Formato: XX.XXX.XXX-X
 * @param {string} value - Valor del RUT sin formato
 * @returns {string} - RUT formateado
 */
export const formatRut = (value) => {
  // Remover todo excepto números y K/k
  let rut = value.replace(/[^0-9kK]/g, '')
  
  // Limitar a 9 caracteres (8 dígitos + 1 dígito verificador)
  if (rut.length > 9) {
    rut = rut.substring(0, 9)
  }
  
  // Si no hay nada, retornar vacío
  if (rut.length === 0) {
    return ''
  }
  
  // Separar el dígito verificador del resto
  const digitoVerificador = rut.slice(-1).toUpperCase()
  const numeroRut = rut.slice(0, -1)
  
  // Si solo hay un carácter y es K o número, retornar tal cual
  if (rut.length === 1) {
    return rut.toUpperCase()
  }
  
  // Formatear el número con puntos
  let rutFormateado = numeroRut.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  
  // Agregar el guion y el dígito verificador
  if (numeroRut.length > 0) {
    rutFormateado += '-' + digitoVerificador
  }
  
  return rutFormateado
}

/**
 * Limpia el RUT removiendo puntos y guiones para guardarlo en la base de datos
 * @param {string} rutFormateado - RUT con formato
 * @returns {string} - RUT sin formato (ej: 12345678-9)
 */
export const cleanRut = (rutFormateado) => {
  // Remover puntos pero mantener el guion y el dígito verificador
  return rutFormateado.replace(/\./g, '')
}

/**
 * Valida el formato básico del RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {boolean} - true si el formato es válido
 */
export const isValidRutFormat = (rut) => {
  // Formato esperado: XX.XXX.XXX-X o XXXX-XXXX-X (sin puntos)
  const rutPattern = /^[0-9]{7,8}-[0-9kK]{1}$/
  const rutSinFormato = cleanRut(rut)
  return rutPattern.test(rutSinFormato)
}

/**
 * Valida el dígito verificador del RUT chileno según el algoritmo oficial
 * @param {string} rut - RUT a validar (con o sin formato)
 * @returns {boolean} - true si el dígito verificador es correcto
 */
export const validateRut = (rut) => {
  // Limpiar el RUT removiendo puntos y guiones
  const cleanRutStr = rut.replace(/\./g, '').replace(/-/g, '')
  
  // Verificar que tenga al menos 8 caracteres (7 dígitos + 1 dígito verificador)
  if (cleanRutStr.length < 8 || cleanRutStr.length > 9) {
    return false
  }
  
  // Separar el número del RUT del dígito verificador
  const rutNumber = cleanRutStr.slice(0, -1)
  const dv = cleanRutStr.slice(-1).toUpperCase()
  
  // Verificar que el número del RUT solo contenga dígitos
  if (!/^\d+$/.test(rutNumber)) {
    return false
  }
  
  // Verificar que el dígito verificador sea un número o K
  if (!/^[0-9kK]$/.test(dv)) {
    return false
  }
  
  // Calcular el dígito verificador según el algoritmo chileno
  let sum = 0
  let multiplier = 2
  
  // Recorrer el número del RUT de derecha a izquierda
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  
  // Calcular el resto de la división por 11
  const remainder = sum % 11
  
  // Calcular el dígito verificador esperado
  let calculatedDv
  if (remainder < 2) {
    calculatedDv = remainder.toString()
  } else {
    calculatedDv = (11 - remainder).toString()
  }
  
  // Si el resultado es 10, el dígito verificador debe ser K
  if (calculatedDv === '10') {
    return dv === 'K'
  }
  
  // Comparar el dígito verificador calculado con el ingresado
  return calculatedDv === dv
}
