import { useState, useEffect } from 'react'

/**
 * Detecta el evento de instalación PWA y permite mostrarlo al usuario.
 * Compatible con Chrome/Edge en Android y desktop.
 * En iOS no hay evento nativo — se muestra instrucción manual.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detectar si ya está instalada como PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Detectar iOS (Safari no tiene beforeinstallprompt)
    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(iOS)

    // Si es iOS y no está instalada, es instalable (instrucción manual)
    if (iOS) {
      // Solo mostrar si no fue descartada antes
      const dismissed = sessionStorage.getItem('pwa-install-dismissed')
      if (!dismissed) setIsInstallable(true)
      return
    }

    // Android / Chrome / Edge: escuchar el evento nativo
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = sessionStorage.getItem('pwa-install-dismissed')
      if (!dismissed) setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detectar si se instaló
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
    return outcome === 'accepted'
  }

  const dismissInstall = () => {
    sessionStorage.setItem('pwa-install-dismissed', '1')
    setIsInstallable(false)
  }

  return { isInstallable, isInstalled, isIOS, promptInstall, dismissInstall }
}
