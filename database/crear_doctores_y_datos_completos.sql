-- =====================================================
-- CREAR DOCTORES, PACIENTES, CIRUGÍAS Y BLOQUEOS
-- =====================================================
-- 
-- INSTRUCCIONES IMPORTANTES:
-- 
-- 1. PRIMERO debes crear los usuarios en auth.users usando la API de Supabase Admin
--    o desde el Dashboard de Supabase (Authentication > Users > Add User)
-- 
-- 2. Para cada doctor, crea un usuario con:
--    - Email: el email del doctor (ej: doctor1@clinica.com)
--    - Password: una contraseña segura
--    - Email confirmado: true
-- 
-- 3. Después de crear los usuarios en auth, ejecuta este script SQL
-- 
-- =====================================================

-- =====================================================
-- PASO 1: Crear usuarios en public.users (si no existen)
-- =====================================================
-- Estos usuarios deben existir primero en auth.users

INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    'doctor'::text,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email IN (
    'doctor1@clinica.com',
    'doctor2@clinica.com',
    'doctor3@clinica.com'
)
AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PASO 2: Crear doctores
-- =====================================================

-- Doctor 1: Dr. Carlos Mendoza - Cirugía General
INSERT INTO public.doctors (
    user_id,
    nombre,
    apellido,
    rut,
    email,
    especialidad,
    estado,
    acceso_web_enabled,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'Carlos',
    'Mendoza',
    '12345678-9',
    'doctor1@clinica.com',
    'cirugia_general'::medical_specialty,
    'activo'::doctor_status,
    true,
    NOW(),
    NOW()
FROM public.users u
WHERE u.email = 'doctor1@clinica.com'
AND NOT EXISTS (
    SELECT 1 FROM public.doctors d WHERE d.email = 'doctor1@clinica.com' AND d.deleted_at IS NULL
);

-- Doctor 2: Dra. María González - Cirugía Cardiovascular
INSERT INTO public.doctors (
    user_id,
    nombre,
    apellido,
    rut,
    email,
    especialidad,
    estado,
    acceso_web_enabled,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'María',
    'González',
    '23456789-0',
    'doctor2@clinica.com',
    'cirugia_cardiovascular'::medical_specialty,
    'activo'::doctor_status,
    true,
    NOW(),
    NOW()
FROM public.users u
WHERE u.email = 'doctor2@clinica.com'
AND NOT EXISTS (
    SELECT 1 FROM public.doctors d WHERE d.email = 'doctor2@clinica.com' AND d.deleted_at IS NULL
);

-- Doctor 3: Dr. Juan Pérez - Cirugía Ortopédica
INSERT INTO public.doctors (
    user_id,
    nombre,
    apellido,
    rut,
    email,
    especialidad,
    estado,
    acceso_web_enabled,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'Juan',
    'Pérez',
    '34567890-1',
    'doctor3@clinica.com',
    'cirugia_ortopedica'::medical_specialty,
    'activo'::doctor_status,
    true,
    NOW(),
    NOW()
FROM public.users u
WHERE u.email = 'doctor3@clinica.com'
AND NOT EXISTS (
    SELECT 1 FROM public.doctors d WHERE d.email = 'doctor3@clinica.com' AND d.deleted_at IS NULL
);

-- =====================================================
-- PASO 3: Crear pacientes para cada doctor
-- =====================================================

-- Pacientes del Doctor 1
INSERT INTO public.patients (doctor_id, nombre, apellido, rut, created_at, updated_at)
SELECT 
    d.id,
    'Ana',
    'Silva',
    '11111111-1',
    NOW(),
    NOW()
FROM public.doctors d
WHERE d.email = 'doctor1@clinica.com' AND d.deleted_at IS NULL
ON CONFLICT (doctor_id, rut) DO NOTHING;

INSERT INTO public.patients (doctor_id, nombre, apellido, rut, created_at, updated_at)
SELECT 
    d.id,
    'Pedro',
    'Martínez',
    '22222222-2',
    NOW(),
    NOW()
FROM public.doctors d
WHERE d.email = 'doctor1@clinica.com' AND d.deleted_at IS NULL
ON CONFLICT (doctor_id, rut) DO NOTHING;

INSERT INTO public.patients (doctor_id, nombre, apellido, rut, created_at, updated_at)
SELECT 
    d.id,
    'Laura',
    'Rodríguez',
    '33333333-3',
    NOW(),
    NOW()
FROM public.doctors d
WHERE d.email = 'doctor1@clinica.com' AND d.deleted_at IS NULL
ON CONFLICT (doctor_id, rut) DO NOTHING;

-- Pacientes del Doctor 2
INSERT INTO public.patients (doctor_id, nombre, apellido, rut, created_at, updated_at)
SELECT 
    d.id,
    'Roberto',
    'Fernández',
    '44444444-4',
    NOW(),
    NOW()
FROM public.doctors d
WHERE d.email = 'doctor2@clinica.com' AND d.deleted_at IS NULL
ON CONFLICT (doctor_id, rut) DO NOTHING;

INSERT INTO public.patients (doctor_id, nombre, apellido, rut, created_at, updated_at)
SELECT 
    d.id,
    'Carmen',
    'López',
    '55555555-5',
    NOW(),
    NOW()
FROM public.doctors d
WHERE d.email = 'doctor2@clinica.com' AND d.deleted_at IS NULL
ON CONFLICT (doctor_id, rut) DO NOTHING;

-- Pacientes del Doctor 3
INSERT INTO public.patients (doctor_id, nombre, apellido, rut, created_at, updated_at)
SELECT 
    d.id,
    'Diego',
    'Sánchez',
    '66666666-6',
    NOW(),
    NOW()
FROM public.doctors d
WHERE d.email = 'doctor3@clinica.com' AND d.deleted_at IS NULL
ON CONFLICT (doctor_id, rut) DO NOTHING;

INSERT INTO public.patients (doctor_id, nombre, apellido, rut, created_at, updated_at)
SELECT 
    d.id,
    'Patricia',
    'Torres',
    '77777777-7',
    NOW(),
    NOW()
FROM public.doctors d
WHERE d.email = 'doctor3@clinica.com' AND d.deleted_at IS NULL
ON CONFLICT (doctor_id, rut) DO NOTHING;

INSERT INTO public.patients (doctor_id, nombre, apellido, rut, created_at, updated_at)
SELECT 
    d.id,
    'Fernando',
    'Morales',
    '88888888-8',
    NOW(),
    NOW()
FROM public.doctors d
WHERE d.email = 'doctor3@clinica.com' AND d.deleted_at IS NULL
ON CONFLICT (doctor_id, rut) DO NOTHING;

-- =====================================================
-- PASO 4: Crear solicitudes quirúrgicas
-- =====================================================

-- Solicitudes para Doctor 1
INSERT INTO public.surgery_requests (doctor_id, patient_id, codigo_operacion, hora_recomendada, observaciones, estado, created_at, updated_at)
SELECT 
    d.id,
    p.id,
    'CIR001',
    '09:00:00',
    'Cirugía de apendicectomía',
    'aceptada'::request_status,
    NOW(),
    NOW()
FROM public.doctors d
JOIN public.patients p ON p.doctor_id = d.id
WHERE d.email = 'doctor1@clinica.com' 
AND p.rut = '11111111-1'
AND d.deleted_at IS NULL
AND p.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.surgery_requests (doctor_id, patient_id, codigo_operacion, hora_recomendada, observaciones, estado, created_at, updated_at)
SELECT 
    d.id,
    p.id,
    'CIR002',
    '11:00:00',
    'Cirugía de vesícula',
    'aceptada'::request_status,
    NOW(),
    NOW()
FROM public.doctors d
JOIN public.patients p ON p.doctor_id = d.id
WHERE d.email = 'doctor1@clinica.com' 
AND p.rut = '22222222-2'
AND d.deleted_at IS NULL
AND p.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- Solicitudes para Doctor 2
INSERT INTO public.surgery_requests (doctor_id, patient_id, codigo_operacion, hora_recomendada, observaciones, estado, created_at, updated_at)
SELECT 
    d.id,
    p.id,
    'CAR001',
    '10:00:00',
    'Bypass coronario',
    'aceptada'::request_status,
    NOW(),
    NOW()
FROM public.doctors d
JOIN public.patients p ON p.doctor_id = d.id
WHERE d.email = 'doctor2@clinica.com' 
AND p.rut = '44444444-4'
AND d.deleted_at IS NULL
AND p.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- Solicitudes para Doctor 3
INSERT INTO public.surgery_requests (doctor_id, patient_id, codigo_operacion, hora_recomendada, observaciones, estado, created_at, updated_at)
SELECT 
    d.id,
    p.id,
    'ORT001',
    '14:00:00',
    'Artroscopia de rodilla',
    'aceptada'::request_status,
    NOW(),
    NOW()
FROM public.doctors d
JOIN public.patients p ON p.doctor_id = d.id
WHERE d.email = 'doctor3@clinica.com' 
AND p.rut = '66666666-6'
AND d.deleted_at IS NULL
AND p.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- =====================================================
-- PASO 5: Crear cirugías programadas
-- =====================================================

-- Cirugías para esta semana y la próxima
INSERT INTO public.surgeries (
    surgery_request_id,
    doctor_id,
    patient_id,
    operating_room_id,
    fecha,
    hora_inicio,
    hora_fin,
    estado,
    observaciones,
    created_at,
    updated_at
)
SELECT 
    sr.id,
    d.id,
    p.id,
    or1.id,
    CURRENT_DATE + INTERVAL '1 day',
    '09:00:00',
    '11:00:00',
    'programada'::surgery_status,
    'Cirugía programada',
    NOW(),
    NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or1 ON or1.nombre = 'Pabellón 1' AND or1.deleted_at IS NULL
WHERE d.email = 'doctor1@clinica.com' 
AND sr.codigo_operacion = 'CIR001'
AND sr.deleted_at IS NULL
AND d.deleted_at IS NULL
AND p.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

INSERT INTO public.surgeries (
    surgery_request_id,
    doctor_id,
    patient_id,
    operating_room_id,
    fecha,
    hora_inicio,
    hora_fin,
    estado,
    observaciones,
    created_at,
    updated_at
)
SELECT 
    sr.id,
    d.id,
    p.id,
    or2.id,
    CURRENT_DATE + INTERVAL '1 day',
    '11:00:00',
    '13:00:00',
    'programada'::surgery_status,
    'Cirugía programada',
    NOW(),
    NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or2 ON or2.nombre = 'Pabellón 2' AND or2.deleted_at IS NULL
WHERE d.email = 'doctor1@clinica.com' 
AND sr.codigo_operacion = 'CIR002'
AND sr.deleted_at IS NULL
AND d.deleted_at IS NULL
AND p.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

INSERT INTO public.surgeries (
    surgery_request_id,
    doctor_id,
    patient_id,
    operating_room_id,
    fecha,
    hora_inicio,
    hora_fin,
    estado,
    observaciones,
    created_at,
    updated_at
)
SELECT 
    sr.id,
    d.id,
    p.id,
    or3.id,
    CURRENT_DATE + INTERVAL '1 day',
    '10:00:00',
    '13:00:00',
    'programada'::surgery_status,
    'Cirugía programada',
    NOW(),
    NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or3 ON or3.nombre = 'Pabellón 3' AND or3.deleted_at IS NULL
WHERE d.email = 'doctor2@clinica.com' 
AND sr.codigo_operacion = 'CAR001'
AND sr.deleted_at IS NULL
AND d.deleted_at IS NULL
AND p.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

INSERT INTO public.surgeries (
    surgery_request_id,
    doctor_id,
    patient_id,
    operating_room_id,
    fecha,
    hora_inicio,
    hora_fin,
    estado,
    observaciones,
    created_at,
    updated_at
)
SELECT 
    sr.id,
    d.id,
    p.id,
    or1.id,
    CURRENT_DATE + INTERVAL '2 days',
    '14:00:00',
    '16:00:00',
    'programada'::surgery_status,
    'Cirugía programada',
    NOW(),
    NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or1 ON or1.nombre = 'Pabellón 1' AND or1.deleted_at IS NULL
WHERE d.email = 'doctor3@clinica.com' 
AND sr.codigo_operacion = 'ORT001'
AND sr.deleted_at IS NULL
AND d.deleted_at IS NULL
AND p.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

INSERT INTO public.surgeries (
    surgery_request_id,
    doctor_id,
    patient_id,
    operating_room_id,
    fecha,
    hora_inicio,
    hora_fin,
    estado,
    observaciones,
    created_at,
    updated_at
)
SELECT 
    sr.id,
    d.id,
    p.id,
    or2.id,
    CURRENT_DATE + INTERVAL '3 days',
    '08:00:00',
    '10:00:00',
    'programada'::surgery_status,
    'Segunda cirugía',
    NOW(),
    NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or2 ON or2.nombre = 'Pabellón 2' AND or2.deleted_at IS NULL
WHERE d.email = 'doctor1@clinica.com' 
AND sr.codigo_operacion = 'CIR001'
AND sr.deleted_at IS NULL
AND d.deleted_at IS NULL
AND p.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

INSERT INTO public.surgeries (
    surgery_request_id,
    doctor_id,
    patient_id,
    operating_room_id,
    fecha,
    hora_inicio,
    hora_fin,
    estado,
    observaciones,
    created_at,
    updated_at
)
SELECT 
    sr.id,
    d.id,
    p.id,
    or4.id,
    CURRENT_DATE + INTERVAL '5 days',
    '15:00:00',
    '17:00:00',
    'programada'::surgery_status,
    'Cirugía de seguimiento',
    NOW(),
    NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or4 ON or4.nombre = 'Pabellón 4' AND or4.deleted_at IS NULL
WHERE d.email = 'doctor2@clinica.com' 
AND sr.codigo_operacion = 'CAR001'
AND sr.deleted_at IS NULL
AND d.deleted_at IS NULL
AND p.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

-- =====================================================
-- AGREGAR MÁS CIRUGÍAS PARA QUE LOS DOCTORES TENGAN HORAS DE OPERACIONES
-- =====================================================

-- Crear solicitudes adicionales aceptadas
INSERT INTO public.surgery_requests (doctor_id, patient_id, codigo_operacion, hora_recomendada, observaciones, estado, created_at, updated_at)
SELECT d.id, p.id, 'CIR003', '14:00:00', 'Hernia inguinal', 'aceptada'::request_status, NOW(), NOW()
FROM public.doctors d
JOIN public.patients p ON p.doctor_id = d.id
WHERE d.email = 'doctor1@clinica.com' AND p.rut = '33333333-3' AND d.deleted_at IS NULL AND p.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.surgery_requests (doctor_id, patient_id, codigo_operacion, hora_recomendada, observaciones, estado, created_at, updated_at)
SELECT d.id, p.id, 'CAR002', '11:00:00', 'Angioplastia', 'aceptada'::request_status, NOW(), NOW()
FROM public.doctors d
JOIN public.patients p ON p.doctor_id = d.id
WHERE d.email = 'doctor2@clinica.com' AND p.rut = '55555555-5' AND d.deleted_at IS NULL AND p.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.surgery_requests (doctor_id, patient_id, codigo_operacion, hora_recomendada, observaciones, estado, created_at, updated_at)
SELECT d.id, p.id, 'ORT002', '09:00:00', 'Artroplastia de cadera', 'aceptada'::request_status, NOW(), NOW()
FROM public.doctors d
JOIN public.patients p ON p.doctor_id = d.id
WHERE d.email = 'doctor3@clinica.com' AND p.rut = '77777777-7' AND d.deleted_at IS NULL AND p.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.surgery_requests (doctor_id, patient_id, codigo_operacion, hora_recomendada, observaciones, estado, created_at, updated_at)
SELECT d.id, p.id, 'ORT003', '15:00:00', 'Cirugía de columna', 'aceptada'::request_status, NOW(), NOW()
FROM public.doctors d
JOIN public.patients p ON p.doctor_id = d.id
WHERE d.email = 'doctor3@clinica.com' AND p.rut = '88888888-8' AND d.deleted_at IS NULL AND p.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.surgery_requests (doctor_id, patient_id, codigo_operacion, hora_recomendada, observaciones, estado, created_at, updated_at)
SELECT d.id, p.id, 'CAR003', '16:00:00', 'Reemplazo valvular', 'aceptada'::request_status, NOW(), NOW()
FROM public.doctors d
JOIN public.patients p ON p.doctor_id = d.id
WHERE d.email = 'doctor2@clinica.com' AND p.rut = '44444444-4' AND d.deleted_at IS NULL AND p.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- Crear más cirugías programadas distribuidas en diferentes fechas y horarios
-- Doctor 1 - Más cirugías
INSERT INTO public.surgeries (surgery_request_id, doctor_id, patient_id, operating_room_id, fecha, hora_inicio, hora_fin, estado, observaciones, created_at, updated_at)
SELECT sr.id, d.id, p.id, or3.id, CURRENT_DATE + INTERVAL '4 days', '09:00:00', '11:30:00', 'programada'::surgery_status, 'Cirugía programada', NOW(), NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or3 ON or3.nombre = 'Pabellón 3' AND or3.deleted_at IS NULL
WHERE d.email = 'doctor1@clinica.com' AND sr.codigo_operacion = 'CIR003' AND sr.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

INSERT INTO public.surgeries (surgery_request_id, doctor_id, patient_id, operating_room_id, fecha, hora_inicio, hora_fin, estado, observaciones, created_at, updated_at)
SELECT sr.id, d.id, p.id, or1.id, CURRENT_DATE + INTERVAL '7 days', '08:00:00', '10:00:00', 'programada'::surgery_status, 'Cirugía programada', NOW(), NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or1 ON or1.nombre = 'Pabellón 1' AND or1.deleted_at IS NULL
WHERE d.email = 'doctor1@clinica.com' AND sr.codigo_operacion = 'CIR001' AND sr.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

INSERT INTO public.surgeries (surgery_request_id, doctor_id, patient_id, operating_room_id, fecha, hora_inicio, hora_fin, estado, observaciones, created_at, updated_at)
SELECT sr.id, d.id, p.id, or4.id, CURRENT_DATE + INTERVAL '8 days', '13:00:00', '15:00:00', 'programada'::surgery_status, 'Cirugía programada', NOW(), NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or4 ON or4.nombre = 'Pabellón 4' AND or4.deleted_at IS NULL
WHERE d.email = 'doctor1@clinica.com' AND sr.codigo_operacion = 'CIR002' AND sr.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

-- Doctor 2 - Más cirugías
INSERT INTO public.surgeries (surgery_request_id, doctor_id, patient_id, operating_room_id, fecha, hora_inicio, hora_fin, estado, observaciones, created_at, updated_at)
SELECT sr.id, d.id, p.id, or2.id, CURRENT_DATE + INTERVAL '6 days', '10:00:00', '12:30:00', 'programada'::surgery_status, 'Cirugía programada', NOW(), NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or2 ON or2.nombre = 'Pabellón 2' AND or2.deleted_at IS NULL
WHERE d.email = 'doctor2@clinica.com' AND sr.codigo_operacion = 'CAR002' AND sr.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

INSERT INTO public.surgeries (surgery_request_id, doctor_id, patient_id, operating_room_id, fecha, hora_inicio, hora_fin, estado, observaciones, created_at, updated_at)
SELECT sr.id, d.id, p.id, or1.id, CURRENT_DATE + INTERVAL '9 days', '14:00:00', '17:00:00', 'programada'::surgery_status, 'Cirugía programada', NOW(), NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or1 ON or1.nombre = 'Pabellón 1' AND or1.deleted_at IS NULL
WHERE d.email = 'doctor2@clinica.com' AND sr.codigo_operacion = 'CAR003' AND sr.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

INSERT INTO public.surgeries (surgery_request_id, doctor_id, patient_id, operating_room_id, fecha, hora_inicio, hora_fin, estado, observaciones, created_at, updated_at)
SELECT sr.id, d.id, p.id, or3.id, CURRENT_DATE + INTERVAL '10 days', '09:00:00', '11:00:00', 'programada'::surgery_status, 'Cirugía programada', NOW(), NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or3 ON or3.nombre = 'Pabellón 3' AND or3.deleted_at IS NULL
WHERE d.email = 'doctor2@clinica.com' AND sr.codigo_operacion = 'CAR001' AND sr.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

-- Doctor 3 - Más cirugías
INSERT INTO public.surgeries (surgery_request_id, doctor_id, patient_id, operating_room_id, fecha, hora_inicio, hora_fin, estado, observaciones, created_at, updated_at)
SELECT sr.id, d.id, p.id, or4.id, CURRENT_DATE + INTERVAL '7 days', '11:00:00', '13:00:00', 'programada'::surgery_status, 'Cirugía programada', NOW(), NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or4 ON or4.nombre = 'Pabellón 4' AND or4.deleted_at IS NULL
WHERE d.email = 'doctor3@clinica.com' AND sr.codigo_operacion = 'ORT002' AND sr.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

INSERT INTO public.surgeries (surgery_request_id, doctor_id, patient_id, operating_room_id, fecha, hora_inicio, hora_fin, estado, observaciones, created_at, updated_at)
SELECT sr.id, d.id, p.id, or2.id, CURRENT_DATE + INTERVAL '9 days', '10:00:00', '12:00:00', 'programada'::surgery_status, 'Cirugía programada', NOW(), NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or2 ON or2.nombre = 'Pabellón 2' AND or2.deleted_at IS NULL
WHERE d.email = 'doctor3@clinica.com' AND sr.codigo_operacion = 'ORT003' AND sr.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

INSERT INTO public.surgeries (surgery_request_id, doctor_id, patient_id, operating_room_id, fecha, hora_inicio, hora_fin, estado, observaciones, created_at, updated_at)
SELECT sr.id, d.id, p.id, or1.id, CURRENT_DATE + INTERVAL '11 days', '08:30:00', '10:30:00', 'programada'::surgery_status, 'Cirugía programada', NOW(), NOW()
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
JOIN public.operating_rooms or1 ON or1.nombre = 'Pabellón 1' AND or1.deleted_at IS NULL
WHERE d.email = 'doctor3@clinica.com' AND sr.codigo_operacion = 'ORT001' AND sr.deleted_at IS NULL
ON CONFLICT (operating_room_id, fecha, hora_inicio) DO NOTHING;

-- =====================================================
-- PASO 6: Crear bloques de horarios
-- =====================================================

-- Obtener ID de usuario pabellón para crear bloques
DO $$
DECLARE
    usuario_pabellon_id UUID;
BEGIN
    SELECT id INTO usuario_pabellon_id 
    FROM public.users 
    WHERE role = 'pabellon' AND deleted_at IS NULL 
    LIMIT 1;
    
    IF usuario_pabellon_id IS NULL THEN
        SELECT id INTO usuario_pabellon_id 
        FROM public.users 
        WHERE deleted_at IS NULL 
        LIMIT 1;
    END IF;
    
    IF usuario_pabellon_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún usuario para crear bloques. Crea primero un usuario pabellón.';
    END IF;

    -- Bloqueo 1: Pabellón 1 bloqueado mañana de 12:00 a 14:00 (convenio)
    INSERT INTO public.schedule_blocks (
        doctor_id,
        operating_room_id,
        fecha,
        hora_inicio,
        hora_fin,
        motivo,
        vigencia_hasta,
        created_by,
        created_at,
        updated_at
    )
    SELECT 
        NULL,
        or1.id,
        CURRENT_DATE + INTERVAL '1 day',
        '12:00:00',
        '14:00:00',
        'Bloqueo por convenio',
        NULL,
        usuario_pabellon_id,
        NOW(),
        NOW()
    FROM public.operating_rooms or1
    WHERE or1.nombre = 'Pabellón 1' AND or1.deleted_at IS NULL
    ON CONFLICT DO NOTHING;
    
    -- Bloqueo 2: Pabellón 2 bloqueado pasado mañana todo el día (mantenimiento)
    INSERT INTO public.schedule_blocks (
        doctor_id,
        operating_room_id,
        fecha,
        hora_inicio,
        hora_fin,
        motivo,
        vigencia_hasta,
        created_by,
        created_at,
        updated_at
    )
    SELECT 
        NULL,
        or2.id,
        CURRENT_DATE + INTERVAL '2 days',
        '08:00:00',
        '18:00:00',
        'Mantenimiento programado',
        CURRENT_DATE + INTERVAL '2 days',
        usuario_pabellon_id,
        NOW(),
        NOW()
    FROM public.operating_rooms or2
    WHERE or2.nombre = 'Pabellón 2' AND or2.deleted_at IS NULL
    ON CONFLICT DO NOTHING;
    
    -- Bloqueo 3: Pabellón 3 bloqueado en 4 días de 10:00 a 12:00 (convenio específico)
    INSERT INTO public.schedule_blocks (
        doctor_id,
        operating_room_id,
        fecha,
        hora_inicio,
        hora_fin,
        motivo,
        vigencia_hasta,
        created_by,
        created_at,
        updated_at
    )
    SELECT 
        NULL,
        or3.id,
        CURRENT_DATE + INTERVAL '4 days',
        '10:00:00',
        '12:00:00',
        'Reservado para convenio',
        NULL,
        usuario_pabellon_id,
        NOW(),
        NOW()
    FROM public.operating_rooms or3
    WHERE or3.nombre = 'Pabellón 3' AND or3.deleted_at IS NULL
    ON CONFLICT DO NOTHING;
    
    -- Bloqueo 4: Doctor 1 tiene bloqueo personal en Pabellón 1 en 6 días
    INSERT INTO public.schedule_blocks (
        doctor_id,
        operating_room_id,
        fecha,
        hora_inicio,
        hora_fin,
        motivo,
        vigencia_hasta,
        created_by,
        created_at,
        updated_at
    )
    SELECT 
        d.id,
        or1.id,
        CURRENT_DATE + INTERVAL '6 days',
        '09:00:00',
        '11:00:00',
        'Bloqueo personal del doctor',
        NULL,
        usuario_pabellon_id,
        NOW(),
        NOW()
    FROM public.doctors d
    JOIN public.operating_rooms or1 ON or1.nombre = 'Pabellón 1' AND or1.deleted_at IS NULL
    WHERE d.email = 'doctor1@clinica.com' AND d.deleted_at IS NULL
    ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- CONSULTAS DE VERIFICACIÓN
-- =====================================================

-- Ver doctores creados
SELECT 
    d.id,
    d.nombre || ' ' || d.apellido as nombre_completo,
    d.email,
    d.especialidad,
    d.estado,
    u.email as email_usuario
FROM public.doctors d
LEFT JOIN public.users u ON d.user_id = u.id
WHERE d.email IN ('doctor1@clinica.com', 'doctor2@clinica.com', 'doctor3@clinica.com')
AND d.deleted_at IS NULL
ORDER BY d.nombre;

-- Ver pacientes creados
SELECT 
    p.id,
    p.nombre || ' ' || p.apellido as nombre_completo,
    p.rut,
    d.nombre || ' ' || d.apellido as doctor
FROM public.patients p
JOIN public.doctors d ON p.doctor_id = d.id
WHERE d.email IN ('doctor1@clinica.com', 'doctor2@clinica.com', 'doctor3@clinica.com')
AND p.deleted_at IS NULL
ORDER BY d.nombre, p.nombre;

-- Ver cirugías programadas
SELECT 
    s.id,
    s.fecha,
    s.hora_inicio,
    s.hora_fin,
    d.nombre || ' ' || d.apellido as doctor,
    p.nombre || ' ' || p.apellido as paciente,
    pab.nombre as pabellon,
    s.estado
FROM public.surgeries s
JOIN public.doctors d ON s.doctor_id = d.id
JOIN public.patients p ON s.patient_id = p.id
JOIN public.operating_rooms pab ON s.operating_room_id = pab.id
WHERE s.deleted_at IS NULL
ORDER BY s.fecha, s.hora_inicio;

-- Ver bloqueos de horario
SELECT 
    sb.id,
    sb.fecha,
    sb.hora_inicio,
    sb.hora_fin,
    COALESCE(d.nombre || ' ' || d.apellido, 'Sin doctor asignado') as doctor,
    pab.nombre as pabellon,
    sb.motivo,
    sb.vigencia_hasta
FROM public.schedule_blocks sb
JOIN public.operating_rooms pab ON sb.operating_room_id = pab.id
LEFT JOIN public.doctors d ON sb.doctor_id = d.id
WHERE sb.deleted_at IS NULL
ORDER BY sb.fecha, sb.hora_inicio;
