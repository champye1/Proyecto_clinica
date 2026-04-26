import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, UserPlus, Stethoscope, Building2, MailOpen, Activity } from 'lucide-react'
import {
  fetchMedicos, fetchPersonalPabellon, fetchInvitaciones, fetchActividad,
} from '@/services/equipoService'
import ModalInvitar    from './ModalInvitar'
import TabMedicos      from './TabMedicos'
import TabPersonal     from './TabPersonal'
import TabInvitaciones from './TabInvitaciones'
import TabActividad    from './TabActividad'
import { STYLES } from './constants'

export default function Equipo() {
  const [tab, setTab]               = useState('medicos')
  const [showInvitar, setShowInvitar] = useState(false)
  const qc = useQueryClient()

  const { data: medicos = [],      isLoading: loadMedicos }      = useQuery({ queryKey: ['equipo-medicos'],      queryFn: fetchMedicos })
  const { data: personal = [],     isLoading: loadPersonal }     = useQuery({ queryKey: ['equipo-personal'],     queryFn: fetchPersonalPabellon })
  const { data: invitaciones = [], isLoading: loadInvitaciones } = useQuery({ queryKey: ['equipo-invitaciones'], queryFn: fetchInvitaciones })
  const { data: actividad = [],    isLoading: loadActividad }    = useQuery({ queryKey: ['equipo-actividad'],    queryFn: fetchActividad })

  const pendientes = invitaciones.filter(
    i => !i.usado && i.activo !== false && new Date(i.expires_at) > new Date()
  ).length

  const TABS = [
    { key: 'medicos',      Icon: Stethoscope, label: 'Médicos',      count: medicos.length,  active: 'border-green-500 text-green-700',  badge: 'bg-green-100 text-green-700'   },
    { key: 'personal',     Icon: Building2,   label: 'Personal',     count: personal.length, active: 'border-blue-500 text-blue-700',    badge: 'bg-blue-100 text-blue-700'     },
    { key: 'invitaciones', Icon: MailOpen,    label: 'Invitaciones', count: pendientes,      active: 'border-purple-500 text-purple-700',badge: 'bg-purple-100 text-purple-700' },
    { key: 'actividad',    Icon: Activity,    label: 'Actividad',    count: null,            active: 'border-slate-500 text-slate-700',  badge: 'bg-slate-100 text-slate-600'   },
  ]

  const loading = { medicos: loadMedicos, personal: loadPersonal, invitaciones: loadInvitaciones, actividad: loadActividad }

  return (
    <div className={STYLES.page}>
      <div className={STYLES.pageHeader}>
        <div>
          <h1 className={STYLES.pageTitle}>
            <Users className={STYLES.iconUsersLg} /> Equipo
          </h1>
          <p className={STYLES.pageSubtitle}>Gestiona médicos, personal e invitaciones de tu clínica</p>
        </div>
        <button onClick={() => setShowInvitar(true)} className={STYLES.inviteBtn}>
          <UserPlus className={STYLES.iconSm} /> Invitar usuario
        </button>
      </div>

      <div className={STYLES.statsGrid}>
        {[
          { Icon: Stethoscope, count: medicos.length,  label: 'Médicos',         bg: 'bg-green-100',  ic: 'text-green-600'  },
          { Icon: Building2,   count: personal.length, label: 'Personal',        bg: 'bg-blue-100',   ic: 'text-blue-600'   },
          { Icon: MailOpen,    count: pendientes,      label: 'Inv. pendientes', bg: 'bg-purple-100', ic: 'text-purple-600' },
        ].map(({ Icon, count, label, bg, ic }) => (
          <div key={label} className={STYLES.statCard}>
            <div className={`${STYLES.statIconBox} ${bg}`}>
              <Icon className={`w-5 h-5 ${ic}`} />
            </div>
            <div>
              <p className={STYLES.statValue}>{count}</p>
              <p className={STYLES.statLabel}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={STYLES.tabsCard}>
        <div className={STYLES.tabsRow}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`${STYLES.tabBtnBase} ${tab === t.key ? t.active : STYLES.tabBtnInactive}`}>
              <t.Icon className={STYLES.iconSm} />
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className={tab === t.key ? `${STYLES.tabCountActive} ${t.badge}` : STYLES.tabCountInactive}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={STYLES.tabContent}>
          {loading[tab]
            ? <div className={STYLES.tabLoading}>Cargando...</div>
            : tab === 'medicos'      ? <TabMedicos      medicos={medicos}           />
            : tab === 'personal'     ? <TabPersonal     personal={personal}         />
            : tab === 'invitaciones' ? <TabInvitaciones invitaciones={invitaciones} />
            : tab === 'actividad'    ? <TabActividad    actividad={actividad}       />
            : null
          }
        </div>
      </div>

      {showInvitar && (
        <ModalInvitar
          rolPreset={tab === 'medicos' ? 'doctor' : 'pabellon'}
          onClose={() => setShowInvitar(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['equipo-invitaciones'] })}
        />
      )}
    </div>
  )
}
