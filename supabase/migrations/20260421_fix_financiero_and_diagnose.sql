-- ============================================================
-- PASO 1: DIAGNÓSTICO — ejecuta esto primero para ver el estado
-- ============================================================

SELECT
  (SELECT COUNT(*) FROM public.users WHERE role = 'super_admin' AND deleted_at IS NULL)
    AS super_admins_en_db,
  (SELECT id FROM public.users WHERE role = 'super_admin' AND deleted_at IS NULL LIMIT 1)
    AS super_admin_uuid,
  EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'get_financial_stats' AND n.nspname = 'public')
    AS get_financial_stats_existe,
  EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'get_all_clinicas' AND n.nspname = 'public')
    AS get_all_clinicas_existe,
  EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'is_super_admin' AND n.nspname = 'public')
    AS is_super_admin_existe,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'planes' AND table_schema = 'public')
    AS tabla_planes_existe,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'planes' AND column_name = 'precio_mensual_usd' AND table_schema = 'public')
    AS planes_tiene_precio;


-- ============================================================
-- PASO 2: RECREAR get_financial_stats (con DROP explícito)
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
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  v_clinicas_pagando    := (SELECT COUNT(*) FROM clinicas WHERE estado = 'activo');
  v_clinicas_trial      := (SELECT COUNT(*) FROM clinicas WHERE estado = 'trial' AND trial_hasta >= NOW());
  v_clinicas_expiradas  := (SELECT COUNT(*) FROM clinicas WHERE (estado = 'trial' AND trial_hasta < NOW()) OR estado = 'expirado');
  v_clinicas_suspendidas := (SELECT COUNT(*) FROM clinicas WHERE estado = 'suspendida');
  v_mrr_total           := COALESCE((SELECT SUM(p.precio_mensual_usd) FROM clinicas c JOIN planes p ON p.id = c.plan_id WHERE c.estado = 'activo'), 0);
  v_nuevas_este_mes     := (SELECT COUNT(*) FROM clinicas WHERE date_trunc('month', created_at) = date_trunc('month', NOW()));
  v_nuevas_mes_anterior := (SELECT COUNT(*) FROM clinicas WHERE date_trunc('month', created_at) = date_trunc('month', NOW() - INTERVAL '1 month'));

  IF v_clinicas_pagando > 0 THEN
    v_arpu := ROUND(v_mrr_total / v_clinicas_pagando, 2);
  END IF;

  IF (v_clinicas_pagando + v_clinicas_expiradas) > 0 THEN
    v_churn_rate := ROUND(
      v_clinicas_expiradas::NUMERIC / (v_clinicas_pagando + v_clinicas_expiradas) * 100, 1
    );
  END IF;

  IF v_churn_rate > 0 THEN
    v_ltv := ROUND(v_arpu / (v_churn_rate / 100), 0);
  END IF;

  IF (v_clinicas_pagando + v_clinicas_expiradas) > 0 THEN
    v_tasa_conversion := ROUND(
      v_clinicas_pagando::NUMERIC / (v_clinicas_pagando + v_clinicas_expiradas) * 100, 1
    );
  END IF;

  RETURN jsonb_build_object(
    'mrr_total',            v_mrr_total,
    'arr_total',            v_mrr_total * 12,
    'tasa_conversion',      v_tasa_conversion,
    'nuevas_este_mes',      v_nuevas_este_mes,
    'nuevas_mes_anterior',  v_nuevas_mes_anterior,
    'clinicas_pagando',     v_clinicas_pagando,
    'clinicas_trial',       v_clinicas_trial,
    'clinicas_expiradas',   v_clinicas_expiradas,
    'clinicas_suspendidas', v_clinicas_suspendidas,
    'arpu',                 v_arpu,
    'churn_rate',           v_churn_rate,
    'ltv_estimado',         v_ltv,

    'por_plan', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'nombre',             nombre,
          'precio_mensual_usd', precio_mensual_usd,
          'clinicas',           clinicas_count,
          'mrr_aporte',         clinicas_count * precio_mensual_usd
        ) ORDER BY clinicas_count DESC
      ), '[]'::jsonb)
      FROM (
        SELECT p.nombre, p.precio_mensual_usd, COUNT(c.id) AS clinicas_count
        FROM planes p
        LEFT JOIN clinicas c ON c.plan_id = p.id AND c.estado = 'activo'
        GROUP BY p.id, p.nombre, p.precio_mensual_usd
      ) sub
    ),

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
      ),
      cumulative AS (
        SELECT
          m.mes,
          SUM(COALESCE(mn.mrr_nuevo, 0))
            OVER (ORDER BY m.mes ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS mrr
        FROM months m
        LEFT JOIN monthly_new mn ON mn.mes = m.mes
      )
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('mes', to_char(mes, 'Mon YY'), 'mrr', mrr)
        ORDER BY mes
      ), '[]'::jsonb)
      FROM cumulative
    ),

    'trials_por_vencer', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id',             c.id,
          'nombre',         c.nombre,
          'ciudad',         COALESCE(c.ciudad, '—'),
          'trial_hasta',    c.trial_hasta,
          'dias_restantes', GREATEST(0, EXTRACT(DAY FROM c.trial_hasta - NOW())::INT)
        ) ORDER BY c.trial_hasta ASC
      ), '[]'::jsonb)
      FROM clinicas c
      WHERE c.estado = 'trial'
        AND c.trial_hasta BETWEEN NOW() AND NOW() + INTERVAL '14 days'
    ),

    'funnel', (
      SELECT jsonb_build_object(
        'trial',      COUNT(*) FILTER (WHERE estado = 'trial' AND trial_hasta >= NOW()),
        'activo',     COUNT(*) FILTER (WHERE estado = 'activo'),
        'expirado',   COUNT(*) FILTER (WHERE (estado = 'trial' AND trial_hasta < NOW()) OR estado = 'expirado'),
        'suspendido', COUNT(*) FILTER (WHERE estado = 'suspendida')
      )
      FROM clinicas
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_financial_stats() TO authenticated;

-- ============================================================
-- PASO 3: Recargar schema de PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
