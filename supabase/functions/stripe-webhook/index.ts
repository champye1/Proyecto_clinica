import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

serve(async (req) => {
  // Stripe envía POST con la firma en el header
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const stripeKey     = Deno.env.get('STRIPE_SECRET_KEY')

  if (!webhookSecret || !stripeKey) {
    console.error('stripe-webhook: faltan secrets STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET')
    return new Response('Stripe no configurado', { status: 500 })
  }

  const stripe    = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Sin firma Stripe', { status: 400 })
  }

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Firma inválida'
    console.error('stripe-webhook firma inválida:', msg)
    return new Response(`Webhook Error: ${msg}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  try {
    switch (event.type) {

      // ── Pago completado → activar suscripción ───────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const clinicaId = session.metadata?.clinica_id
        const planId    = session.metadata?.plan_id

        if (!clinicaId || !planId) {
          console.error('stripe-webhook: checkout.session.completed sin metadata clinica_id/plan_id', session.id)
          break
        }

        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null

        const { error } = await supabase
          .from('clinicas')
          .update({
            estado:                 'activo',
            plan_id:                planId,
            stripe_subscription_id: subscriptionId,
            updated_at:             new Date().toISOString(),
          })
          .eq('id', clinicaId)

        if (error) {
          console.error('stripe-webhook: error activando clínica', clinicaId, error.message)
        } else {
          console.log('stripe-webhook: clínica activada', clinicaId, 'plan', planId)
        }
        break
      }

      // ── Suscripción cancelada → marcar como expirada ────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        const { error } = await supabase
          .from('clinicas')
          .update({
            estado:     'expirado',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId)

        if (error) {
          console.error('stripe-webhook: error expirando clínica por sub', subscriptionId, error.message)
        } else {
          console.log('stripe-webhook: clínica expirada por cancelación de sub', subscriptionId)
        }
        break
      }

      // ── Pago fallido → notificar sin suspender de inmediato ─────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

        if (customerId) {
          const { data: clinica } = await supabase
            .from('clinicas')
            .select('id, nombre')
            .eq('stripe_customer_id', customerId)
            .single()

          if (clinica) {
            console.warn('stripe-webhook: pago fallido para clínica', clinica.id, clinica.nombre)
            // Aquí podrías insertar una notificación o enviar un email de alerta
          }
        }
        break
      }

      default:
        // Evento no manejado — ok, Stripe espera 200 de todas formas
        break
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('stripe-webhook: error procesando evento', event.type, msg)
    return new Response('Error interno', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
