import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

export default function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Seleccionar...",
  required = false,
  className = "",
  valueKey = 'codigo', // Campo a usar como valor (codigo o id)
  displayFormat = null // Función personalizada para formatear el display
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrar opciones basado en el término de búsqueda
  const filteredOptions = options.filter(option => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (option.codigo && option.codigo.toLowerCase().includes(searchLower)) ||
      (option.nombre && option.nombre.toLowerCase().includes(searchLower)) ||
      (option.descripcion && option.descripcion.toLowerCase().includes(searchLower)) ||
      (option.grupo_prestacion && option.grupo_prestacion.toLowerCase().includes(searchLower))
    )
  })

  // Obtener la opción seleccionada
  const selectedOption = options.find(opt => opt[valueKey] === value)

  // Formatear el texto a mostrar
  const getDisplayText = (option) => {
    if (displayFormat) {
      return displayFormat(option)
    }
    if (option.codigo && option.nombre) {
      return `${option.codigo} - ${option.nombre}`
    }
    return option.nombre || option.codigo || String(option[valueKey])
  }

  const handleSelect = (option) => {
    onChange(option[valueKey])
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`input-field cursor-pointer flex items-center justify-between ${
          !value ? 'text-slate-400' : 'text-slate-700'
        }`}
      >
        <span className="truncate">
          {selectedOption 
            ? getDisplayText(selectedOption)
            : placeholder
          }
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <X 
              className="w-4 h-4 text-slate-400 hover:text-slate-600" 
              onClick={handleClear}
            />
          )}
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-xl max-h-80 overflow-hidden">
          {/* Campo de búsqueda */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código o nombre..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2 pl-10 pr-4 focus:border-blue-500 focus:bg-white transition-all outline-none text-sm font-bold text-slate-700"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Lista de opciones */}
          <div className="overflow-y-auto max-h-64 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">
                No se encontraron resultados
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option[valueKey] || option.id || option.codigo}
                  onClick={() => handleSelect(option)}
                  className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-b-0 ${
                    value === option[valueKey] ? 'bg-blue-50' : ''
                  }`}
                >
                  {option.codigo && (
                    <div className="font-bold text-slate-700 text-sm">
                      {option.codigo}
                    </div>
                  )}
                  <div className={`text-xs ${option.codigo ? 'text-slate-500 mt-1' : 'text-slate-700 font-bold'}`}>
                    {option.nombre}
                  </div>
                  {option.grupo_prestacion && (
                    <div className="text-xs text-blue-500 mt-1">
                      {option.grupo_prestacion}
                    </div>
                  )}
                  {option.descripcion && (
                    <div className="text-xs text-slate-400 mt-1">
                      {option.descripcion}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {required && !value && (
        <input
          type="text"
          className="hidden"
          required
          value={value}
          onChange={() => {}}
        />
      )}
    </div>
  )
}
