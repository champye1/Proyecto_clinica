import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, LayoutGrid, UserPlus, ArrowRight,
  Sparkles, ChevronRight, Check,
} from 'lucide-react'

// ─── Datos ────────────────────────────────────────────────────────────────────
const PASOS = [
  {
    id: 'sala',
    icon: LayoutGrid,
    titulo: 'Agrega tu primera sala de pabellón',
    descripcion: 'Define los pabellones quirúrgicos disponibles en tu clínica.',
    cta: 'Agregar sala',
    ruta: '/pabellon/configuracion',
    color: 'bg-violet-50 text-violet-600',
    iconBg: 'bg-violet-100',
  },
  {
    id: 'doctor',
    icon: UserPlus,
    titulo: 'Invita a tus médicos',
    descripcion: 'Crea cuentas para que tus médicos puedan enviar solicitudes de cirugía.',
    cta: 'Agregar médico',
    ruta: '/pabellon/medicos',
    color: 'bg-blue-50 text-blue-600',
    iconBg: 'bg-blue-100',
  },
  {
    id: 'dashboard',
    icon: Building2,
    titulo: 'Explora el dashboard',
    descripcion: 'Revisa el estado de tus pabellones, solicitudes y cirugías del día.',
    cta: 'Ver dashboard',
    ruta: '/pabellon',
    color: 'bg-emerald-50 text-emerald-600',
    iconBg: 'bg-emerald-100',
  },
]

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:           'min-h-screen bg-slate-50',
  header:         'bg-white border-b border-slate-200 px-6 py-4',
  headerInner:    'max-w-3xl mx-auto flex items-center gap-3',
  logoBox:        'w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center',
  logoText:       'font-bold text-slate-800',
  main:           'max-w-3xl mx-auto px-6 py-16',
  hero:           'text-center mb-14',
  heroIconBox:    'w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200',
  heroTitle:      'text-4xl font-bold text-slate-900 mb-3',
  heroSubtitle:   'text-lg text-slate-500 max-w-lg mx-auto',
  progressCard:   'bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-sm',
  progressHeader: 'flex items-center justify-between mb-3',
  progressLabel:  'text-sm font-medium text-slate-700',
  progressCount:  'text-sm font-semibold text-blue-600',
  progressTrack:  'w-full bg-slate-100 rounded-full h-2',
  progressBar:    'bg-blue-600 h-2 rounded-full transition-all duration-500',
  stepList:       'space-y-4 mb-10',
  stepCardBase:   'bg-white rounded-2xl border p-5 shadow-sm transition-all',
  stepCardDone:   'border-emerald-200 opacity-75',
  stepCardPending:'border-slate-200 hover:border-blue-200 hover:shadow-md',
  stepInner:      'flex items-center gap-4',
  stepIconWrap:   'relative shrink-0',
  stepIconBox:    'w-12 h-12 rounded-xl flex items-center justify-center',
  stepBadge:      'absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400',
  stepContent:    'flex-1 min-w-0',
  stepTitleDone:  'font-semibold text-base mb-0.5 line-through text-slate-400',
  stepTitlePending:'font-semibold text-base mb-0.5 text-slate-900',
  stepDesc:       'text-sm text-slate-500',
  stepBtn:        'shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors',
  stepDoneBadge:  'shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-xl',
  ctaWrap:        'text-center',
  dashboardBtn:   'inline-flex items-center gap-2 px-6 py-3 border-2 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 font-medium rounded-xl transition-colors text-sm',
  ctaHint:        'mt-3 text-xs text-slate-400',
  logoIcon:       'w-5 h-5 text-white',
  sparklesIcon:   'w-8 h-8 text-white',
  chevronIcon:    'w-3.5 h-3.5',
  checkIconSm:    'w-3.5 h-3.5',
  arrowIcon:      'w-4 h-4',
  checkDoneIcon:  'w-3 h-3 text-emerald-500',
}

export default function Bienvenida() {
  const navigate = useNavigate()
  const [completados, setCompletados] = useState(new Set())

  const handlePaso = (paso) => {
    setCompletados(prev => new Set([...prev, paso.id]))
    navigate(paso.ruta)
  }

  const progreso = completados.size
  const porcentaje = Math.round((progreso / PASOS.length) * 100)

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
        <div className={STYLES.hero}>
          <div className={STYLES.heroIconBox}>
            <Sparkles className={STYLES.sparklesIcon} />
          </div>
          <h1 className={STYLES.heroTitle}>¡Bienvenido a SurgicalHUB!</h1>
          <p className={STYLES.heroSubtitle}>
            Tu clínica está lista. Sigue estos pasos para configurarla en menos de 5 minutos.
          </p>
        </div>

        {/* Barra de progreso */}
        <div className={STYLES.progressCard}>
          <div className={STYLES.progressHeader}>
            <span className={STYLES.progressLabel}>Configuración inicial</span>
            <span className={STYLES.progressCount}>{progreso}/{PASOS.length} completados</span>
          </div>
          <div className={STYLES.progressTrack}>
            <div className={STYLES.progressBar} style={{ width: `${porcentaje}%` }} />
          </div>
        </div>

        {/* Pasos */}
        <div className={STYLES.stepList}>
          {PASOS.map((paso, index) => {
            const Icon = paso.icon
            const done = completados.has(paso.id)
            const iconColorClass = paso.color.split(' ')[1]

            return (
              <div
                key={paso.id}
                className={`${STYLES.stepCardBase} ${done ? STYLES.stepCardDone : STYLES.stepCardPending}`}
              >
                <div className={STYLES.stepInner}>
                  <div className={STYLES.stepIconWrap}>
                    <div className={`${STYLES.stepIconBox} ${paso.iconBg}`}>
                      <Icon className={`w-6 h-6 ${done ? 'text-emerald-500' : iconColorClass}`} />
                    </div>
                    <div className={STYLES.stepBadge}>
                      {done ? (
                        <Check className={STYLES.checkDoneIcon} strokeWidth={3} />
                      ) : (
                        index + 1
                      )}
                    </div>
                  </div>

                  <div className={STYLES.stepContent}>
                    <h3 className={done ? STYLES.stepTitleDone : STYLES.stepTitlePending}>
                      {paso.titulo}
                    </h3>
                    <p className={STYLES.stepDesc}>{paso.descripcion}</p>
                  </div>

                  {!done && (
                    <button onClick={() => handlePaso(paso)} className={STYLES.stepBtn}>
                      {paso.cta}
                      <ChevronRight className={STYLES.chevronIcon} />
                    </button>
                  )}
                  {done && (
                    <span className={STYLES.stepDoneBadge}>
                      <Check className={STYLES.checkIconSm} />
                      Listo
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className={STYLES.ctaWrap}>
          <button onClick={() => navigate('/pabellon')} className={STYLES.dashboardBtn}>
            Ir al dashboard ahora
            <ArrowRight className={STYLES.arrowIcon} />
          </button>
          <p className={STYLES.ctaHint}>Puedes completar la configuración más tarde.</p>
        </div>
      </main>
    </div>
  )
}
