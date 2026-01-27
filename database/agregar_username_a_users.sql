-- =====================================================
-- AGREGAR CAMPO USERNAME A LA TABLA USERS
-- Permite login con username o email
-- =====================================================

-- Agregar columna username a la tabla users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT NULL;

-- Crear índice único para username (solo para usuarios con username)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username 
ON public.users(username) 
WHERE username IS NOT NULL AND deleted_at IS NULL;

-- Agregar comentario
COMMENT ON COLUMN public.users.username IS 'Nombre de usuario para login alternativo al email';
