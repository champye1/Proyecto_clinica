import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MailOpen } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { revocarInvitacion, reactivarInvitacion } from '@/services/equipoService'
import { STYLES, ROL_BADGE, ROL_LABEL, getInvitacionStatus } from './constants'

export default function TabInvitaciones({ invitaciones }) {
  const qc = useQueryClient()
  const revocar = useMutation({
    mutationFn: (id) => revocarInvitacion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipo-invitaciones'] }),
  })
  const reactivar = useMutation({
    mutationFn: (id) => reactivarInvitacion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipo-invitaciones'] }),
  })

  if (!invitaciones.length) return (
    <div className={STYLES.emptyState}>
      <MailOpen className={STYLES.emptyIcon} />
      <p className={STYLES.emptyTextSm}>No hay invitaciones enviadas aún</p>
      <p className={STYLES.emptyTextXs}>Las invitaciones aparecerán aquí al enviarlas</p>
    </div>
  )

  return (
    <div className={STYLES.tableWrap}>
      <table className={STYLES.table}>
        <thead>
          <tr className={STYLES.tableHead}>
            {['Email', 'Rol', 'Estado', 'Expira', 'Código', ''].map(h => (
              <th key={h} className={STYLES.tableTh}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={STYLES.tableTbody}>
          {invitaciones.map(inv => {
            const status    = getInvitacionStatus(inv)
            const isExpired = new Date(inv.expires_at) < new Date()
            return (
              <tr key={inv.id} className={STYLES.tableTr}>
                <td className={`${STYLES.tableTd} text-slate-700`}>{inv.email}</td>
                <td className={STYLES.tableTd}>
                  <span className={`${STYLES.badge} ${ROL_BADGE[inv.rol] || 'bg-slate-100 text-slate-500'}`}>
                    {ROL_LABEL[inv.rol] || inv.rol}
                  </span>
                </td>
                <td className={STYLES.tableTd}>
                  <span className={`${STYLES.badge} ${status.cls}`}>{status.label}</span>
                </td>
                <td className={STYLES.tableCellSm}>
                  {format(new Date(inv.expires_at), 'dd MMM yyyy', { locale: es })}
                  {isExpired && !inv.usado && <span className={STYLES.expiredBadge}>• vencida</span>}
                </td>
                <td className={STYLES.tableTd}>
                  <code className={STYLES.invCode}>{inv.codigo}</code>
                </td>
                <td className={STYLES.tableCellRight}>
                  {!inv.usado && !isExpired && (
                    inv.activo !== false ? (
                      <button onClick={() => revocar.mutate(inv.id)} className={STYLES.invDeactivateBtn}>
                        Desactivar
                      </button>
                    ) : (
                      <button onClick={() => reactivar.mutate(inv.id)} className={STYLES.invReactivateBtn}>
                        Reactivar
                      </button>
                    )
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
