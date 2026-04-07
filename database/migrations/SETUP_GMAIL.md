# Configuración Gmail API para poll-gmail

## Objetivo
Conectar pabellontest@gmail.com a Supabase para que los correos entrantes aparezcan automáticamente en la bandeja de Correos del sistema.

---

## Paso 1: Crear proyecto en Google Cloud Console

1. Ve a https://console.cloud.google.com
2. Crear proyecto nuevo (ej: "SurgicalHUB")
3. En el menú: **APIs y Servicios → Biblioteca**
4. Buscar **Gmail API** → Habilitar

---

## Paso 2: Configurar pantalla de consentimiento OAuth

1. **APIs y Servicios → Pantalla de consentimiento OAuth**
2. Tipo de usuario: **Externo**
3. Llenar nombre de la app: "SurgicalHUB"
4. Correo soporte: pabellontest@gmail.com
5. En **Usuarios de prueba** → agregar: pabellontest@gmail.com
6. Guardar

---

## Paso 3: Crear credenciales OAuth2

1. **APIs y Servicios → Credenciales → Crear credenciales → ID de cliente OAuth 2.0**
2. Tipo de aplicación: **Aplicación web**
3. En "URI de redireccionamiento autorizados" agregar:
   ```
   https://developers.google.com/oauthplayground
   ```
4. Guardar → copiar **Client ID** y **Client Secret**

---

## Paso 4: Obtener Refresh Token con OAuth Playground

1. Ve a https://developers.google.com/oauthplayground
2. Clic en el ícono de configuración (⚙️ arriba a la derecha)
3. Marcar **"Use your own OAuth credentials"**
4. Pegar tu **Client ID** y **Client Secret**
5. En el panel izquierdo buscar **Gmail API v1** → seleccionar:
   - `https://www.googleapis.com/auth/gmail.modify`
6. Clic **Authorize APIs** → iniciar sesión con pabellontest@gmail.com
7. Clic **Exchange authorization code for tokens**
8. Copiar el **Refresh token** que aparece

---

## Paso 5: Agregar Secrets en Supabase

1. Ve a **Supabase Dashboard → Edge Functions → Secrets (Manage secrets)**
2. Agregar los siguientes secrets:

| Nombre | Valor |
|--------|-------|
| `GMAIL_CLIENT_ID` | El Client ID del Paso 3 |
| `GMAIL_CLIENT_SECRET` | El Client Secret del Paso 3 |
| `GMAIL_REFRESH_TOKEN` | El Refresh Token del Paso 4 |

---

## Paso 6: Desplegar la Edge Function

Desde la terminal (con Supabase CLI instalado):

```bash
supabase functions deploy poll-gmail --project-ref TU_PROJECT_REF
```

O desde el Dashboard: **Edge Functions → New Function** → pegar el código.

---

## Paso 7: Ejecutar las migraciones SQL

En Supabase SQL Editor, ejecutar en orden:
1. `add_external_messages.sql`
2. `add_gmail_message_id.sql`

---

## Paso 8: Programar el cron cada 5 minutos

En Supabase SQL Editor:

```sql
-- Habilitar extensión si no está activa
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Crear el cron job (reemplazar los valores entre < >)
SELECT cron.schedule(
  'poll-gmail-cada-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := '<TU_SUPABASE_URL>/functions/v1/poll-gmail',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <TU_SUPABASE_ANON_KEY>'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

Donde:
- `TU_SUPABASE_URL` = Settings → API → Project URL
- `TU_SUPABASE_ANON_KEY` = Settings → API → anon public key

---

## Resultado

Una vez configurado:
- Cada 5 minutos la función revisa pabellontest@gmail.com
- Los correos no leídos aparecen en la bandeja **Correos** del sistema
- Se extrae automáticamente: nombre paciente, RUT, tipo de cirugía, fecha solicitada, teléfono, urgencia
- Los correos ya procesados se marcan como leídos en Gmail para no duplicarse
- La columna `fuente` indica si llegó por `gmail` o por el formulario web (`formulario`)
