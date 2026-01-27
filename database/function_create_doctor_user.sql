-- =====================================================
-- FUNCIÓN PARA CREAR USUARIO AUTOMÁTICAMENTE AL CREAR MÉDICO
-- =====================================================
-- 
-- Esta función se ejecutará automáticamente cuando se inserte un médico
-- y creará el usuario en Auth y en la tabla users

-- NOTA: Esta función requiere permisos especiales de Supabase
-- En producción, es mejor usar una Edge Function

-- Crear función que será llamada desde el frontend o un trigger
CREATE OR REPLACE FUNCTION public.create_doctor_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Esta función se puede llamar manualmente después de crear el médico
  -- O se puede usar un trigger (pero requiere configuración adicional)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Para crear el usuario automáticamente, mejor usar Edge Function
-- Ver: supabase/functions/create-doctor/index.ts
