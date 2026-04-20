import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  CreditCard, Check, Star, Zap, Building2, ArrowRight,
  AlertCircle, CheckCircle2, Calendar, Loader2,
} from 'lucide-react'
import { supabase } from '@/config/supabase'
import { useClinicaInfo, useTrialStatus } from '@/hooks/useClinicaInfo'
import { useTheme } from '@/contexts/ThemeContext'

const PLANES_CONFIG = [
  {
    key: 'Básico',
    icon: Zap,
    color: 'border-slate-200 hover:border-blue-300',
    badge: null,
    features: ['5 médicos', '2 salas de pabellón', 'Gestión de solicitudes', 'Control de insumos', 'Calendario quirúrgico'],
  },
  {
    key: 'Estándar',
    icon: Star,
    color: 'border-blue-500 ring-2 ring-blue-500',
    badge: 'Más popular',
    features: ['15 médicos', '3 salas de pabellón', 'Todo lo del plan Básico', 'Bloqueos avanzados', 'Reportes y estadísticas'],
  },
  {
    key: 'Pro',
    icon: Building2,
    color: 'border-slate-200 hover:border-blue-300',
    badge: null,
    features: ['Médicos ilimitados', 'Salas ilimitadas', 'Todo lo del plan Estándar', 'Soporte prioritario', 'Onboarding personalizado'],
  },
]

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:           'max-w-4xl mx-auto space-y-8',
  pageTitle:      'text-2xl font-black uppercase tracking-tighter',
  pageSubtitle:   'text-sm mt-1',
  statusSection:  'rounded-2xl border p-5',
  statusHeader:   'flex items-center gap-3',
  statusIconBox:  'w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center',
  statusLabel:    'font-bold text-sm',
  badgeActive:    'inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full',
  badgeExpired:   'inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full',
  badgeTrial:     'inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full',
  errorBox:       'flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm',
  successBox:     'flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm',
  plansGrid:      'grid grid-cols-1 md:grid-cols-3 gap-5',
  planCard:       'relative bg-white rounded-2xl border-2 p-6 transition-all',
  planBadge:      'absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full',
  planCurrentBadge:'absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1',
  planHeader:     'flex items-center gap-3 mb-4',
  planIconBox:    'w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center',
  planName:       'font-bold text-slate-900',
  planDoctors:    'text-slate-500 text-xs',
  planPrice:      'text-3xl font-black text-slate-900',
  planPriceSuffix:'text-slate-500 text-sm',
  planFeatures:   'space-y-2 mb-6',
  planFeatureItem:'flex items-start gap-2 text-sm text-slate-700',
  planActiveBadge:'w-full py-2.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl text-center',
  planBtn:        'w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors',
  footer:         'text-xs text-center text-slate-400',
  iconXs:         'w-3 h-3',
  iconSm:         'w-4 h-4',
  iconMdBlue:     'w-5 h-5 text-blue-600',
  iconMdSlate:    'w-5 h-5 text-slate-600',
  iconSpinSm:     'w-4 h-4 animate-spin',
  iconCheckBlue:  'w-4 h-4 text-blue-600 shrink-0 mt-0.5',
  statusFlexRow:  'flex items-center gap-2 mt-0.5 flex-wrap',
  priceMb:        'mb-5',
}

export default function Facturacion() {
  const { theme } = useTheme()
  const { data: clinicaInfo } = useClinicaInfo()
  const trial = useTrialStatus(clinicaInfo)
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [checkoutError, setCheckoutError] = useState(null)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)

  const { data: planes = [] } = useQuery({
    queryKey: ['planes-facturacion'],
    queryFn: async () => {
      const { data } = await supabase
        .from('planes')
        .select('id, nombre, max_doctores, max_salas, precio_mensual_usd')
        .eq('activo', true)
        .order('precio_mensual_usd')
      return data ?? []
    },
  })

  const isDark = theme === 'dark'
  const isMedical = theme === 'medical'
  const title = isDark ? 'text-white' : 'text-slate-900'
  const label = isDark ? 'text-slate-400' : 'text-slate-500'
  const card = isDark ? 'bg-slate-800 border-slate-700' : isMedical ? 'bg-white border-blue-100' : 'bg-white border-slate-200'

  const handleCheckout = async (planId, planNombre) => {
    setLoadingPlan(planId)
    setCheckoutError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Sin sesión activa')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan_id: planId }),
        }
      )

      const json = await res.json()

      if (!res.ok || !json.url) {
        throw new Error(json.error || 'No se pudo iniciar el pago')
      }

      // Redirigir a Stripe Checkout
      window.location.href = json.url
    } catch (err) {
      setCheckoutError(err.message)
      setLoadingPlan(null)
    }
  }

  const planActualId = clinicaInfo?.plan_id

  return (
    <div className={STYLES.page}>
      <div>
        <h1 className={`${STYLES.pageTitle} ${title}`}>Plan y Facturación</h1>
        <p className={`${STYLES.pageSubtitle} ${label}`}>Elige el plan que mejor se adapte a tu clínica.</p>
      </div>

      {/* Estado actual */}
      <section className={`${STYLES.statusSection} ${card}`}>
        <div className={STYLES.statusHeader}>
          <div className={STYLES.statusIconBox}>
            <CreditCard className={STYLES.iconMdBlue} />
          </div>
          <div>
            <p className={`${STYLES.statusLabel} ${title}`}>Estado actual</p>
            <div className={STYLES.statusFlexRow}>
              {clinicaInfo?.estado === 'activo' ? (
                <span className={STYLES.badgeActive}>
                  <CheckCircle2 className={STYLES.iconXs} /> Plan activo — {clinicaInfo.planes?.nombre}
                </span>
              ) : trial.isExpired ? (
                <span className={STYLES.badgeExpired}>
                  <AlertCircle className={STYLES.iconXs} /> Trial expirado
                </span>
              ) : (
                <span className={STYLES.badgeTrial}>
                  <Calendar className={STYLES.iconXs} />
                  {trial.daysLeft === 0 ? 'Trial expira hoy' : `${trial.daysLeft} días de trial restantes`}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {checkoutError && (
        <div className={STYLES.errorBox}>
          <AlertCircle className={STYLES.iconSm} />
          {checkoutError}
        </div>
      )}

      {checkoutSuccess && (
        <div className={STYLES.successBox}>
          <CheckCircle2 className={STYLES.iconSm} />
          ¡Plan activado exitosamente! Redirigiendo...
        </div>
      )}

      {/* Planes */}
      <div className={STYLES.plansGrid}>
        {PLANES_CONFIG.map(config => {
          const planDB = planes.find(p => p.nombre === config.key)
          if (!planDB) return null
          const Icon = config.icon
          const isCurrent = planActualId === planDB.id && clinicaInfo?.estado === 'activo'
          const isLoading = loadingPlan === planDB.id

          return (
            <div
              key={planDB.id}
              className={`${STYLES.planCard} ${config.color} ${isCurrent ? 'ring-2 ring-emerald-400 border-emerald-400' : ''}`}
            >
              {config.badge && !isCurrent && (
                <span className={STYLES.planBadge}>{config.badge}</span>
              )}
              {isCurrent && (
                <span className={STYLES.planCurrentBadge}>
                  <CheckCircle2 className={STYLES.iconXs} /> Plan actual
                </span>
              )}

              <div className={STYLES.planHeader}>
                <div className={STYLES.planIconBox}>
                  <Icon className={STYLES.iconMdSlate} />
                </div>
                <div>
                  <h3 className={STYLES.planName}>{planDB.nombre}</h3>
                  <p className={STYLES.planDoctors}>
                    {planDB.max_doctores >= 999 ? 'Médicos ilimitados' : `Hasta ${planDB.max_doctores} médicos`}
                  </p>
                </div>
              </div>

              <div className={STYLES.priceMb}>
                <span className={STYLES.planPrice}>${planDB.precio_mensual_usd}</span>
                <span className={STYLES.planPriceSuffix}> USD/mes</span>
              </div>

              <ul className={STYLES.planFeatures}>
                {config.features.map(f => (
                  <li key={f} className={STYLES.planFeatureItem}>
                    <Check className={STYLES.iconCheckBlue} />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className={STYLES.planActiveBadge}>Plan activo</div>
              ) : (
                <button
                  onClick={() => handleCheckout(planDB.id, planDB.nombre)}
                  disabled={!!loadingPlan}
                  className={STYLES.planBtn}
                >
                  {isLoading ? (
                    <Loader2 className={STYLES.iconSpinSm} />
                  ) : (
                    <>Activar plan <ArrowRight className={STYLES.iconSm} /></>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className={STYLES.footer}>
        Los pagos son procesados de forma segura por Stripe. Puedes cancelar en cualquier momento.
      </p>
    </div>
  )
}
