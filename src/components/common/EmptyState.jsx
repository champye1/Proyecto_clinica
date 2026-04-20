import { memo } from 'react'
import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  wrapper:   'flex flex-col items-center justify-center py-16 px-6',
  iconBox:   'w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4',
  title:     'text-lg font-black text-slate-900 mb-2',
  description:'text-sm text-slate-500 text-center max-w-md mb-6',
  iconColor:  'text-slate-400',
}

// ─── Animaciones ──────────────────────────────────────────────────────────────
const ICON_ANIM = { initial: { scale: 0.8 }, animate: { scale: 1 }, transition: { delay: 0.1 } }

/**
 * Estado vacío estándar para listas y tablas sin resultados.
 * @param {React.ElementType} [icon=Inbox] - Componente de ícono Lucide a mostrar
 * @param {string} title - Título principal (e.g. "Sin resultados")
 * @param {string} description - Descripción secundaria
 * @param {React.ReactNode} [action] - Elemento de acción opcional (e.g. un botón)
 */
function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      className={STYLES.wrapper}
    >
      <motion.div {...ICON_ANIM} className={STYLES.iconBox}>
        <Icon size={40} className={STYLES.iconColor} />
      </motion.div>
      <h3 className={STYLES.title}>{title}</h3>
      <p className={STYLES.description}>{description}</p>
      {action && action}
    </motion.div>
  )
}

export default memo(EmptyState)
