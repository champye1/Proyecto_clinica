import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, PowerOff, Power, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { deleteUsuarioPabellon, toggleUsuarioActivo } from '@/services/equipoService'
import ConfirmModal from '@/components/common/ConfirmModal'
import { STYLES, ROL_BADGE, ROL_LABEL } from './constants'

export default function TabPersonal({ personal }) {
  const qc = useQueryClient()
  const [confirmEliminar, setConfirmEliminar] = useState(null)

  const eliminar = useMutation({
    mutationFn: (userId) => deleteUsuarioPabellon(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipo-personal'] }),
  })
  const toggleActivo = useMutation({
    mutationFn: ({ userId, nuevoActivo }) => toggleUsuarioActivo(userId, nuevoActivo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipo-personal'] }),
  })

  if (!personal.length) return (
    <div className={STYLES.emptyState}>
      <Building2 className={STYLES.emptyIcon} />
      <p className={STYLES.emptyTextSm}>No hay personal de pabellón registrado</p>
      <p className={STYLES.emptyTextXs}>Usa el botón "Invitar" para agregar personal</p>
    </div>
  )

  return (
    <>
      <ConfirmModal
        isOpen={!!confirmEliminar}
        onClose={() => setConfirmEliminar(null)}
        onConfirm={() => { eliminar.mutate(confirmEliminar.id); setConfirmEliminar(null) }}
        title="Eliminar usuario"
        message={`¿Eliminar permanentemente a ${confirmEliminar?.email}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
      />
      <div className={STYLES.tableWrap}>
        <table className={STYLES.table}>
          <thead>
            <tr className={STYLES.tableHead}>
              {['Nombre', 'Email', 'Rol', 'Desde', 'Acceso', ''].map(h => (
                <th key={h} className={STYLES.tableTh}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={STYLES.tableTbody}>
            {personal.map(u => {
              const esActivo = u.activo !== false
              return (
                <tr key={u.id} className={`${STYLES.tableTr} ${!esActivo ? 'opacity-60' : ''}`}>
                  <td className={`${STYLES.tableTd} font-medium text-slate-800`}>{u.nombre || '—'}</td>
                  <td className={STYLES.tableCellMuted}>{u.email}</td>
                  <td className={STYLES.tableTd}>
                    <span className={`${STYLES.badge} ${ROL_BADGE[u.role] || 'bg-slate-100 text-slate-500'}`}>
                      {ROL_LABEL[u.role] || u.role}
                    </span>
                  </td>
                  <td className={STYLES.tableCellSm}>
                    {format(new Date(u.created_at), 'dd MMM yyyy', { locale: es })}
                  </td>
                  <td className={STYLES.tableTd}>
                    <span className={`${STYLES.badge} ${esActivo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {esActivo ? 'Activo' : 'Desactivado'}
                    </span>
                  </td>
                  <td className={STYLES.tableCellRight}>
                    <div className={STYLES.tableActionsWrap}>
                      <button
                        onClick={() => toggleActivo.mutate({ userId: u.id, nuevoActivo: !esActivo })}
                        title={esActivo ? 'Desactivar acceso' : 'Reactivar acceso'}
                        className={esActivo ? STYLES.toggleActiveBtn : STYLES.toggleInactiveBtn}>
                        {esActivo ? <PowerOff className={STYLES.iconSm} /> : <Power className={STYLES.iconSm} />}
                      </button>
                      <button
                        onClick={() => setConfirmEliminar({ id: u.id, email: u.email })}
                        title="Eliminar usuario"
                        className={STYLES.deleteBtn}>
                        <Trash2 className={STYLES.iconSm} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
