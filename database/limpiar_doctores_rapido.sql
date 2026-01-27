-- =====================================================
-- LIMPIEZA RÁPIDA: Eliminar todos los doctores
-- ⚠️ ADVERTENCIA: Operación IRREVERSIBLE
-- =====================================================

-- Eliminar en orden (respetando foreign keys)
DELETE FROM public.surgery_supplies;
DELETE FROM public.surgeries;
DELETE FROM public.surgery_request_supplies;
DELETE FROM public.surgery_requests;
DELETE FROM public.patients;
DELETE FROM public.schedule_blocks WHERE doctor_id IS NOT NULL;
DELETE FROM public.reminders WHERE user_id IN (SELECT id FROM public.users WHERE role = 'doctor');
DELETE FROM public.notifications WHERE user_id IN (SELECT id FROM public.users WHERE role = 'doctor');
DELETE FROM public.doctors;
DELETE FROM public.users WHERE role = 'doctor';

-- Verificar que quedó en 0
SELECT 
    COUNT(*) as doctores_restantes,
    (SELECT COUNT(*) FROM public.patients) as pacientes_restantes,
    (SELECT COUNT(*) FROM public.surgery_requests) as solicitudes_restantes,
    (SELECT COUNT(*) FROM public.surgeries) as cirugias_restantes
FROM public.doctors;
