/**
 * Utilidades para exportar datos a Excel/CSV
 */

/**
 * Exporta datos a CSV
 * @param {Array} data - Array de objetos a exportar
 * @param {Array} columns - Array de { key, label } para las columnas
 * @param {string} filename - Nombre del archivo sin extensión
 */
export function exportToCSV(data, columns, filename = 'export') {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  // Crear headers
  const headers = columns.map(col => col.label).join(',')
  
  // Crear filas
  const rows = data.map(item => {
    return columns.map(col => {
      let value = getNestedValue(item, col.key)
      
      // Formatear valores
      if (value === null || value === undefined) {
        value = ''
      } else if (typeof value === 'object') {
        value = JSON.stringify(value)
      } else {
        value = String(value)
        // Escapar comillas y envolver en comillas si contiene comas
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`
        }
      }
      
      return value
    }).join(',')
  })
  
  // Combinar todo
  const csvContent = [headers, ...rows].join('\n')
  
  // Crear blob y descargar
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Verifica si xlsx está disponible
 * @returns {Promise<boolean>}
 */
async function checkXlsxAvailable() {
  try {
    // Intentar importar xlsx de forma dinámica
    const xlsxModule = await import('xlsx')
    return xlsxModule && xlsxModule.utils !== undefined
  } catch {
    return false
  }
}

/**
 * Exporta datos a Excel usando SheetJS (xlsx)
 * Requiere: npm install xlsx
 * @param {Array} data - Array de objetos a exportar
 * @param {Array} columns - Array de { key, label } para las columnas
 * @param {string} filename - Nombre del archivo sin extensión
 */
export async function exportToExcel(data, columns, filename = 'export') {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  // Verificar si xlsx está disponible
  const isAvailable = await checkXlsxAvailable()
  if (!isAvailable) {
    const errorMsg = 'La librería xlsx no está instalada.\n\n' +
      'Para habilitar la exportación a Excel, ejecuta:\n' +
      'npm install xlsx\n\n' +
      'Alternativamente, puedes usar la exportación a CSV que está disponible.'
    throw new Error(errorMsg)
  }

  // Importar xlsx solo si está disponible
  const XLSX = await import('xlsx')

  // Preparar datos para Excel
  const excelData = data.map(item => {
    const row = {}
    columns.forEach(col => {
      let value = getNestedValue(item, col.key)
      
      // Formatear valores
      if (value === null || value === undefined) {
        value = ''
      } else if (typeof value === 'object') {
        value = JSON.stringify(value)
      }
      
      row[col.label] = value
    })
    return row
  })

  // Crear workbook y worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')

  // Ajustar ancho de columnas
  const colWidths = columns.map(() => ({ wch: 20 }))
  worksheet['!cols'] = colWidths

  // Generar archivo
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

/**
 * Obtiene un valor anidado de un objeto usando notación de punto
 * Ejemplo: getNestedValue({ user: { name: 'John' } }, 'user.name') => 'John'
 */
function getNestedValue(obj, path) {
  if (!path) return obj
  
  const keys = path.split('.')
  let value = obj
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return null
    }
  }
  
  return value
}

/**
 * Formatea un objeto relacionado para mostrar en exportación
 * Ejemplo: { nombre: 'Juan', apellido: 'Pérez' } => 'Juan Pérez'
 */
export function formatRelatedObject(obj, fields = ['nombre', 'apellido']) {
  if (!obj || typeof obj !== 'object') return ''
  
  return fields.map(field => obj[field] || '').filter(Boolean).join(' ')
}
