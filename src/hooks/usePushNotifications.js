import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'
import { getMyClinicaId } from '@/utils/getClinicaId'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

/**
 * Gestiona la suscripción Web Push del usuario actual.
 * Requiere VITE_VAPID_PUBLIC_KEY en el .env.
 *
 * @param {string|null} userId - ID del usuario autenticado
 * @returns {{ isSupported, isSubscribed, isLoading, subscribe, unsubscribe }}
 */
export function usePushNotifications(userId) {
  const [isSupported,  setIsSupported]  = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading,    setIsLoading]    = useState(false)

  // Verificar soporte del navegador
  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager'   in window &&
      'Notification'  in window &&
      !!VAPID_PUBLIC_KEY

    setIsSupported(supported)
  }, [])

  // Verificar si ya hay suscripción activa al montar
  useEffect(() => {
    if (!isSupported || !userId) return

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch((err) => logger.errorWithContext('usePushNotifications.check', err))
  }, [isSupported, userId])

  const subscribe = useCallback(async () => {
    if (!isSupported || !userId || isSubscribed) return
    setIsLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const { endpoint, keys } = subscription.toJSON()
      const clinicaId = await getMyClinicaId()

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id:    userId,
            clinica_id: clinicaId,
            endpoint,
            p256dh:     keys.p256dh,
            auth:       keys.auth,
            user_agent: navigator.userAgent.substring(0, 200),
          },
          { onConflict: 'user_id,endpoint' }
        )

      if (error) {
        logger.errorWithContext('usePushNotifications.subscribe', error)
      } else {
        setIsSubscribed(true)
      }
    } catch (err) {
      logger.errorWithContext('usePushNotifications.subscribe', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, userId, isSubscribed])

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !userId) return
    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        const { endpoint } = subscription.toJSON()
        await subscription.unsubscribe()
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', endpoint)
      }
      setIsSubscribed(false)
    } catch (err) {
      logger.errorWithContext('usePushNotifications.unsubscribe', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, userId])

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe }
}
