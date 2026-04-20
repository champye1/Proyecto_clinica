import { memo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  nav:          'flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200',
  info:         'text-sm text-gray-600',
  controls:     'flex items-center gap-2',
  navBtn:       'p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation',
  pages:        'flex gap-1',
  pageActive:   'px-4 py-2 rounded-lg border bg-blue-600 text-white border-blue-600 transition-colors touch-manipulation',
  pageInactive: 'px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors touch-manipulation',
  ellipsis:     'px-3 py-2 text-gray-400',
  chevronIcon:  'w-5 h-5',
}

const MAX_VISIBLE_PAGES = 5

/**
 * Paginación accesible con landmark nav, aria-current y botones con aria-label.
 * Retorna null si totalPages <= 1.
 * @param {number} currentPage - Página actual (base 1)
 * @param {number} totalPages - Total de páginas
 * @param {(page: number) => void} onPageChange - Callback al cambiar de página
 * @param {number} itemsPerPage - Ítems por página
 * @param {number} totalItems - Total de ítems
 */
function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem   = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages = []

    if (totalPages <= MAX_VISIBLE_PAGES) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <nav aria-label="Paginación" className={STYLES.nav}>
      <div className={STYLES.info}>
        Mostrando {startItem} - {endItem} de {totalItems} resultados
      </div>

      <div className={STYLES.controls}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={STYLES.navBtn}
          aria-label="Página anterior"
        >
          <ChevronLeft className={STYLES.chevronIcon} />
        </button>

        <div className={STYLES.pages}>
          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className={STYLES.ellipsis}>...</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={currentPage === page ? STYLES.pageActive : STYLES.pageInactive}
                aria-label={`Ir a página ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={STYLES.navBtn}
          aria-label="Página siguiente"
        >
          <ChevronRight className={STYLES.chevronIcon} />
        </button>
      </div>
    </nav>
  )
}

export default memo(Pagination)
