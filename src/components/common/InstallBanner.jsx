import { Download, X, Share } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

/**
 * Banner flotante que invita al usuario a instalar la PWA.
 * - Android/Chrome: muestra botón "Instalar" que dispara el prompt nativo
 * - iOS/Safari: muestra instrucciones para "Añadir a inicio"
 * - Si ya está instalada o el usuario la descartó: no aparece
 */
export default function InstallBanner() {
  const { isInstallable, isIOS, promptInstall, dismissInstall } = useInstallPrompt()

  if (!isInstallable) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-white border border-blue-100 rounded-2xl shadow-xl p-4 flex items-start gap-3">
        {/* Ícono app */}
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 48 48" className="w-7 h-7">
            <rect x="19" y="8" width="10" height="32" rx="2" fill="white"/>
            <rect x="8" y="19" width="32" height="10" rx="2" fill="white"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Instalar SurgicalHUB</p>

          {isIOS ? (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Toca <Share className="inline w-3 h-3 text-blue-500" /> y luego{' '}
              <strong>"Añadir a pantalla de inicio"</strong>
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">
              Accede rápido desde tu pantalla de inicio
            </p>
          )}

          {!isIOS && (
            <button
              onClick={promptInstall}
              className="mt-2 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar
            </button>
          )}
        </div>

        {/* Cerrar */}
        <button
          onClick={dismissInstall}
          className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 -mt-0.5"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
