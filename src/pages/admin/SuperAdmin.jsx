import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2, Users, Activity, AlertTriangle, CheckCircle2,
  Clock, ChevronDown, ChevronUp, RefreshCw, Calendar, Eye,
  Stethoscope, XCircle, TrendingUp, Zap, Ban, RotateCcw,
} from 'lucide-react'
import { getAdminStats, getAllClinics, fetchPlans, getClinicHealth, extendTrial, activatePlan, suspendClinic, reactivateClinic } from '@/services/adminService'
import { useNavigate } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const ESTADO_MAP = {
  activo:     { bg: 'bg-emerald-500/15', text: 'text-emerald-300', dot: 'bg-emerald-400', label: 'Activo' },
  trial:      { bg: 'bg-blue-500/15',    text: 'text-blue-300',    dot: 'bg-blue-400',    label: 'Trial' },
  expirado:   { bg: 'bg-red-500/15',     text: 'text-red-300',     dot: 'bg-red-400',     label: 'Expirado' },
  suspendido: { bg: 'bg-slate-500/15',   text: 'text-slate-400',   dot: 'bg-slate-500',   label: 'Suspendido' },
}

function EstadoBadge({ estado }) {
  const s = ESTADO_MAP[estado] ?? ESTADO_MAP.suspendido
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, gradient, iconColor }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/3 border border-white/8 p-5 flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${gradient}`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <p className="text-3xl font-black text-white tabular-nums">{value ?? '—'}</p>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
    </div>
  )
}

function ChecklistItem({ ok, label }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-semibold ${ok ? 'text-emerald-400' : 'text-slate-600'}`}>
      {ok
        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        : <XCircle className="w-3.5 h-3.5 shrink-0" />
      }
      {label}
    </div>
  )
}

function MetricPill({ label, value, highlight }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-black ${highlight ? 'text-amber-400' : 'text-white'}`}>{value ?? '—'}</p>
      <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}

export default function SuperAdmin() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState(null)
  const [extendDays, setExtendDays] = useState({})
  const [selectedPlan, setSelectedPlan] = useState({})
  const [healthData, setHealthData] = useState({})
  const [loadingHealth, setLoadingHealth] = useState({})

  const loadHealth = async (clinicaId) => {
    if (healthData[clinicaId] || loadingHealth[clinicaId]) return
    setLoadingHealth(p => ({ ...p, [clinicaId]: true }))
    const { data } = await getClinicHealth(clinicaId)
    setHealthData(p => ({ ...p, [clinicaId]: data }))
    setLoadingHealth(p => ({ ...p, [clinicaId]: false }))
  }

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data, error } = await getAdminStats()
      if (error) throw error
      return Array.isArray(data) ? data[0] : data
    },
  })

  const { data: clinicas = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-clinicas'],
    queryFn: async () => {
      const { data, error } = await getAllClinics()
      if (error) throw error
      return data ?? []
    },
  })

  const { data: planes = [] } = useQuery({
    queryKey: ['planes-list'],
    queryFn: async () => {
      const { data } = await fetchPlans()
      return data ?? []
    },
  })

  const mutExtend = useMutation({
    mutationFn: ({ clinicaId, dias }) => extendTrial(clinicaId, dias),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-clinicas', 'admin-stats'] }),
  })

  const mutActivate = useMutation({
    mutationFn: ({ clinicaId, planId }) => activatePlan(clinicaId, planId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-clinicas', 'admin-stats'] }),
  })

  const mutSuspender = useMutation({
    mutationFn: (clinicaId) => suspendClinic(clinicaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-clinicas', 'admin-stats'] }),
  })

  const mutReactivar = useMutation({
    mutationFn: (clinicaId) => reactivateClinic(clinicaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-clinicas', 'admin-stats'] }),
  })

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Panel Global</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión centralizada de todas las clínicas en SurgicalHUB</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Building2}     label="Total clínicas"   value={stats?.total_clinicas}     gradient="bg-blue-600/20"    iconColor="text-blue-400" />
        <StatCard icon={Clock}         label="En trial"          value={stats?.clinicas_en_trial}  gradient="bg-amber-600/20"   iconColor="text-amber-400" />
        <StatCard icon={CheckCircle2}  label="Plan activo"       value={stats?.clinicas_activas}   gradient="bg-emerald-600/20" iconColor="text-emerald-400" />
        <StatCard icon={AlertTriangle} label="Trial expirado"    value={stats?.clinicas_expiradas} gradient="bg-red-600/20"     iconColor="text-red-400" />
        <StatCard icon={Users}         label="Total médicos"     value={stats?.total_doctores}     gradient="bg-violet-600/20"  iconColor="text-violet-400" />
        <StatCard icon={Activity}      label="Total cirugías"    value={stats?.total_cirugias}     gradient="bg-pink-600/20"    iconColor="text-pink-400" />
      </div>

      {/* Clinicas list */}
      <div className="bg-white/3 border border-white/8 rounded-3xl overflow-hidden">

        {/* Card header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-tight">Clínicas registradas</p>
              <p className="text-[10px] text-slate-600">{clinicas.length} en total</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clinicas.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No hay clínicas registradas</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {clinicas.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => { setExpandedId(expandedId === c.id ? null : c.id); loadHealth(c.id) }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors text-left group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/8 flex items-center justify-center shrink-0">
                      <Building2 className="w-4.5 h-4.5 text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{c.nombre}</p>
                      <p className="text-xs text-slate-500 truncate">{c.ciudad} · {c.plan_nombre ?? 'Sin plan'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs text-slate-600 hidden sm:block tabular-nums">
                      {c.total_doctores} médicos · {c.total_cirugias} cirugías
                    </span>
                    <EstadoBadge estado={c.estado} />
                    {expandedId === c.id
                      ? <ChevronUp className="w-4 h-4 text-slate-500" />
                      : <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    }
                  </div>
                </button>

                {/* Expanded panel */}
                {expandedId === c.id && (
                  <div className="px-6 pb-6 pt-4 border-t border-white/5 space-y-5 bg-white/2">

                    {/* Info básica */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Trial hasta', value: c.trial_hasta ? format(new Date(c.trial_hasta), 'dd MMM yyyy', { locale: es }) : '—' },
                        { label: 'Registrada',  value: format(new Date(c.created_at), 'dd MMM yyyy', { locale: es }) },
                        { label: 'Médicos',     value: c.total_doctores },
                        { label: 'Cirugías',    value: c.total_cirugias },
                      ].map((f, i) => (
                        <div key={i}>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">{f.label}</p>
                          <p className="text-white font-bold text-sm">{f.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Health check */}
                    {loadingHealth[c.id] ? (
                      <div className="flex items-center gap-2 text-slate-600 text-xs">
                        <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                        Cargando health check…
                      </div>
                    ) : healthData[c.id] ? (
                      <>
                        <div className="rounded-2xl bg-white/3 border border-white/8 p-4 space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Checklist de setup</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <ChecklistItem ok={healthData[c.id].onboarding?.tiene_pabellon}  label="Usuario pabellón" />
                            <ChecklistItem ok={healthData[c.id].onboarding?.tiene_salas}     label="Salas configuradas" />
                            <ChecklistItem ok={healthData[c.id].onboarding?.tiene_doctores}  label="Médicos creados" />
                            <ChecklistItem ok={healthData[c.id].onboarding?.primera_cirugia} label="1ª cirugía agendada" />
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white/3 border border-white/8 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Métricas de actividad</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <MetricPill label="Solicitudes pendientes" value={healthData[c.id].metricas?.solicitudes_pendientes ?? 0} highlight={(healthData[c.id].metricas?.solicitudes_pendientes ?? 0) > 0} />
                            <MetricPill label="Cirugías este mes"      value={healthData[c.id].metricas?.cirugias_este_mes ?? 0} />
                            <MetricPill label="Tiempo resp. prom."
                              value={healthData[c.id].metricas?.tiempo_respuesta_horas != null
                                ? `${healthData[c.id].metricas.tiempo_respuesta_horas}h` : '—'} />
                            <MetricPill label="Última cirugía"
                              value={healthData[c.id].metricas?.ultima_cirugia
                                ? formatDistanceToNow(new Date(healthData[c.id].metricas.ultima_cirugia), { locale: es, addSuffix: true })
                                : '—'} />
                          </div>
                        </div>
                      </>
                    ) : null}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-1">
                      <button
                        onClick={() => navigate(`/admin/clinica/${c.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-300 text-xs font-black uppercase tracking-wider rounded-xl transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver clínica
                      </button>

                      {c.estado !== 'suspendido' ? (
                        <button
                          onClick={() => mutSuspender.mutate(c.id)}
                          disabled={mutSuspender.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600/15 hover:bg-red-600/25 border border-red-600/30 text-red-400 text-xs font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Suspender
                        </button>
                      ) : (
                        <button
                          onClick={() => mutReactivar.mutate(c.id)}
                          disabled={mutReactivar.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-600/30 text-emerald-400 text-xs font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reactivar
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="number" min="1" max="90"
                          value={extendDays[c.id] ?? 14}
                          onChange={e => setExtendDays(prev => ({ ...prev, [c.id]: Number(e.target.value) }))}
                          className="w-16 px-2 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm text-center focus:outline-none focus:border-amber-500/50 transition-colors"
                        />
                        <button
                          onClick={() => mutExtend.mutate({ clinicaId: c.id, dias: extendDays[c.id] ?? 14 })}
                          disabled={mutExtend.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 text-amber-300 text-xs font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Extender trial
                        </button>
                      </div>

                      {planes.length > 0 && (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedPlan[c.id] ?? planes[0]?.id ?? ''}
                            onChange={(e) => setSelectedPlan(p => ({ ...p, [c.id]: e.target.value }))}
                            className="px-3 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-xs focus:border-emerald-500/50 focus:outline-none transition-colors"
                          >
                            {planes.map(p => (
                              <option key={p.id} value={p.id}>{p.nombre} — ${p.precio_mensual_usd}/mes</option>
                            ))}
                          </select>
                          <button
                            onClick={() => mutActivate.mutate({ clinicaId: c.id, planId: selectedPlan[c.id] ?? planes[0]?.id })}
                            disabled={mutActivate.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 text-emerald-300 text-xs font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Activar plan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
