import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return json({ error: 'Stripe no configurado. Agrega STRIPE_SECRET_KEY en Edge Function Secrets.' }, 500)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autorizado' }, 401)

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) return json({ error: 'Token inválido' }, 401)

    const { plan_id } = await req.json()
    if (!plan_id) return json({ error: 'plan_id requerido' }, 400)

    // Obtener info del plan desde DB
    const { data: plan } = await supabaseAdmin
      .from('planes')
      .select('nombre, stripe_price_id, precio_mensual_usd')
      .eq('id', plan_id)
      .single()

    if (!plan) return json({ error: 'Plan no encontrado' }, 404)

    if (!plan.stripe_price_id) {
      return json({
        error: 'El plan no tiene un stripe_price_id configurado. Agrega el Price ID de Stripe en la tabla planes.',
      }, 500)
    }

    // Obtener o crear Stripe Customer
    const { data: clinica } = await supabaseAdmin
      .from('clinicas')
      .select('id, nombre, stripe_customer_id')
      .eq('id', (await supabaseAdmin.from('users').select('clinica_id').eq('id', user.id).single()).data?.clinica_id)
      .single()

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    let customerId = clinica?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: clinica?.nombre,
        metadata: { clinica_id: clinica?.id ?? '', supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabaseAdmin
        .from('clinicas')
        .update({ stripe_customer_id: customerId })
        .eq('id', clinica?.id)
    }

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: `${siteUrl}/pabellon/facturacion?checkout=success`,
      cancel_url: `${siteUrl}/pabellon/facturacion?checkout=cancelled`,
      metadata: {
        clinica_id: clinica?.id ?? '',
        plan_id,
      },
    })

    return json({ url: session.url })
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Error desconocido')
    console.error('stripe-checkout error:', e.message)
    return json({ error: e.message }, 500)
  }
})
