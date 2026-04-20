import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Stethoscope, Building2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { testSupabaseConnection } from '@/utils/testSupabase'

// ─── Datos ────────────────────────────────────────────────────────────────────
const PABELLON_FEATURES = [
  'Gestión de solicitudes',
  'Programación de cirugías',
  'Administración de médicos',
  'Control de insumos',
]

const DOCTOR_FEATURES = [
  'Crear fichas de pacientes',
  'Solicitar cirugías',
  'Ver calendario personal',
  'Consultar estado de solicitudes',
]

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:         'min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 animate-in fade-in duration-500',
  card:         'bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] border-2 border-slate-100 shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 active:scale-[0.98] group touch-manipulation',
  cardBlue:     'hover:border-blue-400',
  cardGreen:    'hover:border-green-400',
  alertBox:     'rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-5 mb-4 sm:mb-6 flex items-start gap-3 shadow-sm animate-in fade-in duration-300',
  warningBox:   'bg-amber-50 border-2 border-amber-200 text-amber-800',
  errorBox:     'bg-yellow-50 border-yellow-200 border-2',
  successBox:   'bg-green-50 border-green-200 border-2',
  loadingBox:   'bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm mb-4 sm:mb-6',
  alertTitle:   'font-black text-xs sm:text-sm uppercase tracking-tighter mb-1',
  alertText:    'text-[10px] sm:text-xs font-bold',
  iconBoxBlue:  'bg-blue-100 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center group-hover:bg-blue-200 transition-colors shadow-lg shadow-blue-100',
  iconBoxGreen: 'bg-green-100 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center group-hover:bg-green-200 transition-colors shadow-lg shadow-green-100',
  cardTitle:    'text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 sm:mb-3',
  cardDesc:     'text-slate-600 mb-6 sm:mb-8 font-bold text-xs sm:text-sm px-2',
  featureList:  'space-y-2 sm:space-y-3 text-[10px] sm:text-xs text-slate-500 mb-6 sm:mb-8 font-bold',
  btnBlue:      'w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-200 transition-all active:scale-95 touch-manipulation',
  btnGreen:     'w-full bg-green-600 hover:bg-green-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-xl shadow-green-200 transition-all active:scale-95 touch-manipulation',
  container:    'max-w-4xl w-full mx-auto',
  headerSection:'text-center mb-8 sm:mb-12',
  backLink:     'inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 text-xs font-bold uppercase tracking-widest mb-6 transition-colors',
  logoWrap:     'flex justify-center mb-4 sm:mb-6',
  logoBox:      'bg-blue-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl shadow-blue-200 rotate-6',
  logoIcon:     'text-white w-6 h-6 sm:w-8 sm:h-8',
  heading:      'text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2 px-4',
  subheading:   'text-lg sm:text-xl text-slate-600 font-bold px-4',
  accessLabel:  'text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mt-2 px-4',
  alertIcon:    'w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5',
  loadingRow:   'flex items-center justify-center gap-2 sm:gap-3 text-slate-600',
  spinner:      'animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-600',
  loadingText:  'text-[10px] sm:text-xs font-black uppercase tracking-widest',
  alertIconYellow:'w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-0.5',
  alertContent: 'flex-1 min-w-0',
  alertTitleConfig:'font-black text-yellow-800 text-xs sm:text-sm uppercase tracking-tighter mb-2',
  alertTextConfig: 'text-[10px] sm:text-xs text-yellow-700 mb-3 sm:mb-4 font-bold break-words',
  configSteps:  'text-[9px] sm:text-[10px] text-yellow-600 space-y-2 font-bold uppercase tracking-wider',
  configStepsTitle:'font-black',
  configList:   'list-decimal list-inside space-y-1 ml-2',
  successIcon:  'w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0',
  alertContentSm:'min-w-0',
  successTitle: 'font-black text-green-800 text-xs sm:text-sm uppercase tracking-tighter',
  successText:  'text-[10px] sm:text-xs text-green-700 font-bold mt-1',
  cardsGrid:    'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8',
  cardCenter:   'text-center',
  cardIconBlue: 'w-10 h-10 sm:w-12 sm:h-12 text-blue-600',
  cardIconGreen:'w-10 h-10 sm:w-12 sm:h-12 text-green-600',
  featureItem:  'flex items-center justify-center gap-2',
  featureCheck: 'text-green-500',
  pageFooter:   'mt-8 text-center',
  pageFooterText:'text-sm text-slate-500',
  registerLink: 'text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors',
  linkUnderline:'underline',
  codeHighlight:'bg-yellow-100 px-1 rounded',
}

export default function Inicio() {
  const navigate = useNavigate()
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [checking, setChecking] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('session_expired') === '1') {
      sessionStorage.removeItem('session_expired')
      setSessionExpired(true)
    }
  }, [])

  useEffect(() => {
    testSupabaseConnection().then(result => {
      setConnectionStatus(result)
      setChecking(false)
    })
  }, [])

  return (
    <div className={STYLES.page}>
      <div className={STYLES.container}>
        <div className={STYLES.headerSection}>
          <Link to="/" className={STYLES.backLink}>
            ← Volver al inicio
          </Link>
          <div className={STYLES.logoWrap}>
            <div className={STYLES.logoBox}>
              <Stethoscope className={STYLES.logoIcon} />
            </div>
          </div>
          <h1 className={STYLES.heading}>
            SurgicalHUB
          </h1>
          <p className={STYLES.subheading}>
            Gestión quirúrgica para clínicas modernas
          </p>
          <p className={STYLES.accessLabel}>
            Selecciona tu tipo de acceso
          </p>
        </div>

        {sessionExpired && (
          <div className={`${STYLES.alertBox} ${STYLES.warningBox}`}>
            <AlertCircle className={STYLES.alertIcon} />
            <div>
              <h3 className={STYLES.alertTitle}>Sesión expirada</h3>
              <p className={STYLES.alertText}>
                Tu sesión anterior ya no es válida. Ingresa de nuevo con tu usuario y contraseña.
              </p>
            </div>
          </div>
        )}

        {checking ? (
          <div className={STYLES.loadingBox}>
            <div className={STYLES.loadingRow}>
              <div className={STYLES.spinner} />
              <span className={STYLES.loadingText}>
                Verificando conexión...
              </span>
            </div>
          </div>
        ) : connectionStatus && !connectionStatus.connected ? (
          <div className={`${STYLES.alertBox} ${STYLES.errorBox}`}>
            <AlertCircle className={STYLES.alertIconYellow} />
            <div className={STYLES.alertContent}>
              <h3 className={STYLES.alertTitleConfig}>
                ⚠️ Supabase no configurado
              </h3>
              <p className={STYLES.alertTextConfig}>
                {connectionStatus.error}
              </p>
              <div className={STYLES.configSteps}>
                <p className={STYLES.configStepsTitle}>Para conectar:</p>
                <ol className={STYLES.configList}>
                  <li>Crea un proyecto en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className={STYLES.linkUnderline}>supabase.com</a></li>
                  <li>Ve a Settings → API</li>
                  <li>Copia tu Project URL y anon key</li>
                  <li>Edita el archivo <code className={STYLES.codeHighlight}>.env</code></li>
                  <li>Reemplaza los valores de ejemplo</li>
                  <li>Reinicia el servidor</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${STYLES.alertBox} ${STYLES.successBox}`}>
            <CheckCircle2 className={STYLES.successIcon} />
            <div className={STYLES.alertContentSm}>
              <h3 className={STYLES.successTitle}>
                ✅ Conectado a Supabase
              </h3>
              <p className={STYLES.successText}>
                La conexión con la base de datos está activa
              </p>
            </div>
          </div>
        )}

        <div className={STYLES.cardsGrid}>
          <div
            onClick={() => navigate('/login/pabellon')}
            className={`${STYLES.card} ${STYLES.cardBlue}`}
          >
            <div className={STYLES.cardCenter}>
              <div className={STYLES.iconBoxBlue}>
                <Building2 className={STYLES.cardIconBlue} />
              </div>
              <h2 className={STYLES.cardTitle}>Acceso Pabellón</h2>
              <p className={STYLES.cardDesc}>
                Panel administrativo para gestión de cirugías, médicos e insumos
              </p>
              <ul className={STYLES.featureList}>
                {PABELLON_FEATURES.map(f => (
                  <li key={f} className={STYLES.featureItem}>
                    <span className={STYLES.featureCheck}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className={STYLES.btnBlue}>Ingresar como Pabellón</button>
            </div>
          </div>

          <div
            onClick={() => navigate('/login/doctor')}
            className={`${STYLES.card} ${STYLES.cardGreen}`}
          >
            <div className={STYLES.cardCenter}>
              <div className={STYLES.iconBoxGreen}>
                <Stethoscope className={STYLES.cardIconGreen} />
              </div>
              <h2 className={STYLES.cardTitle}>Acceso Doctor</h2>
              <p className={STYLES.cardDesc}>
                Panel médico para gestión de pacientes y solicitudes quirúrgicas
              </p>
              <ul className={STYLES.featureList}>
                {DOCTOR_FEATURES.map(f => (
                  <li key={f} className={STYLES.featureItem}>
                    <span className={STYLES.featureCheck}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className={STYLES.btnGreen}>Ingresar como Doctor</button>
            </div>
          </div>
        </div>

        <div className={STYLES.pageFooter}>
          <p className={STYLES.pageFooterText}>
            ¿Tu clínica aún no tiene cuenta?{' '}
            <Link
              to="/registro"
              className={STYLES.registerLink}
            >
              Crear cuenta gratis →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
