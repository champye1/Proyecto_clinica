import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Building2, Check, Star, Zap, ArrowRight, Users, LayoutGrid, AlertTriangle } from 'lucide-react'
import { supabase } from '@/config/supabase'

// ─── Datos ────────────────────────────────────────────────────────────────────
const PLANES_CONFIG = [
  {
    key: 'Básico',
    precio: 39,
    icon: Zap,
    color: 'border-slate-200 hover:border-blue-300',
    badge: null,
    features: [
      '5 médicos',
      '2 usuarios de pabellón',
      '1 sala de pabellón',
      'Gestión de solicitudes',
      'Control de insumos',
      'Calendario quirúrgico',
    ],
  },
  {
    key: 'Estándar',
    precio: 89,
    icon: Star,
    color: 'border-blue-500 ring-2 ring-blue-500',
    badge: 'Más popular',
    features: [
      '15 médicos',
      '5 usuarios de pabellón',
      '3 salas de pabellón',
      'Todo lo del plan Básico',
      'Bloqueos de horario avanzados',
      'Reportes y estadísticas',
    ],
  },
  {
    key: 'Pro',
    precio: 199,
    icon: Building2,
    color: 'border-slate-200 hover:border-blue-300',
    badge: null,
    features: [
      'Médicos ilimitados',
      'Usuarios ilimitados',
      'Salas ilimitadas',
      'Todo lo del plan Estándar',
      'Soporte prioritario',
      'Onboarding personalizado',
    ],
  },
]

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:           'min-h-screen bg-slate-50',
  header:         'bg-white border-b border-slate-200 px-6 py-4',
  headerInner:    'max-w-5xl mx-auto flex items-center gap-3',
  logoBox:        'w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center',
  logoText:       'font-bold text-slate-800',
  main:           'max-w-5xl mx-auto px-6 py-16',
  titleWrap:      'text-center mb-14',
  stepBadge:      'inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6',
  title:          'text-4xl font-bold text-slate-900 mb-4',
  subtitle:       'text-lg text-slate-500 max-w-xl mx-auto',
  plansGrid:      'grid grid-cols-1 md:grid-cols-3 gap-6 mb-10',
  planCardBase:   'relative text-left p-6 rounded-2xl border-2 bg-white transition-all cursor-pointer',
  planBadge:      'absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap',
  planHeader:     'flex items-start justify-between mb-4',
  planIconActive: 'w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600',
  planIconDefault:'w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100',
  planCheckmark:  'w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0',
  planName:       'text-lg font-bold text-slate-900 mb-1',
  planPrice:      'text-3xl font-bold text-slate-900',
  planPriceSuffix:'text-slate-500 text-sm',
  planLimits:     'flex flex-wrap gap-3 mb-6',
  planLimitBadge: 'inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg',
  planFeatures:   'space-y-2.5',
  planFeatureItem:'flex items-center gap-2 text-sm text-slate-700',
  ctaWrap:        'flex flex-col items-center gap-3',
  submitBtn:      'inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm',
  spinner:        'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin',
  ctaHint:        'text-xs text-slate-400',
  loadingPage:    'min-h-screen bg-slate-50 flex items-center justify-center',
  loadingSpinner: 'w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin',
  logoIcon:       'w-5 h-5 text-white',
  checkIconSm:    'w-3.5 h-3.5 text-white',
  priceMb:        'mb-6',
  iconXs:         'w-3 h-3',
  arrowIcon:      'w-4 h-4',
}

export default function ElegirPlan() {
  const navigate = useNavigate()
  const location = useLocation()
  const trialExpired = location.state?.trialExpired === true
  const [planes, setPlanes] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingPlanes, setLoadingPlanes] = useState(true)

  useEffect(() => {
    supabase
      .from('planes')
      .select('id, nombre, max_doctores, max_pabellon, max_salas, precio_mensual_usd')
      .eq('activo', true)
      .order('precio_mensual_usd', { ascending: true })
      .then(({ data }) => {
        setPlanes(data ?? [])
        const estandar = data?.find(p => p.nombre === 'Estándar')
        if (estandar) setSelected(estandar.id)
        setLoadingPlanes(false)
      })
  }, [])

  const handleContinuar = async () => {
    if (!selected) return
    setLoading(true)
    try {
      await supabase.rpc('actualizar_plan_clinica', { p_plan_id: selected })
      navigate('/bienvenida', { replace: true })
    } catch {
      navigate('/bienvenida', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  if (loadingPlanes) {
    return (
      <div className={STYLES.loadingPage}>
        <div className={STYLES.loadingSpinner} />
      </div>
    )
  }

  return (
    <div className={STYLES.page}>
      <header className={STYLES.header}>
        <div className={STYLES.headerInner}>
          <div className={STYLES.logoBox}>
            <Building2 className={STYLES.logoIcon} />
          </div>
          <span className={STYLES.logoText}>SurgicalHUB</span>
        </div>
      </header>

      <main className={STYLES.main}>

        {/* Banner: trial expirado */}
        {trialExpired && (
          <div className="mb-8 bg-red-50 border-2 border-red-300 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-bold text-red-800 text-base">Tu período de demo ha finalizado</p>
              <p className="text-red-600 text-sm mt-1">
                Para seguir usando SurgicalHUB elige un plan. Tu historial y datos están guardados.
              </p>
            </div>
          </div>
        )}

        <div className={STYLES.titleWrap}>
          {!trialExpired && (
            <div className={STYLES.stepBadge}>
              <span>Paso 2 de 3</span>
            </div>
          )}
          <h1 className={STYLES.title}>
            {trialExpired ? 'Activa tu plan' : 'Elige tu plan'}
          </h1>
          <p className={STYLES.subtitle}>
            {trialExpired
              ? 'Selecciona el plan que mejor se adapte a tu clínica. Sin permanencia.'
              : 'Empieza con 14 días gratis. Sin tarjeta de crédito. Cambia o cancela cuando quieras.'}
          </p>
        </div>

        <div className={STYLES.plansGrid}>
          {PLANES_CONFIG.map(config => {
            const planDB = planes.find(p => p.nombre === config.key)
            if (!planDB) return null
            const isSelected = selected === planDB.id
            const Icon = config.icon

            return (
              <button
                key={planDB.id}
                onClick={() => setSelected(planDB.id)}
                className={`${STYLES.planCardBase} ${config.color} ${isSelected ? 'shadow-lg' : 'shadow-sm'}`}
              >
                {config.badge && (
                  <span className={STYLES.planBadge}>{config.badge}</span>
                )}

                <div className={STYLES.planHeader}>
                  <div className={isSelected ? STYLES.planIconActive : STYLES.planIconDefault}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                  {isSelected && (
                    <div className={STYLES.planCheckmark}>
                      <Check className={STYLES.checkIconSm} />
                    </div>
                  )}
                </div>

                <h3 className={STYLES.planName}>{planDB.nombre}</h3>
                <div className={STYLES.priceMb}>
                  <span className={STYLES.planPrice}>${planDB.precio_mensual_usd}</span>
                  <span className={STYLES.planPriceSuffix}> USD/mes</span>
                </div>

                <div className={STYLES.planLimits}>
                  <span className={STYLES.planLimitBadge}>
                    <Users className={STYLES.iconXs} />
                    {planDB.max_doctores >= 999 ? 'Ilimitados' : `${planDB.max_doctores} médicos`}
                  </span>
                  <span className={STYLES.planLimitBadge}>
                    <LayoutGrid className={STYLES.iconXs} />
                    {planDB.max_salas >= 99 ? 'Ilimitadas' : `${planDB.max_salas} sala${planDB.max_salas > 1 ? 's' : ''}`}
                  </span>
                </div>

                <ul className={STYLES.planFeatures}>
                  {config.features.map(f => (
                    <li key={f} className={STYLES.planFeatureItem}>
                      <Check className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        <div className={STYLES.ctaWrap}>
          <button
            onClick={handleContinuar}
            disabled={!selected || loading}
            className={STYLES.submitBtn}
          >
            {loading ? (
              <span className={STYLES.spinner} />
            ) : (
              <>Continuar con este plan <ArrowRight className={STYLES.arrowIcon} /></>
            )}
          </button>
          <p className={STYLES.ctaHint}>Podrás cambiar de plan en cualquier momento desde la configuración.</p>
          {!trialExpired && (
            <Link to="/bienvenida" className="text-sm text-slate-400 hover:text-blue-600 transition-colors mt-1">
              Continuar con el demo gratuito →
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
