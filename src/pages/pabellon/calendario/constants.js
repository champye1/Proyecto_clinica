export const MESES = [
  { indice: 0, nombre: 'ENERO' },
  { indice: 1, nombre: 'FEBRERO' },
  { indice: 2, nombre: 'MARZO' },
  { indice: 3, nombre: 'ABRIL' },
  { indice: 4, nombre: 'MAYO' },
  { indice: 5, nombre: 'JUNIO' },
  { indice: 6, nombre: 'JULIO' },
  { indice: 7, nombre: 'AGOSTO' },
  { indice: 8, nombre: 'SEPTIEMBRE' },
  { indice: 9, nombre: 'OCTUBRE' },
  { indice: 10, nombre: 'NOVIEMBRE' },
  { indice: 11, nombre: 'DICIEMBRE' },
]

export const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`)

export const getCellStatusClass = (status, isSelected, isAvailable) => {
  if (status === 'occupied') return 'bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer'
  if (status === 'blocked_agreement') return 'bg-slate-800 border-amber-400/50 cursor-not-allowed'
  if (isSelected) return 'bg-blue-100 border-blue-500 shadow-lg shadow-blue-200/50 cursor-pointer'
  if (isAvailable) return 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-400 cursor-pointer'
  return 'bg-slate-50 border-slate-200 cursor-not-allowed'
}
