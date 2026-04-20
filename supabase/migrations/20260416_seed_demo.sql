-- ============================================================
-- DATOS DEMO — SurgicalHUB
-- Llena la base de datos con datos realistas para demostración.
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================
-- ⚠️  Solo ejecutar en entornos de DEMO/TEST, no en producción.
-- ============================================================

DO $$
DECLARE
  v_clinica_id  UUID;
  -- IDs para auth.users / public.users de los médicos demo
  v_auth1_id    UUID := gen_random_uuid();
  v_auth2_id    UUID := gen_random_uuid();
  v_auth3_id    UUID := gen_random_uuid();
  v_auth4_id    UUID := gen_random_uuid();
  v_auth5_id    UUID := gen_random_uuid();
  -- IDs médicos
  v_doc1_id     UUID := gen_random_uuid();
  v_doc2_id     UUID := gen_random_uuid();
  v_doc3_id     UUID := gen_random_uuid();
  v_doc4_id     UUID := gen_random_uuid();
  v_doc5_id     UUID := gen_random_uuid();
  -- IDs pacientes
  v_pat1_id     UUID := gen_random_uuid();
  v_pat2_id     UUID := gen_random_uuid();
  v_pat3_id     UUID := gen_random_uuid();
  v_pat4_id     UUID := gen_random_uuid();
  v_pat5_id     UUID := gen_random_uuid();
  v_pat6_id     UUID := gen_random_uuid();
  v_pat7_id     UUID := gen_random_uuid();
  v_pat8_id     UUID := gen_random_uuid();
  -- IDs pabellones
  v_room1_id    UUID;
  v_room2_id    UUID;
  v_room3_id    UUID;
  -- IDs insumos
  v_sup1_id     UUID := gen_random_uuid();
  v_sup2_id     UUID := gen_random_uuid();
  v_sup3_id     UUID := gen_random_uuid();
  v_sup4_id     UUID := gen_random_uuid();
  v_sup5_id     UUID := gen_random_uuid();
  -- IDs solicitudes (12 aceptadas para cirugías + 3 pendientes + 1 rechazada = 16)
  v_sreq1_id    UUID := gen_random_uuid();
  v_sreq2_id    UUID := gen_random_uuid();
  v_sreq3_id    UUID := gen_random_uuid();
  v_sreq4_id    UUID := gen_random_uuid();
  v_sreq5_id    UUID := gen_random_uuid();
  v_sreq6_id    UUID := gen_random_uuid();
  v_sreq7_id    UUID := gen_random_uuid();
  v_sreq8_id    UUID := gen_random_uuid();
  v_sreq9_id    UUID := gen_random_uuid();
  v_sreq10_id   UUID := gen_random_uuid();
  v_sreq11_id   UUID := gen_random_uuid();
  v_sreq12_id   UUID := gen_random_uuid();
  v_sreq13_id   UUID := gen_random_uuid();  -- pendiente
  v_sreq14_id   UUID := gen_random_uuid();  -- pendiente
  v_sreq15_id   UUID := gen_random_uuid();  -- pendiente
  v_sreq16_id   UUID := gen_random_uuid();  -- rechazada
  v_hoy         DATE := CURRENT_DATE;
BEGIN

  -- ── Clínica ────────────────────────────────────────────────
  SELECT id INTO v_clinica_id FROM clinicas ORDER BY created_at LIMIT 1;
  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION 'No hay clínica registrada. Registra una clínica primero.';
  END IF;
  RAISE NOTICE 'Usando clínica: %', v_clinica_id;

  -- ── Auth users para médicos demo ───────────────────────────
  -- Usamos WHERE NOT EXISTS en lugar de ON CONFLICT porque auth.users
  -- puede tener índices parciales que no son compatibles con ON CONFLICT (col).
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  SELECT v_auth1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'carlos.munoz@demo.cl', crypt('Demo1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'carlos.munoz@demo.cl');

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  SELECT v_auth2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'v.rodriguez@demo.cl', crypt('Demo1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'v.rodriguez@demo.cl');

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  SELECT v_auth3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'a.fuentes@demo.cl', crypt('Demo1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'a.fuentes@demo.cl');

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  SELECT v_auth4_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'c.herrera@demo.cl', crypt('Demo1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c.herrera@demo.cl');

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  SELECT v_auth5_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'r.soto@demo.cl', crypt('Demo1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'r.soto@demo.cl');

  -- Leer los IDs reales (ya sean nuevos o existentes)
  SELECT id INTO v_auth1_id FROM auth.users WHERE email = 'carlos.munoz@demo.cl' LIMIT 1;
  SELECT id INTO v_auth2_id FROM auth.users WHERE email = 'v.rodriguez@demo.cl'  LIMIT 1;
  SELECT id INTO v_auth3_id FROM auth.users WHERE email = 'a.fuentes@demo.cl'    LIMIT 1;
  SELECT id INTO v_auth4_id FROM auth.users WHERE email = 'c.herrera@demo.cl'    LIMIT 1;
  SELECT id INTO v_auth5_id FROM auth.users WHERE email = 'r.soto@demo.cl'       LIMIT 1;

  -- Crear filas en public.users: id, email, role (role IN ('pabellon','doctor'))
  INSERT INTO users (id, email, role)
  SELECT v_auth1_id, 'carlos.munoz@demo.cl', 'doctor' WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = v_auth1_id);
  INSERT INTO users (id, email, role)
  SELECT v_auth2_id, 'v.rodriguez@demo.cl',  'doctor' WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = v_auth2_id);
  INSERT INTO users (id, email, role)
  SELECT v_auth3_id, 'a.fuentes@demo.cl',    'doctor' WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = v_auth3_id);
  INSERT INTO users (id, email, role)
  SELECT v_auth4_id, 'c.herrera@demo.cl',    'doctor' WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = v_auth4_id);
  INSERT INTO users (id, email, role)
  SELECT v_auth5_id, 'r.soto@demo.cl',       'doctor' WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = v_auth5_id);

  -- ── Pabellones ─────────────────────────────────────────────
  INSERT INTO operating_rooms (id, nombre, clinica_id, activo, created_at)
  VALUES
    (gen_random_uuid(), 'Pabellón 1 — Cirugía General',        v_clinica_id, true, NOW() - INTERVAL '3 minutes'),
    (gen_random_uuid(), 'Pabellón 2 — Traumatología',          v_clinica_id, true, NOW() - INTERVAL '2 minutes'),
    (gen_random_uuid(), 'Pabellón 3 — Urgencias/Laparoscopia', v_clinica_id, true, NOW() - INTERVAL '1 minute')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_room1_id FROM operating_rooms WHERE clinica_id = v_clinica_id AND deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO v_room2_id FROM operating_rooms WHERE clinica_id = v_clinica_id AND deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO v_room3_id FROM operating_rooms WHERE clinica_id = v_clinica_id AND deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 2;
  IF v_room2_id IS NULL THEN v_room2_id := v_room1_id; END IF;
  IF v_room3_id IS NULL THEN v_room3_id := v_room1_id; END IF;

  -- ── Médicos ────────────────────────────────────────────────
  INSERT INTO doctors (id, user_id, nombre, apellido, rut, especialidad, email, estado, acceso_web_enabled, clinica_id, created_at)
  VALUES
    (v_doc1_id, v_auth1_id, 'Carlos',    'Muñoz',     '12345678-9', 'cirugia_general',        'carlos.munoz@demo.cl',  'activo', false, v_clinica_id, NOW() - INTERVAL '5 minutes'),
    (v_doc2_id, v_auth2_id, 'Valentina', 'Rodríguez', '9876543-2',  'cirugia_ortopedica',     'v.rodriguez@demo.cl',   'activo', false, v_clinica_id, NOW() - INTERVAL '4 minutes'),
    (v_doc3_id, v_auth3_id, 'Andrés',    'Fuentes',   '15432198-K', 'cirugia_general',        'a.fuentes@demo.cl',     'activo', false, v_clinica_id, NOW() - INTERVAL '3 minutes'),
    (v_doc4_id, v_auth4_id, 'Camila',    'Herrera',   '8765432-1',  'ginecologia',            'c.herrera@demo.cl',     'activo', false, v_clinica_id, NOW() - INTERVAL '2 minutes'),
    (v_doc5_id, v_auth5_id, 'Roberto',   'Soto',      '17654321-3', 'cirugia_cardiovascular', 'r.soto@demo.cl',        'activo', false, v_clinica_id, NOW() - INTERVAL '1 minute')
  ON CONFLICT DO NOTHING;

  -- Releer IDs de médicos si ya existían
  IF NOT EXISTS (SELECT 1 FROM doctors WHERE id = v_doc1_id) THEN
    SELECT id INTO v_doc1_id FROM doctors WHERE clinica_id = v_clinica_id ORDER BY created_at LIMIT 1 OFFSET 0;
    SELECT id INTO v_doc2_id FROM doctors WHERE clinica_id = v_clinica_id ORDER BY created_at LIMIT 1 OFFSET 1;
    SELECT id INTO v_doc3_id FROM doctors WHERE clinica_id = v_clinica_id ORDER BY created_at LIMIT 1 OFFSET 2;
    SELECT id INTO v_doc4_id FROM doctors WHERE clinica_id = v_clinica_id ORDER BY created_at LIMIT 1 OFFSET 3;
    SELECT id INTO v_doc5_id FROM doctors WHERE clinica_id = v_clinica_id ORDER BY created_at LIMIT 1 OFFSET 4;
  END IF;
  IF v_doc2_id IS NULL THEN v_doc2_id := v_doc1_id; END IF;
  IF v_doc3_id IS NULL THEN v_doc3_id := v_doc1_id; END IF;
  IF v_doc4_id IS NULL THEN v_doc4_id := v_doc1_id; END IF;
  IF v_doc5_id IS NULL THEN v_doc5_id := v_doc1_id; END IF;

  -- ── Pacientes ──────────────────────────────────────────────
  -- Cada paciente tiene doctor_id (el médico que lo creó) y clinica_id
  -- UNIQUE(doctor_id, rut): los RUTs son distintos dentro del mismo médico
  INSERT INTO patients (id, doctor_id, nombre, apellido, rut, clinica_id, created_at)
  VALUES
    (v_pat1_id, v_doc1_id, 'María',    'González', '12345678-9', v_clinica_id, NOW()),
    (v_pat2_id, v_doc2_id, 'José',     'Martínez', '9876543-2',  v_clinica_id, NOW()),
    (v_pat3_id, v_doc3_id, 'Ana',      'López',    '15432198-K', v_clinica_id, NOW()),
    (v_pat4_id, v_doc5_id, 'Luis',     'Castillo', '8765432-1',  v_clinica_id, NOW()),
    (v_pat5_id, v_doc4_id, 'Sofía',    'Vargas',   '17654321-3', v_clinica_id, NOW()),
    (v_pat6_id, v_doc1_id, 'Miguel',   'Ramos',    '11223344-5', v_clinica_id, NOW()),
    (v_pat7_id, v_doc3_id, 'Patricia', 'Torres',   '14567890-6', v_clinica_id, NOW()),
    (v_pat8_id, v_doc2_id, 'Diego',    'Navarro',  '7654321-8',  v_clinica_id, NOW())
  ON CONFLICT DO NOTHING;

  -- ── Insumos ────────────────────────────────────────────────
  -- grupo_prestacion es NOT NULL según schema; clinica_id fue agregado por migración
  INSERT INTO supplies (id, nombre, codigo, grupo_prestacion, activo, clinica_id, created_at)
  VALUES
    (v_sup1_id, 'Gasa estéril 10x10cm',    'INS-001', 'Material quirúrgico', true, v_clinica_id, NOW()),
    (v_sup2_id, 'Sutura Vicryl 2-0',       'INS-002', 'Sutura',              true, v_clinica_id, NOW()),
    (v_sup3_id, 'Bisturí desechable N°20', 'INS-003', 'Instrumental',        true, v_clinica_id, NOW()),
    (v_sup4_id, 'Guantes látex talla M',   'INS-004', 'EPP',                 true, v_clinica_id, NOW()),
    (v_sup5_id, 'Lidocaína 2% 20mL',       'INS-005', 'Anestésico',          true, v_clinica_id, NOW())
  ON CONFLICT DO NOTHING;

  -- Releer IDs de insumos (por si ya existían por código único)
  SELECT id INTO v_sup1_id FROM supplies WHERE codigo = 'INS-001' AND clinica_id = v_clinica_id LIMIT 1;
  SELECT id INTO v_sup2_id FROM supplies WHERE codigo = 'INS-002' AND clinica_id = v_clinica_id LIMIT 1;
  SELECT id INTO v_sup3_id FROM supplies WHERE codigo = 'INS-003' AND clinica_id = v_clinica_id LIMIT 1;
  SELECT id INTO v_sup4_id FROM supplies WHERE codigo = 'INS-004' AND clinica_id = v_clinica_id LIMIT 1;
  SELECT id INTO v_sup5_id FROM supplies WHERE codigo = 'INS-005' AND clinica_id = v_clinica_id LIMIT 1;

  -- ── Solicitudes ────────────────────────────────────────────
  -- surgery_request_id es UNIQUE en surgeries → necesitamos una solicitud por cirugía
  -- 12 aceptadas (para las 12 cirugías) + 3 pendientes + 1 rechazada
  INSERT INTO surgery_requests (id, doctor_id, patient_id, clinica_id, codigo_operacion, estado, created_at)
  VALUES
    -- aceptadas → tendrán cirugía
    (v_sreq1_id,  v_doc1_id, v_pat1_id, v_clinica_id, 'P1201', 'aceptada', NOW() - INTERVAL '7 hours'),
    (v_sreq2_id,  v_doc3_id, v_pat3_id, v_clinica_id, 'M0201', 'aceptada', NOW() - INTERVAL '6 hours'),
    (v_sreq3_id,  v_doc2_id, v_pat2_id, v_clinica_id, 'P1201', 'aceptada', NOW() - INTERVAL '6 hours'),
    (v_sreq4_id,  v_doc5_id, v_pat4_id, v_clinica_id, 'P0801', 'aceptada', NOW() - INTERVAL '5 hours'),
    (v_sreq5_id,  v_doc4_id, v_pat5_id, v_clinica_id, 'G0203', 'aceptada', NOW() - INTERVAL '1 day'),
    (v_sreq6_id,  v_doc1_id, v_pat6_id, v_clinica_id, 'P1201', 'aceptada', NOW() - INTERVAL '1 day'),
    (v_sreq7_id,  v_doc3_id, v_pat7_id, v_clinica_id, 'M0201', 'aceptada', NOW() - INTERVAL '1 day'),
    (v_sreq8_id,  v_doc2_id, v_pat8_id, v_clinica_id, 'P1201', 'aceptada', NOW() - INTERVAL '2 days'),
    (v_sreq9_id,  v_doc4_id, v_pat1_id, v_clinica_id, 'G0203', 'aceptada', NOW() - INTERVAL '2 days'),
    (v_sreq10_id, v_doc5_id, v_pat3_id, v_clinica_id, 'P0801', 'aceptada', NOW() - INTERVAL '2 days'),
    (v_sreq11_id, v_doc1_id, v_pat4_id, v_clinica_id, 'P1201', 'aceptada', NOW() - INTERVAL '3 days'),
    (v_sreq12_id, v_doc3_id, v_pat2_id, v_clinica_id, 'M0201', 'aceptada', NOW() - INTERVAL '3 days'),
    -- pendientes (sin cirugía aún — aparecen en dashboard)
    (v_sreq13_id, v_doc1_id, v_pat1_id, v_clinica_id, 'P1201', 'pendiente', NOW() - INTERVAL '2 hours'),
    (v_sreq14_id, v_doc2_id, v_pat2_id, v_clinica_id, 'P0801', 'pendiente', NOW() - INTERVAL '5 hours'),
    (v_sreq15_id, v_doc4_id, v_pat5_id, v_clinica_id, 'G0203', 'pendiente', NOW() - INTERVAL '1 day'),
    -- rechazada
    (v_sreq16_id, v_doc1_id, v_pat6_id, v_clinica_id, 'P1201', 'rechazada', NOW() - INTERVAL '2 days')
  ON CONFLICT DO NOTHING;

  -- ── Cirugías ───────────────────────────────────────────────
  -- El schema tiene CONSTRAINT fecha_futura CHECK (fecha >= CURRENT_DATE).
  -- Para insertar datos históricos (demo), la desactivamos temporalmente.
  ALTER TABLE surgeries DROP CONSTRAINT IF EXISTS fecha_futura;

  -- El trigger notificar_cirugia_programada intenta insertar en notifications
  -- sin clinica_id (que es NOT NULL). Lo deshabilitamos para el seed demo.
  ALTER TABLE surgeries DISABLE TRIGGER trigger_notificar_cirugia_programada;

  -- surgery_request_id es NOT NULL y UNIQUE → una cirugía por solicitud
  -- clinica_id fue agregado por migración posterior al schema original
  INSERT INTO surgeries (id, clinica_id, fecha, hora_inicio, hora_fin, estado, doctor_id, patient_id, operating_room_id, surgery_request_id, created_at)
  VALUES
    -- HOY
    (gen_random_uuid(), v_clinica_id, v_hoy, '08:00', '10:00', 'completada', v_doc1_id, v_pat1_id, v_room1_id, v_sreq1_id,  NOW() - INTERVAL '6 hours'),
    (gen_random_uuid(), v_clinica_id, v_hoy, '10:30', '12:30', 'en_proceso', v_doc3_id, v_pat3_id, v_room2_id, v_sreq2_id,  NOW() - INTERVAL '1 hour'),
    (gen_random_uuid(), v_clinica_id, v_hoy, '13:00', '15:00', 'programada', v_doc2_id, v_pat2_id, v_room1_id, v_sreq3_id,  NOW()),
    (gen_random_uuid(), v_clinica_id, v_hoy, '15:30', '18:00', 'programada', v_doc5_id, v_pat4_id, v_room3_id, v_sreq4_id,  NOW()),
    -- MAÑANA
    (gen_random_uuid(), v_clinica_id, v_hoy + 1, '08:30', '10:00', 'programada', v_doc4_id, v_pat5_id, v_room2_id, v_sreq5_id,  NOW()),
    (gen_random_uuid(), v_clinica_id, v_hoy + 1, '10:30', '12:00', 'programada', v_doc1_id, v_pat6_id, v_room1_id, v_sreq6_id,  NOW()),
    (gen_random_uuid(), v_clinica_id, v_hoy + 1, '14:00', '16:30', 'programada', v_doc3_id, v_pat7_id, v_room3_id, v_sreq7_id,  NOW()),
    -- AYER (historial)
    (gen_random_uuid(), v_clinica_id, v_hoy - 1, '08:00', '09:30', 'completada', v_doc2_id, v_pat8_id, v_room1_id, v_sreq8_id,  NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), v_clinica_id, v_hoy - 1, '10:00', '12:00', 'completada', v_doc4_id, v_pat1_id, v_room2_id, v_sreq9_id,  NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), v_clinica_id, v_hoy - 1, '13:30', '16:00', 'completada', v_doc5_id, v_pat3_id, v_room3_id, v_sreq10_id, NOW() - INTERVAL '1 day'),
    -- HACE 2 DÍAS
    (gen_random_uuid(), v_clinica_id, v_hoy - 2, '09:00', '11:00', 'completada', v_doc1_id, v_pat4_id, v_room1_id, v_sreq11_id, NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), v_clinica_id, v_hoy - 2, '14:00', '15:30', 'completada', v_doc3_id, v_pat2_id, v_room2_id, v_sreq12_id, NOW() - INTERVAL '2 days')
  ON CONFLICT DO NOTHING;

  -- Re-habilitar el trigger de notificaciones
  ALTER TABLE surgeries ENABLE TRIGGER trigger_notificar_cirugia_programada;

  -- Re-agregar constraint pero como NOT VALID (no valida filas históricas existentes,
  -- pero sí valida nuevos inserts desde la app)
  ALTER TABLE surgeries ADD CONSTRAINT fecha_futura
    CHECK (fecha >= CURRENT_DATE) NOT VALID;

  -- ── Insumos en solicitudes ─────────────────────────────────
  INSERT INTO surgery_request_supplies (surgery_request_id, supply_id, cantidad, clinica_id)
  VALUES
    (v_sreq13_id, v_sup1_id, 5, v_clinica_id),
    (v_sreq13_id, v_sup3_id, 2, v_clinica_id),
    (v_sreq14_id, v_sup1_id, 8, v_clinica_id),
    (v_sreq14_id, v_sup2_id, 3, v_clinica_id),
    (v_sreq15_id, v_sup2_id, 4, v_clinica_id),
    (v_sreq3_id,  v_sup3_id, 1, v_clinica_id),
    (v_sreq3_id,  v_sup4_id, 6, v_clinica_id),
    (v_sreq4_id,  v_sup5_id, 2, v_clinica_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Seed demo completado para clínica: %', v_clinica_id;
  RAISE NOTICE '   3 pabellones | 5 médicos | 8 pacientes | 5 insumos';
  RAISE NOTICE '   16 solicitudes (3 pendientes, 12 aceptadas, 1 rechazada)';
  RAISE NOTICE '   12 cirugías (4 hoy, 3 mañana, 5 historial)';
  RAISE NOTICE '   Médicos demo pueden loguearse con: Demo1234!';

END;
$$;
