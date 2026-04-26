import { ESTADO_LABELS } from './constants'

export default function EstadoBadge({ estado }) {
  const classes = {
    programada: 'text-blue-700 bg-blue-50 border-blue-200',
    completada: 'text-green-700 bg-green-50 border-green-200',
    cancelada:  'text-red-600 bg-red-50 border-red-200',
    en_proceso: 'text-amber-700 bg-amber-50 border-amber-200',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${classes[estado] || 'text-slate-600 bg-slate-50 border-slate-200'}`}>
      {ESTADO_LABELS[estado] || estado}
    </span>
  )
}
