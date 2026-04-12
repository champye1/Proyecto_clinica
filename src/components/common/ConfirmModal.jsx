import Modal from './Modal'
import Button from './Button'
import { AlertTriangle } from 'lucide-react'

/**
 * Modal de confirmación con tres variantes visuales.
 * El foco inicial se pone en "Cancelar" para proteger contra pulsaciones accidentales.
 * @param {boolean} isOpen - Controla la visibilidad
 * @param {() => void} onClose - Cierra sin confirmar
 * @param {() => void} onConfirm - Ejecuta la acción confirmada
 * @param {string} [title='Confirmar acción'] - Título del modal
 * @param {string|React.ReactNode} message - Mensaje de advertencia
 * @param {string} [confirmText='Confirmar'] - Texto del botón de confirmación
 * @param {string} [cancelText='Cancelar'] - Texto del botón de cancelación
 * @param {'danger'|'warning'|'info'} [variant='danger'] - Estilo del ícono y botón
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
}) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const variantStyles = {
    danger: {
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const styles = variantStyles[variant] || variantStyles.danger

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 ${styles.icon}`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="flex-1">
            {typeof message === 'string' ? (
              <p className="text-gray-700 whitespace-pre-line">{message}</p>
            ) : (
              <div className="text-gray-700">{message}</div>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="secondary"
            autoFocus
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={styles.button}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
