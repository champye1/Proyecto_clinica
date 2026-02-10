-- Trigger para auditar cambios en la tabla doctors
CREATE TRIGGER audit_doctors
    AFTER INSERT OR UPDATE OR DELETE ON public.doctors
    FOR EACH ROW
    EXECUTE FUNCTION registrar_auditoria();

-- Trigger para auditar cambios en la tabla users (si no existe)
DROP TRIGGER IF EXISTS audit_users ON public.users;
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION registrar_auditoria();
