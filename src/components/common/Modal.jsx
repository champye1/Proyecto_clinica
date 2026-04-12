import { memo, useEffect, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Modal accesible con focus trap, cierre por Escape y ARIA dialog.
 * @param {boolean} isOpen - Controla la visibilidad del modal
 * @param {() => void} onClose - Callback al cerrar (Escape, click en backdrop, botón X)
 * @param {React.ReactNode} children - Contenido del cuerpo del modal
 * @param {string} [title] - Título en la cabecera (opcional; omitir oculta la cabecera)
 */
function Modal({ isOpen, onClose, children, title }) {
  const dialogRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Move focus into the dialog on open
      requestAnimationFrame(() => {
        const first = dialogRef.current?.querySelector(FOCUSABLE_SELECTORS)
        first?.focus()
      })
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTORS) ?? [])
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-4 md:p-6 pointer-events-none"
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              className="bg-white rounded-2xl sm:rounded-[2rem] lg:rounded-[2.5rem] w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="bg-slate-900 text-white p-4 sm:p-5 md:p-6 flex items-center justify-between gap-3">
                  <h2 id={titleId} className="text-lg sm:text-xl font-black uppercase tracking-wide leading-relaxed truncate flex-1">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 active:bg-white/20 rounded-xl transition-colors flex-shrink-0 touch-manipulation"
                    aria-label="Cerrar modal"
                  >
                    <X size={18} className="sm:w-5 sm:h-5" aria-hidden="true" />
                  </button>
                </div>
              )}
              <div className="p-4 sm:p-5 md:p-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-100px)] custom-scrollbar">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default memo(Modal)
