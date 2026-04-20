import { useQuery } from '@tanstack/react-query'
import {
  DollarSign, TrendingUp, Building2, Clock, AlertTriangle,
  Ban, RefreshCw, ArrowUpRight, ArrowDownRight, Percent,
  Users, Award, TrendingDown, CalendarClock, BarChart2,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { supabase } from '@/config/supabase'
import { exportToCsv } from '@/utils/exportCsv'

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, prefix = '', suffix = '', sub, trend, gradient, iconColor }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/3 border border-white/8 p-5 flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${gradient}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-3xl font-black text-white tabular-nums">
        {prefix}{value ?? '—'}{suffix}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      {sub != null && <p className="text-xs text-slate-600 -mt-1">{sub}</p>}
      {trend != null && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0
            ? <ArrowUpRight className="w-3.5 h-3.5" />
            : <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(trend)} vs mes anterior
        </div>
      )}
    </div>
  )
}

// ─── Plan Row ─────────────────────────────────────────────────────────────────
function PlanRow({ plan, totalMrr }) {
  const pct = totalMrr > 0 ? Math.round((plan.mrr_aporte / totalMrr) * 100) : 0
  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-bold truncate">{plan.nombre}</p>
        <p className="text-slate-500 text-xs">${plan.precio_mensual_usd}/mes · {plan.clinicas} clínica{plan.clinicas !== 1 ? 's' : ''}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-white font-black text-sm tabular-nums">${plan.mrr_aporte.toLocaleString()}</p>
        <p className="text-slate-600 text-xs">{pct}% del MRR</p>
      </div>
      <div className="w-24 hidden sm:block">
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

// ─── MRR Tooltip ─────────────────────────────────────────────────────────────
function MrrTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1 uppercase tracking-wider font-bold">{label}</p>
      <p className="text-emerald-400 font-black text-base">${Number(payload[0].value).toLocaleString()} <span className="text-slate-500 font-normal">USD/mes</span></p>
    </div>
  )
}

// ─── Trial Badge ──────────────────────────────────────────────────────────────
function DiasBadge({ dias }) {
  if (dias <= 2) return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30">{dias}d</span>
  if (dias <= 7) return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">{dias}d</span>
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">{dias}d</span>
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Financiero() {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['financial-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_financial_stats')
      if (error) throw error
      return data
    },
  })

  const handleExport = () => {
    if (!stats) return

    // Sheet 1: Resumen general
    const resumen = [{
      'MRR (USD/mes)':         Number(stats.mrr_total),
      'ARR (USD/año)':         Number(stats.arr_total),
      'ARPU (USD)':            Number(stats.arpu),
      'Churn Rate (%)':        Number(stats.churn_rate),
      'LTV Estimado (USD)':    Number(stats.ltv_estimado),
      'Tasa conversión (%)':   Number(stats.tasa_conversion),
      'Clínicas activas':      Number(stats.clinicas_pagando),
      'En trial':              Number(stats.clinicas_trial),
      'Trial expirado':        Number(stats.clinicas_expiradas),
      'Suspendidas':           Number(stats.clinicas_suspendidas),
      'Nuevas este mes':       Number(stats.nuevas_este_mes),
    }]

    exportToCsv(resumen, 'financiero_resumen')

    // Sheet 2: Por plan
    if (stats.por_plan?.length > 0) {
      exportToCsv(
        stats.por_plan.map(p => ({
          Plan:                    p.nombre,
          'Precio mensual USD':    p.precio_mensual_usd,
          'Clínicas activas':      p.clinicas,
          'MRR aporte USD':        p.mrr_aporte,
          '% del MRR':             stats.mrr_total > 0 ? Math.round(p.mrr_aporte / stats.mrr_total * 100) : 0,
        })),
        'financiero_por_plan'
      )
    }

    // Sheet 3: Histórico MRR
    if (stats.mrr_historico?.length > 0) {
      exportToCsv(
        stats.mrr_historico.map(h => ({ Mes: h.mes, 'MRR Acumulado USD': h.mrr })),
        'financiero_mrr_historico'
      )
    }
  }

  const nuevasTrend  = stats ? Number(stats.nuevas_este_mes) - Number(stats.nuevas_mes_anterior) : null
  const mrrHistorico = stats?.mrr_historico ?? []
  const trialsVencer = stats?.trials_por_vencer ?? []

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Dashboard Financiero</h1>
          <p className="text-slate-500 text-sm mt-1">MRR, churn, LTV y métricas de suscripción</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={!stats}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-40"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !stats ? (
        <p className="text-slate-500 text-sm">No se pudieron cargar las métricas.</p>
      ) : (
        <>
          {/* ── KPIs principales ─────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={DollarSign}
              label="MRR"
              prefix="$"
              value={Number(stats.mrr_total).toLocaleString()}
              sub="Ingresos mensuales recurrentes"
              gradient="bg-emerald-600/20"
              iconColor="text-emerald-400"
            />
            <KpiCard
              icon={TrendingUp}
              label="ARR"
              prefix="$"
              value={Number(stats.arr_total).toLocaleString()}
              sub="Ingresos anuales proyectados"
              gradient="bg-blue-600/20"
              iconColor="text-blue-400"
            />
            <KpiCard
              icon={Percent}
              label="Tasa de conversión"
              value={stats.tasa_conversion}
              suffix="%"
              sub="Trial → plan de pago"
              gradient="bg-violet-600/20"
              iconColor="text-violet-400"
            />
            <KpiCard
              icon={Building2}
              label="Nuevas este mes"
              value={stats.nuevas_este_mes}
              trend={nuevasTrend}
              sub={`${stats.nuevas_mes_anterior} el mes anterior`}
              gradient="bg-amber-600/20"
              iconColor="text-amber-400"
            />
          </div>

          {/* ── KPIs avanzados (Baremetrics-style) ──────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon={Users}
              label="ARPU"
              prefix="$"
              value={Number(stats.arpu).toLocaleString()}
              sub="Ingreso promedio por clínica activa"
              gradient="bg-cyan-600/20"
              iconColor="text-cyan-400"
            />
            <KpiCard
              icon={TrendingDown}
              label="Churn Rate"
              value={stats.churn_rate}
              suffix="%"
              sub="Clínicas perdidas vs total evaluadas"
              gradient="bg-rose-600/20"
              iconColor="text-rose-400"
            />
            <KpiCard
              icon={Award}
              label="LTV Estimado"
              prefix="$"
              value={Number(stats.ltv_estimado) > 0 ? Number(stats.ltv_estimado).toLocaleString() : '—'}
              sub="ARPU ÷ Churn Rate mensual"
              gradient="bg-orange-600/20"
              iconColor="text-orange-400"
            />
          </div>

          {/* ── Distribución de estados ──────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Building2,     label: 'Con plan activo',  value: stats.clinicas_pagando,    gradient: 'bg-emerald-600/20', iconColor: 'text-emerald-400' },
              { icon: Clock,         label: 'En trial',         value: stats.clinicas_trial,      gradient: 'bg-blue-600/20',    iconColor: 'text-blue-400'    },
              { icon: AlertTriangle, label: 'Trial expirado',   value: stats.clinicas_expiradas,  gradient: 'bg-red-600/20',     iconColor: 'text-red-400'     },
              { icon: Ban,           label: 'Suspendidas',      value: stats.clinicas_suspendidas,gradient: 'bg-slate-600/20',   iconColor: 'text-slate-400'   },
            ].map((c, i) => (
              <KpiCard key={i} {...c} />
            ))}
          </div>

          {/* ── MRR Histórico (AreaChart) ────────────────────── */}
          <div className="bg-white/3 border border-white/8 rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tight">Tendencia MRR</p>
                <p className="text-[10px] text-slate-600">Crecimiento acumulado últimos 12 meses · basado en clínicas activas actuales</p>
              </div>
            </div>
            {mrrHistorico.length === 0 ? (
              <div className="py-12 text-center">
                <BarChart2 className="w-7 h-7 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Sin datos históricos aún</p>
              </div>
            ) : (
              <div className="px-2 pt-4 pb-2">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={mrrHistorico} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                      width={48}
                    />
                    <Tooltip content={<MrrTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="mrr"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#mrrGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── Grid: MRR por plan + Trials por vencer ──────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* MRR por plan */}
            <div className="bg-white/3 border border-white/8 rounded-3xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-tight">MRR por plan</p>
                  <p className="text-[10px] text-slate-600">Solo clínicas con plan activo</p>
                </div>
              </div>
              {!stats.por_plan?.length ? (
                <div className="py-12 text-center flex-1 flex flex-col items-center justify-center">
                  <DollarSign className="w-7 h-7 text-slate-700 mb-2" />
                  <p className="text-slate-500 text-sm">Sin planes activos aún</p>
                </div>
              ) : (
                <ul className="divide-y divide-white/5 flex-1">
                  {stats.por_plan.map((p, i) => (
                    <PlanRow key={i} plan={p} totalMrr={Number(stats.mrr_total)} />
                  ))}
                </ul>
              )}
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/2">
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Total MRR</p>
                <p className="text-white font-black text-lg tabular-nums">
                  ${Number(stats.mrr_total).toLocaleString()}{' '}
                  <span className="text-slate-500 text-sm font-medium">USD/mes</span>
                </p>
              </div>
            </div>

            {/* Trials próximos a vencer */}
            <div className="bg-white/3 border border-white/8 rounded-3xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-600/20 flex items-center justify-center">
                  <CalendarClock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-tight">Trials por vencer</p>
                  <p className="text-[10px] text-slate-600">Próximos 14 días — acción recomendada</p>
                </div>
              </div>
              {trialsVencer.length === 0 ? (
                <div className="py-12 text-center flex-1 flex flex-col items-center justify-center">
                  <CalendarClock className="w-7 h-7 text-slate-700 mb-2" />
                  <p className="text-slate-500 text-sm">Ningún trial vence en los próximos 14 días</p>
                </div>
              ) : (
                <ul className="divide-y divide-white/5 flex-1 overflow-y-auto max-h-72">
                  {trialsVencer.map((t) => (
                    <li key={t.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/3 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">{t.nombre}</p>
                        <p className="text-slate-500 text-xs">{t.ciudad}</p>
                      </div>
                      <DiasBadge dias={t.dias_restantes} />
                    </li>
                  ))}
                </ul>
              )}
              {trialsVencer.length > 0 && (
                <div className="px-6 py-3 border-t border-white/5 bg-white/2">
                  <p className="text-xs text-slate-600">
                    <span className="text-amber-400 font-bold">{trialsVencer.length}</span> clínica{trialsVencer.length !== 1 ? 's' : ''} por vencer — considera contactarlas antes de que expiren
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-700 text-center">
            Los valores son estimados basados en los planes asignados. No incluye descuentos ni pagos reales procesados.
          </p>
        </>
      )}
    </div>
  )
}
