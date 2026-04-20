import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Building2, Users, DoorOpen, Stethoscope,
  Clock, Calendar, AlertTriangle, CheckCircle2, XCircle,
  Eye, Activity,
} from 'lucide-react'
import { supabase } from '@/config/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const SPECIALTY_LABELS = {
  cirugia_general:       'Cirugía General',
  cirugia_cardiovascular:'Cirugía Cardiovascular',
  cirugia_plastica:      'Cirugía Plástica',
  cirugia_ortopedica:    'Cirugía Ortopédica',
  neurocirugia:          'Neurocirugía',
  cirugia_oncologica:    'Cirugía Oncológica',
  urologia:              'Urología',
  ginecologia:           'Ginecología',
  otorrinolaringologia:  'Otorrinolaringología',
  oftalmologia:          'Oftalmología',
  otra:                  'Otra',
}

const ROLE_LABELS = { doctor: 'Doctor', pabellon: 'Pabellón', admin_clinica: 'Admin' }

const S = {
  page:         'space-y-8 max-w-5xl',
  backBtn:      'flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors',
  bannerWrap:   'flex items-center gap-4 bg-amber-900/20 border border-amber-700/50 rounded-2xl px-6 py-4',
  bannerIcon:   'w-10 h-10 rounded-xl bg-amber-800/40 flex items-center justify-center shrink-0',
  bannerTitle:  'text-amber-300 font-black text-sm uppercase tracking-tight',
  bannerSub:    'text-amber-500 text-xs',
  headerCard:   'bg-slate-800 border border-slate-700 rounded-2xl p-6 flex items-start justify-between',
  clinicaName:  'text-xl font-black text-white',
  clinicaMeta:  'text-slate-400 text-sm mt-1',
  grid2:        'grid lg:grid-cols-2 gap-6',
  card:         'bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden',
  cardHeader:   'px-6 py-4 border-b border-slate-700 flex items-center gap-3',
  cardTitle:    'font-black text-white text-sm uppercase tracking-tight',
  cardIcon:     'w-4 h-4 text-slate-400',
  cardBody:     'divide-y divide-slate-700/40',
  row:          'flex items-center justify-between px-6 py-3.5',
  rowLabel:     'text-slate-400 text-sm',
  rowValue:     'text-white text-sm font-semibold',
  badge:        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border',
  statusOk:     'bg-emerald-900/40 text-emerald-400 border-emerald-800',
  statusOff:    'bg-slate-700 text-slate-500 border-slate-600',
  statusBusy:   'bg-amber-900/40 text-amber-400 border-amber-800',
  metricGrid:   'grid grid-cols-2 gap-px bg-slate-700',
  metricCell:   'bg-slate-800 p-5 text-center',
  metricVal:    'text-2xl font-black text-white',
  metricLabel:  'text-xs text-slate-500 mt-0.5',
  surgRow:      'flex items-center gap-4 px-6 py-3.5',
  surgDate:     'text-xs font-bold text-slate-400 w-20 shrink-0',
  surgInfo:     'flex-1 min-w-0',
  surgTitle:    'text-white text-sm font-semibold truncate',
  surgMeta:     'text-slate-500 text-xs',
  surgBadge:    'shrink-0',
  emptyRow:     'px-6 py-8 text-center text-slate-500 text-sm',
  loadingWrap:  'flex items-center justify-center py-20',
  spinner:      'w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin',
  statusBadge:  {
    programada:  'bg-blue-900/40 text-blue-400 border-blue-800',
    completada:  'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    en_proceso:  'bg-amber-900/40 text-amber-400 border-amber-800',
    cancelada:   'bg-red-900/40 text-red-400 border-red-800',
  },
}

export default function ClinicaVista() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['clinica-vista', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_impersonation_data', { p_clinica_id: id })
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className={S.loadingWrap}>
        <div className={S.spinner} />
      </div>
    )
  }

  if (!data) return <p className="text-slate-400">No se encontró la clínica.</p>

  const { clinica, usuarios = [], doctores = [], salas = [], solicitudes_pendientes, cirugias_proximas = [] } = data

  const onboarding = {
    pabellon: usuarios?.some(u => u.role === 'pabellon' || u.role === 'admin_clinica'),
    salas:    (salas?.length ?? 0) > 0,
    doctores: (doctores?.length ?? 0) > 0,
    cirugia:  (cirugias_proximas?.length ?? 0) > 0 || solicitudes_pendientes > 0,
  }
  const onboardingScore = Object.values(onboarding).filter(Boolean).length

  return (
    <div className={S.page}>
      {/* Back */}
      <button onClick={() => navigate('/admin')} className={S.backBtn}>
        <ArrowLeft className="w-4 h-4" />
        Volver al Panel Global
      </button>

      {/* Banner de modo soporte */}
      <div className={S.bannerWrap}>
        <div className={S.bannerIcon}>
          <Eye className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className={S.bannerTitle}>Modo Soporte — Vista de Clínica</p>
          <p className={S.bannerSub}>
            Estás viendo el estado actual de esta clínica como Super Admin. Solo lectura.
          </p>
        </div>
      </div>

      {/* Header clínica */}
      <div className={S.headerCard}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <p className={S.clinicaName}>{clinica?.nombre}</p>
              <p className={S.clinicaMeta}>{clinica?.ciudad} · {clinica?.pais}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-1">Setup completado</p>
          <p className="text-2xl font-black text-white">{onboardingScore}<span className="text-slate-500 text-base">/4</span></p>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className={S.metricGrid}>
        <div className={S.metricCell}>
          <p className={S.metricVal}>{usuarios?.length ?? 0}</p>
          <p className={S.metricLabel}>Usuarios</p>
        </div>
        <div className={S.metricCell}>
          <p className={S.metricVal}>{doctores?.length ?? 0}</p>
          <p className={S.metricLabel}>Médicos</p>
        </div>
        <div className={S.metricCell}>
          <p className={S.metricVal}>{salas?.length ?? 0}</p>
          <p className={S.metricLabel}>Salas</p>
        </div>
        <div className={S.metricCell}>
          <p className={`${S.metricVal} ${solicitudes_pendientes > 0 ? 'text-amber-400' : ''}`}>
            {solicitudes_pendientes ?? 0}
          </p>
          <p className={S.metricLabel}>Solicit. pendientes</p>
        </div>
      </div>

      <div className={S.grid2}>
        {/* Checklist onboarding */}
        <div className={S.card}>
          <div className={S.cardHeader}>
            <Activity className={S.cardIcon} />
            <p className={S.cardTitle}>Checklist de setup</p>
          </div>
          <ul className={S.cardBody}>
            {[
              { ok: onboarding.pabellon, label: 'Usuario de pabellón creado' },
              { ok: onboarding.salas,    label: 'Salas quirúrgicas configuradas' },
              { ok: onboarding.doctores, label: 'Médicos registrados' },
              { ok: onboarding.cirugia,  label: 'Primera cirugía agendada' },
            ].map((item, i) => (
              <li key={i} className={S.row}>
                <span className={S.rowLabel}>{item.label}</span>
                {item.ok
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <XCircle className="w-4 h-4 text-slate-600" />
                }
              </li>
            ))}
          </ul>
        </div>

        {/* Usuarios */}
        <div className={S.card}>
          <div className={S.cardHeader}>
            <Users className={S.cardIcon} />
            <p className={S.cardTitle}>Usuarios ({usuarios?.length ?? 0})</p>
          </div>
          {(!usuarios || usuarios.length === 0) ? (
            <p className={S.emptyRow}>Sin usuarios registrados</p>
          ) : (
            <ul className={S.cardBody}>
              {usuarios.map((u, i) => (
                <li key={i} className={S.row}>
                  <div>
                    <p className="text-white text-sm font-medium">{u.email}</p>
                    <p className="text-slate-500 text-xs">{ROLE_LABELS[u.role] ?? u.role}</p>
                  </div>
                  <span className={`${S.badge} ${u.activo ? S.statusOk : S.statusOff}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Médicos */}
        <div className={S.card}>
          <div className={S.cardHeader}>
            <Stethoscope className={S.cardIcon} />
            <p className={S.cardTitle}>Médicos ({doctores?.length ?? 0})</p>
          </div>
          {(!doctores || doctores.length === 0) ? (
            <p className={S.emptyRow}>Sin médicos registrados</p>
          ) : (
            <ul className={S.cardBody}>
              {doctores.map((d, i) => (
                <li key={i} className={S.row}>
                  <div>
                    <p className="text-white text-sm font-medium">{d.nombre} {d.apellido}</p>
                    <p className="text-slate-500 text-xs">{SPECIALTY_LABELS[d.especialidad] ?? d.especialidad}</p>
                  </div>
                  <span className={`${S.badge} ${d.estado === 'activo' ? S.statusOk : S.statusBusy}`}>
                    {d.estado}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Salas */}
        <div className={S.card}>
          <div className={S.cardHeader}>
            <DoorOpen className={S.cardIcon} />
            <p className={S.cardTitle}>Salas quirúrgicas ({salas?.length ?? 0})</p>
          </div>
          {(!salas || salas.length === 0) ? (
            <p className={S.emptyRow}>Sin salas configuradas</p>
          ) : (
            <ul className={S.cardBody}>
              {salas.map((s, i) => (
                <li key={i} className={S.row}>
                  <p className="text-white text-sm font-medium">{s.nombre}</p>
                  <span className={`${S.badge} ${s.activo ? S.statusOk : S.statusOff}`}>
                    {s.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Cirugías próximas */}
      <div className={S.card}>
        <div className={S.cardHeader}>
          <Calendar className={S.cardIcon} />
          <p className={S.cardTitle}>Cirugías próximas</p>
        </div>
        {(!cirugias_proximas || cirugias_proximas.length === 0) ? (
          <p className={S.emptyRow}>No hay cirugías próximas agendadas</p>
        ) : (
          <ul className="divide-y divide-slate-700/40">
            {cirugias_proximas.map((c, i) => {
              const badgeColor = S.statusBadge[c.estado] ?? S.statusBadge.programada
              return (
                <li key={i} className={S.surgRow}>
                  <p className={S.surgDate}>
                    {format(new Date(c.fecha), 'dd MMM', { locale: es })}
                  </p>
                  <div className={S.surgInfo}>
                    <p className={S.surgTitle}>{c.hora_inicio} hrs</p>
                  </div>
                  <span className={`${S.badge} ${badgeColor} ${S.surgBadge}`}>{c.estado}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
