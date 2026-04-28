import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'
import { logger } from '@/utils/logger'

// Se asigna solo cuando el DSN está configurado y el import dinámico resuelve.
let _sentryCapture = null
if (import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then(S => { _sentryCapture = S.captureException })
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:        'min-h-screen flex items-center justify-center bg-slate-50 p-4',
  card:        'bg-white rounded-2xl shadow-xl border border-red-200 p-8 max-w-md w-full',
  header:      'flex items-center gap-4 mb-6',
  iconWrap:    'bg-red-100 p-3 rounded-full',
  icon:        'w-8 h-8 text-red-600',
  title:       'text-xl font-black text-slate-900',
  subtitle:    'text-sm text-slate-500 mt-1',
  devError:    'mb-6 p-4 bg-slate-100 rounded-lg',
  errorText:   'text-xs font-mono text-red-600 break-words',
  eventId:     'text-xs text-slate-400 mb-4',
  actions:     'flex gap-3',
  reloadBtn:   'flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase transition-all',
  homeBtn:     'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm uppercase transition-all',
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, eventId: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    logger.errorWithContext('ErrorBoundary capturó un error', error, {
      componentStack: errorInfo.componentStack,
    })

    this.setState({ error, errorInfo })

    if (_sentryCapture) {
      const eventId = _sentryCapture(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } },
      })
      this.setState({ eventId })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, eventId: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={STYLES.page}>
          <div className={STYLES.card}>
            <div className={STYLES.header}>
              <div className={STYLES.iconWrap}>
                <AlertTriangle className={STYLES.icon} />
              </div>
              <div>
                <h2 className={STYLES.title}>Algo salió mal</h2>
                <p className={STYLES.subtitle}>Se produjo un error inesperado</p>
              </div>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className={STYLES.devError}>
                <p className={STYLES.errorText}>
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {this.state.eventId && (
              <p className={STYLES.eventId}>
                ID de error: {this.state.eventId}
              </p>
            )}

            <div className={STYLES.actions}>
              <button
                onClick={this.handleReset}
                className={STYLES.reloadBtn}
              >
                Recargar página
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className={STYLES.homeBtn}
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
