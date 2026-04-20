import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Stethoscope, Menu, X, Check, ArrowRight, Calendar,
  Users, Package, LayoutGrid, Clock, FileText, Star,
  Zap, Building2, Shield, ChevronDown, Phone, Mail,
  CheckCircle2, BarChart3, Bell, Lock,
} from 'lucide-react'

// ── Datos ──────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Inicio', href: '#hero' },
  { label: 'Características', href: '#caracteristicas' },
  { label: 'Precios', href: '#precios' },
  { label: 'Contacto', href: '#contacto' },
]

const FEATURES = [
  {
    icon: Calendar,
    title: 'Agenda Quirúrgica',
    desc: 'Calendario visual de pabellones con programación de cirugías, bloqueos de horario y detección de conflictos en tiempo real.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Users,
    title: 'Gestión de Médicos',
    desc: 'Panel dedicado para médicos con acceso web propio. Solicitudes de cirugía, seguimiento de pacientes y notificaciones automáticas.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: Package,
    title: 'Control de Insumos',
    desc: 'Inventario de insumos quirúrgicos con alertas de stock, consumo por cirugía y reportes de uso por período.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: FileText,
    title: 'Solicitudes Digitales',
    desc: 'Los médicos envían solicitudes quirúrgicas digitalmente. Pabellón acepta, rechaza o reagenda con un clic.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Bell,
    title: 'Notificaciones en Tiempo Real',
    desc: 'Alertas instantáneas al médico cuando su cirugía es aceptada, rechazada o reagendada. Sin llamadas telefónicas.',
    color: 'bg-rose-100 text-rose-600',
  },
  {
    icon: BarChart3,
    title: 'Reportes y Auditoría',
    desc: 'Historial completo de operaciones, reportes de ocupación por sala y estadísticas de cirugías por período.',
    color: 'bg-cyan-100 text-cyan-600',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Crea tu cuenta', desc: 'Registra tu clínica en 2 minutos. Sin instalar nada, todo en la nube.', icon: Lock },
  { step: '02', title: 'Configura tu pabellón', desc: 'Agrega tus salas quirúrgicas e invita a tus médicos con acceso individual.', icon: LayoutGrid },
  { step: '03', title: 'Gestiona tus cirugías', desc: 'Los médicos envían solicitudes digitales. Tú programas, confirmas y notificas.', icon: Calendar },
]

const WHY_US = [
  { icon: Shield, title: 'Datos seguros y privados', desc: 'Infraestructura con encriptación de nivel bancario. Cada clínica ve solo sus propios datos.' },
  { icon: Clock, title: 'Sin curva de aprendizaje', desc: 'Interfaz intuitiva. Tu equipo estará operando en el mismo día de la instalación.' },
  { icon: CheckCircle2, title: 'Soporte en español', desc: 'Equipo de soporte local. Respondemos por WhatsApp, email y videollamada.' },
]

const WHY_US_STATS = [
  { value: '14 días', label: 'Prueba gratuita', color: 'bg-blue-600' },
  { value: '99.9%', label: 'Uptime garantizado', color: 'bg-emerald-600' },
  { value: '< 2 min', label: 'Tiempo de respuesta soporte', color: 'bg-violet-600' },
  { value: '0 papeles', label: 'Todo digital y en la nube', color: 'bg-amber-500' },
]

const CONTACT_ITEMS = [
  { icon: Phone, label: 'Teléfono / WhatsApp', value: '+56 9 XXXX XXXX', link: null },
  { icon: Mail, label: 'Email', value: 'contacto@surgicalhub.cl', link: null },
  { icon: Stethoscope, label: 'Demo gratuita', value: 'Solicitar demo →', link: '/registro' },
]

const PLANES = [
  {
    nombre: 'Básico',
    precio: 39,
    icon: Zap,
    badge: null,
    destacado: false,
    features: [
      '5 médicos',
      '2 usuarios de pabellón',
      '1 sala de pabellón',
      'Gestión de solicitudes',
      'Control de insumos',
      'Calendario quirúrgico',
      'Soporte por email',
    ],
  },
  {
    nombre: 'Estándar',
    precio: 89,
    icon: Star,
    badge: 'Más popular',
    destacado: true,
    features: [
      '15 médicos',
      '5 usuarios de pabellón',
      '3 salas de pabellón',
      'Todo lo del plan Básico',
      'Bloqueos de horario avanzados',
      'Reportes y estadísticas',
      'Soporte prioritario',
    ],
  },
  {
    nombre: 'Pro',
    precio: 199,
    icon: Building2,
    badge: null,
    destacado: false,
    features: [
      'Médicos ilimitados',
      'Usuarios ilimitados',
      'Salas ilimitadas',
      'Todo lo del plan Estándar',
      'Onboarding personalizado',
      'Soporte 24/7',
      'API de integración',
    ],
  },
]

const STATS = [
  { value: '< 5 min', label: 'Para configurar tu clínica' },
  { value: '14 días', label: 'De prueba gratuita' },
  { value: '100%', label: 'En la nube, sin instalar nada' },
  { value: '24/7', label: 'Acceso desde cualquier dispositivo' },
]

// ── Estilos ─────────────────────────────────────────────────────
const STYLES = {
  // Layout
  page:             'min-h-screen bg-white font-sans',
  container:        'max-w-6xl mx-auto px-4 sm:px-6',

  // Navbar
  header:           'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
  headerScrolled:   'bg-slate-900/95 backdrop-blur-md shadow-xl',
  headerDefault:    'bg-slate-900',
  navInner:         'max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between',
  logoBox:          'w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center',
  logoText:         'font-black text-white text-lg tracking-tight',
  navDesktop:       'hidden md:flex items-center gap-1',
  navBtn:           'px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors',
  navCtas:          'hidden md:flex items-center gap-2',
  navLogin:         'px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors',
  navRegister:      'px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors',
  menuBtn:          'md:hidden p-2 text-slate-300 hover:text-white',
  mobileMenu:       'md:hidden bg-slate-900 border-t border-slate-800 px-4 py-4 space-y-1',
  mobileNavBtn:     'w-full text-left px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors',
  mobileCtas:       'pt-3 border-t border-slate-800 space-y-2',
  mobileLogin:      'block text-center px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white',
  mobileRegister:   'block text-center px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg',

  // Hero
  heroSection:      'pt-16 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white',
  heroInner:        'max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center',
  heroBadge:        'inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6',
  heroTitle:        'text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6',
  heroHighlight:    'text-blue-400',
  heroSubtitle:     'text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed',
  heroCtaRow:       'flex flex-col sm:flex-row items-center justify-center gap-4',
  heroPrimaryBtn:   'w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-base shadow-xl shadow-blue-900/40 transition-all hover:scale-105',
  heroSecondaryBtn: 'w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-bold rounded-xl text-base transition-colors',
  heroFineprint:    'mt-5 text-slate-500 text-sm',

  // Stats bar
  statsBar:         'border-t border-slate-700/50',
  statsGrid:        'max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4',
  statValue:        'text-2xl font-black text-blue-400',
  statLabel:        'text-xs text-slate-400 mt-0.5 font-medium',

  // Section headers
  sectionLabel:     'text-blue-600 text-sm font-bold uppercase tracking-widest',
  sectionLabelDark: 'text-blue-400 text-sm font-bold uppercase tracking-widest',
  sectionTitle:     'text-3xl sm:text-4xl font-black text-slate-900 mt-2 mb-4',
  sectionTitleDark: 'text-3xl sm:text-4xl font-black text-white mt-2 mb-4',
  sectionSubtitle:  'text-slate-500 max-w-xl mx-auto',
  sectionSubDark:   'text-slate-400 max-w-xl mx-auto',
  sectionHeader:    'text-center mb-14',

  // Features
  featuresSection:  'py-20 bg-slate-50',
  featureCard:      'bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group',
  featureIconBox:   'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
  featureTitle:     'font-bold text-slate-900 text-base mb-2',
  featureDesc:      'text-slate-500 text-sm leading-relaxed',

  // How it works
  howSection:       'py-20 bg-white',
  stepIconWrap:     'relative inline-block mb-6',
  stepIconBox:      'w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-200',
  stepBadge:        'absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white text-xs font-black rounded-full flex items-center justify-center',
  stepTitle:        'font-bold text-slate-900 text-lg mb-2',
  stepDesc:         'text-slate-500 text-sm leading-relaxed max-w-xs mx-auto',

  // Pricing
  pricingSection:   'py-20 bg-slate-900',
  planCardBase:     'relative rounded-2xl p-7 flex flex-col transition-all',
  planCardActive:   'bg-blue-600 ring-4 ring-blue-400/30 scale-105',
  planCardDefault:  'bg-slate-800 border border-slate-700 hover:border-slate-500',
  planBadge:        'absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-xs font-black px-4 py-1 rounded-full shadow',
  planIconActive:   'w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-blue-500',
  planIconDefault:  'w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-slate-700',
  planName:         'font-black text-white text-xl mb-1',
  planPrice:        'text-4xl font-black text-white',
  planPriceSuffix:  'text-sm',
  planPriceSuffixActive:  'text-blue-200',
  planPriceSuffixDefault: 'text-slate-400',
  planFeatureList:  'space-y-3 flex-1 mb-8',
  planFeatureItem:  'flex items-start gap-2.5 text-sm',
  planCheckActive:  'w-4 h-4 shrink-0 mt-0.5 text-blue-200',
  planCheckDefault: 'w-4 h-4 shrink-0 mt-0.5 text-emerald-400',
  planTextActive:   'text-blue-100',
  planTextDefault:  'text-slate-300',
  planBtnActive:    'w-full flex items-center justify-center gap-2 py-3 font-bold text-sm rounded-xl transition-all bg-white text-blue-600 hover:bg-blue-50',
  planBtnDefault:   'w-full flex items-center justify-center gap-2 py-3 font-bold text-sm rounded-xl transition-all bg-blue-600 hover:bg-blue-500 text-white',

  // Why us
  whySection:       'py-20 bg-white',
  whyGrid:          'grid grid-cols-1 lg:grid-cols-2 gap-14 items-center',
  whyItems:         'space-y-5',
  whyItem:          'flex items-start gap-4',
  whyIconBox:       'w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0',
  whyItemTitle:     'font-bold text-slate-900 mb-1',
  whyItemDesc:      'text-slate-500 text-sm leading-relaxed',
  whyStatsGrid:     'grid grid-cols-2 gap-4',
  whyStatCard:      'rounded-2xl p-6 text-white',
  whyStatValue:     'text-3xl font-black mb-1',
  whyStatLabel:     'text-sm font-medium opacity-90',

  // CTA final
  ctaSection:       'py-20 bg-gradient-to-br from-blue-600 to-blue-800',
  ctaInner:         'max-w-3xl mx-auto px-4 sm:px-6 text-center',
  ctaTitle:         'text-3xl sm:text-4xl font-black text-white mb-4',
  ctaSubtitle:      'text-blue-100 text-lg mb-8',
  ctaBtn:           'inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-black rounded-xl text-base hover:bg-blue-50 transition-all shadow-xl hover:scale-105',
  ctaFineprint:     'mt-4 text-blue-200 text-sm',

  // Contact
  contactSection:   'py-16 bg-slate-900',
  contactGrid:      'grid grid-cols-1 md:grid-cols-3 gap-8 text-center',
  contactIconBox:   'w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3',
  contactLabel:     'font-bold text-white text-sm mb-1',
  contactValue:     'text-slate-400 text-sm',
  contactLink:      'text-blue-400 hover:text-blue-300 text-sm transition-colors',

  // Footer
  footer:           'bg-slate-950 border-t border-slate-800 py-8',
  footerInner:      'max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4',
  footerLogoBox:    'w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center',
  footerLogoText:   'font-black text-white text-sm',
  footerCopy:       'text-slate-500 text-xs text-center',
  footerLinks:      'flex items-center gap-4',
  footerLink:       'text-slate-500 hover:text-slate-300 text-xs transition-colors',
  // Icons
  logoStethoscope:  'w-5 h-5 text-white',
  menuIcon:         'w-6 h-6',
  arrowRight5:      'w-5 h-5',
  chevronDown5:     'w-5 h-5',
  featureIcon:      'w-6 h-6',
  stepIcon:         'w-7 h-7 text-white',
  planIcon:         'w-5 h-5 text-white',
  arrowRight4:      'w-4 h-4',
  whyIcon:          'w-5 h-5 text-blue-600',
  footerStethoscope:'w-4 h-4 text-white',
  textCenter:       'text-center',
  gridFeatures:     'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
  gridHow:          'grid grid-cols-1 md:grid-cols-3 gap-8',
  gridContact:      'grid grid-cols-1 md:grid-cols-3 gap-6',
  flexLogoLink:     'flex items-center gap-2.5',
  footerLogoFlex:   'flex items-center gap-2',
  planPriceMb:      'mb-6',
  contactIcon:      'w-5 h-5 text-blue-400',
}

// ── Componente ──────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (href) => {
    setMenuOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={STYLES.page}>

      {/* ── NAVBAR ── */}
      <header className={`${STYLES.header} ${scrolled ? STYLES.headerScrolled : STYLES.headerDefault}`}>
        <div className={STYLES.navInner}>
          {/* Logo */}
          <Link to="/" className={STYLES.flexLogoLink}>
            <div className={STYLES.logoBox}>
              <Stethoscope className={STYLES.logoStethoscope} />
            </div>
            <span className={STYLES.logoText}>SurgicalHUB</span>
          </Link>

          {/* Nav desktop */}
          <nav className={STYLES.navDesktop}>
            {NAV_LINKS.map(link => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className={STYLES.navBtn}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* CTAs desktop */}
          <div className={STYLES.navCtas}>
            <Link to="/acceso" className={STYLES.navLogin}>Iniciar sesión</Link>
            <Link to="/registro" className={STYLES.navRegister}>Comenzar gratis →</Link>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className={STYLES.menuBtn}>
            {menuOpen ? <X className={STYLES.menuIcon} /> : <Menu className={STYLES.menuIcon} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className={STYLES.mobileMenu}>
            {NAV_LINKS.map(link => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className={STYLES.mobileNavBtn}
              >
                {link.label}
              </button>
            ))}
            <div className={STYLES.mobileCtas}>
              <Link to="/acceso" className={STYLES.mobileLogin}>Iniciar sesión</Link>
              <Link to="/registro" className={STYLES.mobileRegister}>Comenzar gratis →</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="hero" className={STYLES.heroSection}>
        <div className={STYLES.heroInner}>
          <span className={STYLES.heroBadge}>
            ✦ Software quirúrgico N°1 para clínicas privadas
          </span>
          <h1 className={STYLES.heroTitle}>
            Gestión Quirúrgica{' '}
            <span className={STYLES.heroHighlight}>Simple y Digital</span>
            <br />para tu Clínica
          </h1>
          <p className={STYLES.heroSubtitle}>
            Centraliza pabellones, médicos, insumos y solicitudes quirúrgicas en una sola plataforma.
            Sin papeles, sin llamadas, sin errores.
          </p>
          <div className={STYLES.heroCtaRow}>
            <Link to="/registro" className={STYLES.heroPrimaryBtn}>
              Comenzar 14 días gratis
              <ArrowRight className={STYLES.arrowRight5} />
            </Link>
            <button onClick={() => scrollTo('#caracteristicas')} className={STYLES.heroSecondaryBtn}>
              Ver características
              <ChevronDown className={STYLES.chevronDown5} />
            </button>
          </div>
          <p className={STYLES.heroFineprint}>Sin tarjeta de crédito · Configuración en 5 minutos · Cancela cuando quieras</p>
        </div>

        {/* Stats bar */}
        <div className={STYLES.statsBar}>
          <div className={STYLES.statsGrid}>
            {STATS.map(s => (
              <div key={s.label} className={STYLES.textCenter}>
                <p className={STYLES.statValue}>{s.value}</p>
                <p className={STYLES.statLabel}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARACTERÍSTICAS ── */}
      <section id="caracteristicas" className={STYLES.featuresSection}>
        <div className={STYLES.container}>
          <div className={STYLES.sectionHeader}>
            <span className={STYLES.sectionLabel}>Características</span>
            <h2 className={STYLES.sectionTitle}>Todo lo que tu clínica necesita</h2>
            <p className={STYLES.sectionSubtitle}>
              Diseñado específicamente para clínicas quirúrgicas privadas. Sin funciones innecesarias, solo lo que realmente usas.
            </p>
          </div>

          <div className={STYLES.gridFeatures}>
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className={STYLES.featureCard}>
                  <div className={`${STYLES.featureIconBox} ${f.color}`}>
                    <Icon className={STYLES.featureIcon} />
                  </div>
                  <h3 className={STYLES.featureTitle}>{f.title}</h3>
                  <p className={STYLES.featureDesc}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className={STYLES.howSection}>
        <div className={STYLES.container}>
          <div className={STYLES.sectionHeader}>
            <span className={STYLES.sectionLabel}>Proceso</span>
            <h2 className={STYLES.sectionTitle}>Listo en 3 pasos simples</h2>
          </div>
          <div className={STYLES.gridHow}>
            {HOW_IT_WORKS.map(s => {
              const Icon = s.icon
              return (
                <div key={s.step} className={STYLES.textCenter}>
                  <div className={STYLES.stepIconWrap}>
                    <div className={STYLES.stepIconBox}>
                      <Icon className={STYLES.stepIcon} />
                    </div>
                    <span className={STYLES.stepBadge}>{s.step.slice(1)}</span>
                  </div>
                  <h3 className={STYLES.stepTitle}>{s.title}</h3>
                  <p className={STYLES.stepDesc}>{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" className={STYLES.pricingSection}>
        <div className={STYLES.container}>
          <div className={STYLES.sectionHeader}>
            <span className={STYLES.sectionLabelDark}>Precios</span>
            <h2 className={STYLES.sectionTitleDark}>Planes para cada clínica</h2>
            <p className={STYLES.sectionSubDark}>
              Empieza con 14 días gratis. Sin tarjeta de crédito. Cambia o cancela cuando quieras.
            </p>
          </div>

          <div className={STYLES.gridContact}>
            {PLANES.map(plan => {
              const Icon = plan.icon
              return (
                <div
                  key={plan.nombre}
                  className={`${STYLES.planCardBase} ${plan.destacado ? STYLES.planCardActive : STYLES.planCardDefault}`}
                >
                  {plan.badge && (
                    <span className={STYLES.planBadge}>{plan.badge}</span>
                  )}

                  <div className={plan.destacado ? STYLES.planIconActive : STYLES.planIconDefault}>
                    <Icon className={STYLES.planIcon} />
                  </div>

                  <h3 className={STYLES.planName}>{plan.nombre}</h3>
                  <div className={STYLES.planPriceMb}>
                    <span className={STYLES.planPrice}>${plan.precio}</span>
                    <span className={`${STYLES.planPriceSuffix} ${plan.destacado ? STYLES.planPriceSuffixActive : STYLES.planPriceSuffixDefault}`}> USD/mes</span>
                  </div>

                  <ul className={STYLES.planFeatureList}>
                    {plan.features.map(f => (
                      <li key={f} className={STYLES.planFeatureItem}>
                        <Check className={plan.destacado ? STYLES.planCheckActive : STYLES.planCheckDefault} />
                        <span className={plan.destacado ? STYLES.planTextActive : STYLES.planTextDefault}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/registro"
                    className={plan.destacado ? STYLES.planBtnActive : STYLES.planBtnDefault}
                  >
                    Comenzar gratis
                    <ArrowRight className={STYLES.arrowRight4} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── POR QUÉ ELEGIRNOS ── */}
      <section className={STYLES.whySection}>
        <div className={STYLES.container}>
          <div className={STYLES.whyGrid}>
            <div>
              <span className={STYLES.sectionLabel}>¿Por qué SurgicalHUB?</span>
              <h2 className={`${STYLES.sectionTitle} mb-6`}>
                Diseñado para clínicas privadas en Chile
              </h2>
              <div className={STYLES.whyItems}>
                {WHY_US.map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className={STYLES.whyItem}>
                      <div className={STYLES.whyIconBox}>
                        <Icon className={STYLES.whyIcon} />
                      </div>
                      <div>
                        <h4 className={STYLES.whyItemTitle}>{item.title}</h4>
                        <p className={STYLES.whyItemDesc}>{item.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={STYLES.whyStatsGrid}>
              {WHY_US_STATS.map(item => (
                <div key={item.label} className={`${STYLES.whyStatCard} ${item.color}`}>
                  <p className={STYLES.whyStatValue}>{item.value}</p>
                  <p className={STYLES.whyStatLabel}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className={STYLES.ctaSection}>
        <div className={STYLES.ctaInner}>
          <h2 className={STYLES.ctaTitle}>¿Listo para modernizar tu clínica?</h2>
          <p className={STYLES.ctaSubtitle}>
            Únete a las clínicas que ya gestionan sus pabellones con SurgicalHUB. Comienza hoy sin compromisos.
          </p>
          <Link to="/registro" className={STYLES.ctaBtn}>
            Comenzar 14 días gratis
            <ArrowRight className={STYLES.arrowRight5} />
          </Link>
          <p className={STYLES.ctaFineprint}>Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>
      </section>

      {/* ── CONTACTO ── */}
      <section id="contacto" className={STYLES.contactSection}>
        <div className={STYLES.container}>
          <div className={STYLES.contactGrid}>
            {CONTACT_ITEMS.map(item => {
              const Icon = item.icon
              return (
                <div key={item.label}>
                  <div className={STYLES.contactIconBox}>
                    <Icon className={STYLES.contactIcon} />
                  </div>
                  <p className={STYLES.contactLabel}>{item.label}</p>
                  {item.link ? (
                    <Link to={item.link} className={STYLES.contactLink}>{item.value}</Link>
                  ) : (
                    <p className={STYLES.contactValue}>{item.value}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={STYLES.footer}>
        <div className={STYLES.footerInner}>
          <div className={STYLES.footerLogoFlex}>
            <div className={STYLES.footerLogoBox}>
              <Stethoscope className={STYLES.footerStethoscope} />
            </div>
            <span className={STYLES.footerLogoText}>SurgicalHUB</span>
          </div>
          <p className={STYLES.footerCopy}>
            © {new Date().getFullYear()} SurgicalHUB — Software de gestión quirúrgica para clínicas privadas en Chile
          </p>
          <div className={STYLES.footerLinks}>
            <Link to="/acceso" className={STYLES.footerLink}>Iniciar sesión</Link>
            <Link to="/registro" className={STYLES.footerLink}>Registro</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
