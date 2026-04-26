import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// =====================================================
// EDGE FUNCTION: send-email
// Envía emails transaccionales usando Resend.
//
// Secrets requeridos en Supabase Dashboard:
//   RESEND_API_KEY  → tu API key de https://resend.com
//
// Tipos de email soportados (campo "type"):
//   solicitud_recibida   → al pabellón cuando doctor crea solicitud
//   solicitud_aceptada   → al doctor cuando pabellón acepta
//   solicitud_rechazada  → al doctor cuando pabellón rechaza
//   cirugia_programada   → al doctor cuando se agenda la cirugía
//   cirugia_cancelada    → al doctor cuando se cancela la cirugía
//   reagendamiento       → al doctor cuando se requiere reagendar
// =====================================================

const RESEND_API = "https://api.resend.com/emails"
const FROM       = "SurgicalHUB <notificaciones@surgicalhub.cl>"

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map(s => s.trim()).filter(Boolean)

function getCors(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? null
  return {
    "Access-Control-Allow-Origin": allowedOrigin ?? "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  }
}

function jsonResponse(body: Record<string, unknown>, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    headers: { ...cors, "Content-Type": "application/json" },
    status,
  })
}

// ── Plantillas de email ───────────────────────────────────────

interface EmailData {
  doctorNombre?: string
  pacienteNombre?: string
  fecha?: string
  horaInicio?: string
  horaFin?: string
  pabellon?: string
  motivoRechazo?: string
  clinicaNombre?: string
}

function buildEmail(type: string, data: EmailData): { subject: string; html: string } | null {
  const clinic = data.clinicaNombre ?? "SurgicalHUB"
  const base = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;">
      <div style="background:#1e40af;padding:32px 40px;">
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">
          ${clinic}
        </h1>
        <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Sistema de Gestión Quirúrgica</p>
      </div>
      <div style="padding:32px 40px;background:#fff;">
        BODY_PLACEHOLDER
      </div>
      <div style="padding:20px 40px;background:#f1f5f9;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:12px;">
          Este es un mensaje automático de ${clinic}. No responder a este correo.
        </p>
      </div>
    </div>
  `

  const wrap = (body: string) => base.replace("BODY_PLACEHOLDER", body)

  const info = (label: string, value: string) =>
    `<tr>
      <td style="padding:6px 0;color:#64748b;font-size:13px;width:130px;">${label}</td>
      <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:700;">${value ?? "—"}</td>
    </tr>`

  switch (type) {
    case "solicitud_recibida":
      return {
        subject: `Nueva solicitud quirúrgica — ${data.pacienteNombre}`,
        html: wrap(`
          <h2 style="margin:0 0 8px;color:#0f172a;font-size:18px;font-weight:900;">Nueva solicitud recibida</h2>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;">El Dr. ${data.doctorNombre} ha enviado una solicitud de pabellón.</p>
          <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;padding:16px;" cellpadding="0" cellspacing="0">
            ${info("Paciente", data.pacienteNombre ?? "")}
            ${info("Fecha solicitada", data.fecha ?? "")}
            ${info("Hora preferida", data.horaInicio ? `${data.horaInicio} – ${data.horaFin}` : "Sin preferencia")}
          </table>
          <p style="margin:24px 0 0;color:#475569;font-size:13px;">Ingresa al sistema para revisar y gestionar esta solicitud.</p>
        `),
      }

    case "solicitud_aceptada":
      return {
        subject: `✅ Solicitud aceptada — ${data.pacienteNombre}`,
        html: wrap(`
          <h2 style="margin:0 0 8px;color:#15803d;font-size:18px;font-weight:900;">Solicitud aceptada</h2>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;">Pabellón aceptó el horario propuesto. Su cirugía ha sido programada.</p>
          <table style="width:100%;border-collapse:collapse;background:#f0fdf4;border-radius:12px;padding:16px;" cellpadding="0" cellspacing="0">
            ${info("Paciente", data.pacienteNombre ?? "")}
            ${info("Fecha", data.fecha ?? "")}
            ${info("Hora", data.horaInicio ? `${data.horaInicio} – ${data.horaFin}` : "—")}
            ${info("Pabellón", data.pabellon ?? "")}
          </table>
          <p style="margin:24px 0 0;color:#475569;font-size:13px;">Recuerda confirmar la preparación del paciente con anticipación.</p>
        `),
      }

    case "solicitud_rechazada":
      return {
        subject: `❌ Solicitud rechazada — ${data.pacienteNombre}`,
        html: wrap(`
          <h2 style="margin:0 0 8px;color:#dc2626;font-size:18px;font-weight:900;">Solicitud rechazada</h2>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;">Pabellón no pudo aceptar su solicitud de pabellón.</p>
          <table style="width:100%;border-collapse:collapse;background:#fef2f2;border-radius:12px;padding:16px;" cellpadding="0" cellspacing="0">
            ${info("Paciente", data.pacienteNombre ?? "")}
            ${info("Fecha solicitada", data.fecha ?? "")}
            ${data.motivoRechazo ? info("Motivo", data.motivoRechazo) : ""}
          </table>
          <p style="margin:24px 0 0;color:#475569;font-size:13px;">Puede enviar una nueva solicitud con fechas alternativas.</p>
        `),
      }

    case "cirugia_programada":
      return {
        subject: `📅 Cirugía programada — ${data.pacienteNombre} | ${data.fecha}`,
        html: wrap(`
          <h2 style="margin:0 0 8px;color:#1e40af;font-size:18px;font-weight:900;">Cirugía programada</h2>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;">Su cirugía fue agendada exitosamente en el sistema.</p>
          <table style="width:100%;border-collapse:collapse;background:#eff6ff;border-radius:12px;padding:16px;" cellpadding="0" cellspacing="0">
            ${info("Paciente", data.pacienteNombre ?? "")}
            ${info("Fecha", data.fecha ?? "")}
            ${info("Hora", data.horaInicio ? `${data.horaInicio} – ${data.horaFin}` : "—")}
            ${info("Pabellón", data.pabellon ?? "")}
          </table>
        `),
      }

    case "cirugia_cancelada":
      return {
        subject: `🚫 Cirugía cancelada — ${data.pacienteNombre}`,
        html: wrap(`
          <h2 style="margin:0 0 8px;color:#dc2626;font-size:18px;font-weight:900;">Cirugía cancelada</h2>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;">La siguiente cirugía fue cancelada en el sistema.</p>
          <table style="width:100%;border-collapse:collapse;background:#fef2f2;border-radius:12px;padding:16px;" cellpadding="0" cellspacing="0">
            ${info("Paciente", data.pacienteNombre ?? "")}
            ${info("Fecha", data.fecha ?? "")}
            ${info("Hora", data.horaInicio ? `${data.horaInicio} – ${data.horaFin}` : "—")}
            ${data.motivoRechazo ? info("Motivo", data.motivoRechazo) : ""}
          </table>
        `),
      }

    case "reagendamiento":
      return {
        subject: `🔄 Reagendamiento requerido — ${data.pacienteNombre}`,
        html: wrap(`
          <h2 style="margin:0 0 8px;color:#d97706;font-size:18px;font-weight:900;">Reagendamiento requerido</h2>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;">Pabellón no pudo aceptar el horario propuesto. Se requiere seleccionar una nueva fecha.</p>
          <table style="width:100%;border-collapse:collapse;background:#fffbeb;border-radius:12px;padding:16px;" cellpadding="0" cellspacing="0">
            ${info("Paciente", data.pacienteNombre ?? "")}
            ${info("Fecha solicitada", data.fecha ?? "")}
          </table>
          <p style="margin:24px 0 0;color:#475569;font-size:13px;">Ingrese al sistema para proponer una nueva fecha.</p>
        `),
      }

    default:
      return null
  }
}

// ── Resolución de email por userId ────────────────────────────

async function resolveEmail(to: string | undefined, userId: string | undefined): Promise<string | null> {
  if (to) return to

  if (!userId) return null

  const supabaseUrl     = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  if (!supabaseUrl || !serviceRoleKey) return null

  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    headers: {
      "apikey":        serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
    },
  })

  if (!res.ok) return null
  const user = await res.json()
  return user?.email ?? null
}

// ── Handler principal ─────────────────────────────────────────

serve(async (req) => {
  const origin = req.headers.get("origin")
  const cors   = getCors(origin)

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (req.method !== "POST")    return jsonResponse({ success: false, error: "Método no permitido." }, 405, cors)

  try {
    const body = await req.json()
    const { to, userId, type, data } = body as {
      to?:     string
      userId?: string
      type:    string
      data:    EmailData
    }

    if (!type) {
      return jsonResponse({ success: false, error: "Falta campo requerido: type." }, 400, cors)
    }

    const recipientEmail = await resolveEmail(to, userId)
    if (!recipientEmail) {
      return jsonResponse({ success: false, error: "No se pudo determinar el email del destinatario." }, 400, cors)
    }

    const to_resolved = recipientEmail

    const email = buildEmail(type, data ?? {})
    if (!email) {
      return jsonResponse({ success: false, error: `Tipo de email desconocido: ${type}` }, 400, cors)
    }

    const apiKey = Deno.env.get("RESEND_API_KEY")
    if (!apiKey) {
      return jsonResponse({ success: false, error: "RESEND_API_KEY no configurado." }, 500, cors)
    }

    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from:    FROM,
        to:      [to_resolved],
        subject: email.subject,
        html:    email.html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[send-email] Resend error:", err)
      return jsonResponse({ success: false, error: "Error al enviar email." }, 502, cors)
    }

    const resData = await res.json()
    return jsonResponse({ success: true, id: resData.id }, 200, cors)

  } catch (err) {
    console.error("[send-email] Unexpected error:", err)
    return jsonResponse({ success: false, error: "Error interno." }, 500, cors)
  }
})
