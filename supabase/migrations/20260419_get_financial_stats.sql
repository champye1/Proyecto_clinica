-- ============================================================
-- get_financial_stats: Métricas financieras completas SaaS
-- Inspirado en Baremetrics / ChartMogul / ProfitWell
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

DROP FUNCTION IF EXISTS get_financial_stats();

CREATE OR REPLACE FUNCTION get_financial_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mrr_total           NUMERIC := 0;
  v_clinicas_pagando    BIGINT  := 0;
  v_clinicas_trial      BIGINT  := 0;
  v_clinicas_expiradas  BIGINT  := 0;
  v_clinicas_suspendidas BIGINT := 0;
  v_nuevas_este_mes     BIGINT  := 0;
  v_nuevas_mes_anterior BIGINT  := 0;
  v_arpu                NUMERIC := 0;
  v_churn_rate          NUMERIC := 0;
  v_ltv                 NUMERIC := 0;
  v_tasa_conversion     NUMERIC := 0;
BEGIN
  -- ── Seguridad: solo super_admin ───────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin' AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  -- ── Conteos base ──────────────────────────────────────────
  SELECT COUNT(*) INTO v_clinicas_pagando    FROM clinicas WHERE estado = 'activo';
  SELECT COUNT(*) INTO v_clinicas_trial      FROM clinicas WHERE estado = 'trial' AND trial_hasta >= NOW();
  SELECT COUNT(*) INTO v_clinicas_expiradas  FROM clinicas WHERE (estado = 'trial' AND trial_hasta < NOW()) OR estado = 'expirado';
  SELECT COUNT(*) INTO v_clinicas_suspendidas FROM clinicas WHERE estado = 'suspendida';

  -- ── MRR total ─────────────────────────────────────────────
  SELECT COALESCE(SUM(p.precio_mensual_usd), 0) INTO v_mrr_total
  FROM clinicas c
  JOIN planes p ON p.id = c.plan_id
  WHERE c.estado = 'activo';

  -- ── ARPU ──────────────────────────────────────────────────
  IF v_clinicas_pagando > 0 THEN
    v_arpu := ROUND(v_mrr_total / v_clinicas_pagando, 2);
  END IF;

  -- ── Churn Rate (%) ────────────────────────────────────────
  -- Clínicas perdidas / (activas + perdidas)
  IF (v_clinicas_pagando + v_clinicas_expiradas) > 0 THEN
    v_churn_rate := ROUND(
      v_clinicas_expiradas::NUMERIC / (v_clinicas_pagando + v_clinicas_expiradas) * 100, 1
    );
  END IF;

  -- ── LTV = ARPU / (churn_rate / 100) ──────────────────────
  IF v_churn_rate > 0 THEN
    v_ltv := ROUND(v_arpu / (v_churn_rate / 100), 0);
  END IF;

  -- ── Tasa de conversión Trial → Activo ────────────────────
  IF (v_clinicas_pagando + v_clinicas_expiradas) > 0 THEN
    v_tasa_conversion := ROUND(
      v_clinicas_pagando::NUMERIC / (v_clinicas_pagando + v_clinicas_expiradas) * 100, 1
    );
  END IF;

  -- ── Nuevas clínicas este mes / mes anterior ───────────────
  SELECT COUNT(*) INTO v_nuevas_este_mes
  FROM clinicas
  WHERE date_trunc('month', created_at) = date_trunc('month', NOW());

  SELECT COUNT(*) INTO v_nuevas_mes_anterior
  FROM clinicas
  WHERE date_trunc('month', created_at) = date_trunc('month', NOW() - INTERVAL '1 month');

  -- ── Resultado final ───────────────────────────────────────
  RETURN jsonb_build_object(

    -- KPIs principales
    'mrr_total',              v_mrr_total,
    'arr_total',              v_mrr_total * 12,
    'tasa_conversion',        v_tasa_conversion,
    'nuevas_este_mes',        v_nuevas_este_mes,
    'nuevas_mes_anterior',    v_nuevas_mes_anterior,
    'clinicas_pagando',       v_clinicas_pagando,
    'clinicas_trial',         v_clinicas_trial,
    'clinicas_expiradas',     v_clinicas_expiradas,
    'clinicas_suspendidas',   v_clinicas_suspendidas,

    -- KPIs avanzados (Baremetrics-style)
    'arpu',                   v_arpu,
    'churn_rate',             v_churn_rate,
    'ltv_estimado',           v_ltv,

    -- Breakdown por plan
    'por_plan', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'nombre',             p.nombre,
          'precio_mensual_usd', p.precio_mensual_usd,
          'clinicas',           COUNT(c.id),
          'mrr_aporte',         COUNT(c.id) * p.precio_mensual_usd
        ) ORDER BY COUNT(c.id) DESC
      ), '[]'::jsonb)
      FROM planes p
      LEFT JOIN clinicas c ON c.plan_id = p.id AND c.estado = 'activo'
      GROUP BY p.id, p.nombre, p.precio_mensual_usd
    ),

    -- MRR histórico acumulado (últimos 12 meses) — ChartMogul-style
    'mrr_historico', (
      WITH monthly_new AS (
        SELECT
          date_trunc('month', c.created_at) AS mes,
          COALESCE(SUM(p.precio_mensual_usd), 0) AS mrr_nuevo
        FROM clinicas c
        JOIN planes p ON p.id = c.plan_id
        WHERE c.estado = 'activo'
        GROUP BY 1
      ),
      months AS (
        SELECT generate_series(
          date_trunc('month', NOW() - INTERVAL '11 months'),
          date_trunc('month', NOW()),
          '1 month'::INTERVAL
        ) AS mes
      )
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'mes', to_char(m.mes, 'Mon YY'),
          'mrr', COALESCE(
            SUM(COALESCE(mn.mrr_nuevo, 0)) OVER (ORDER BY m.mes ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW),
            0
          )
        ) ORDER BY m.mes
      ), '[]'::jsonb)
      FROM months m
      LEFT JOIN monthly_new mn ON mn.mes = m.mes
    ),

    -- Trials próximos a vencer (14 días) — accionable para el admin
    'trials_por_vencer', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id',              c.id,
          'nombre',          c.nombre,
          'ciudad',          COALESCE(c.ciudad, '—'),
          'trial_hasta',     c.trial_hasta,
          'dias_restantes',  GREATEST(0, EXTRACT(DAY FROM c.trial_hasta - NOW())::INT)
        ) ORDER BY c.trial_hasta ASC
      ), '[]'::jsonb)
      FROM clinicas c
      WHERE c.estado = 'trial'
        AND c.trial_hasta BETWEEN NOW() AND NOW() + INTERVAL '14 days'
    ),

    -- Distribución de estados (para funnel visual)
    'funnel', (
      SELECT jsonb_build_object(
        'trial',     COUNT(*) FILTER (WHERE estado = 'trial' AND trial_hasta >= NOW()),
        'activo',    COUNT(*) FILTER (WHERE estado = 'activo'),
        'expirado',  COUNT(*) FILTER (WHERE (estado = 'trial' AND trial_hasta < NOW()) OR estado = 'expirado'),
        'suspendido',COUNT(*) FILTER (WHERE estado = 'suspendida')
      )
      FROM clinicas
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_financial_stats() TO authenticated;
