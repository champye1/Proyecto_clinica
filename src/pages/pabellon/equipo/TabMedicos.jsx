import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Stethoscope, RefreshCw } from 'lucide-react'
import { toggleMedicoEstado } from '@/services/equipoService'
import { getLabelEspecialidad } from '@/constants/especialidades'
import { STYLES, ESTADO_BADGE } from './constants'

export default function TabMedicos({ medicos }) {
  const qc = useQueryClient()
  const toggleEstado = useMutation({
    mutationFn: ({ id, estado }) => toggleMedicoEstado(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipo-medicos'] }),
  })

  if (!medicos.length) return (
    <div className={STYLES.emptyState}>
      <Stethoscope className={STYLES.emptyIcon} />
      <p className={STYLES.emptyTextSm}>No hay médicos registrados aún</p>
      <p className={STYLES.emptyTextXs}>Usa el botón "Invitar" para agregar médicos a tu clínica</p>
    </div>
  )

  return (
    <div className={STYLES.tableWrap}>
      <table className={STYLES.table}>
        <thead>
          <tr className={STYLES.tableHead}>
            {['Nombre', 'Email', 'Especialidad', 'Estado', 'Acceso', ''].map(h => (
              <th key={h} className={STYLES.tableTh}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={STYLES.tableTbody}>
          {medicos.map(m => (
            <tr key={m.id} className={`${STYLES.tableTr} ${m.estado === 'inactivo' ? 'opacity-60' : ''}`}>
              <td className={`${STYLES.tableTd} font-medium text-slate-800`}>
                {m.nombre} {m.apellido}
                {m.rut && <div className={STYLES.rutText}>{m.rut}</div>}
              </td>
              <td className={STYLES.tableCellMuted}>{m.email}</td>
              <td className={`${STYLES.tableCellMuted} text-xs`}>{getLabelEspecialidad(m.especialidad)}</td>
              <td className={STYLES.tableTd}>
                <span className={`${STYLES.badge} ${ESTADO_BADGE[m.estado] || ESTADO_BADGE.inactivo}`}>
                  {m.estado}
                </span>
              </td>
              <td className={STYLES.tableTd}>
                <span className={`${STYLES.badge} ${m.acceso_web_enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {m.acceso_web_enabled ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </td>
              <td className={STYLES.tableCellRight}>
                <button
                  onClick={() => toggleEstado.mutate({ id: m.id, estado: m.estado === 'activo' ? 'inactivo' : 'activo' })}
                  title={m.estado === 'activo' ? 'Desactivar médico' : 'Activar médico'}
                  className={STYLES.toggleBtn}>
                  <RefreshCw className={STYLES.iconSm} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
