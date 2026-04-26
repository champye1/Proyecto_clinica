import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'

const SECTION = 'mb-8'
const H2 = 'text-xl font-bold text-slate-900 mb-3'
const P = 'text-slate-600 leading-relaxed mb-3'
const LI = 'text-slate-600 leading-relaxed'
const UL = 'list-disc list-inside space-y-1 mb-3 ml-2'

export default function Privacidad() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Política de Privacidad</h1>
            <p className="text-sm text-slate-500">SurgicalHUB · Última actualización: abril 2026</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-0">

          {/* Intro */}
          <div className={SECTION}>
            <p className={P}>
              Esta Política de Privacidad describe cómo <strong>SurgicalHUB</strong> (en adelante "nosotros",
              "la plataforma") recopila, usa, almacena y protege sus datos personales, en conformidad con la{' '}
              <strong>Ley N° 21.719 de Protección de Datos Personales</strong> de Chile, la{' '}
              <strong>Ley N° 20.584</strong> sobre derechos y deberes de los pacientes, y demás normativa aplicable.
            </p>
            <p className={P}>
              Al registrarse y usar SurgicalHUB, usted acepta los términos descritos en esta política.
            </p>
          </div>

          {/* 1. Responsable */}
          <div className={SECTION}>
            <h2 className={H2}>1. Responsable del tratamiento</h2>
            <p className={P}>
              El responsable del tratamiento de los datos personales es la clínica u organización que contrate
              la plataforma SurgicalHUB ("la Clínica"). El operador técnico es <strong>SurgicalHUB SpA</strong>,
              quien actúa como encargado del tratamiento en nombre de cada clínica suscrita.
            </p>
            <p className={P}>
              Para ejercer sus derechos o contactar al responsable, escriba a:{' '}
              <strong>privacidad@surgicalhub.cl</strong>
            </p>
          </div>

          {/* 2. Datos que recopilamos */}
          <div className={SECTION}>
            <h2 className={H2}>2. Datos personales que recopilamos</h2>
            <p className={P}>Recopilamos los siguientes datos según el tipo de usuario:</p>

            <p className="text-sm font-semibold text-slate-700 mb-1">Administradores y personal de pabellón:</p>
            <ul className={UL}>
              <li className={LI}>Nombre completo, correo electrónico, teléfono</li>
              <li className={LI}>Datos de acceso (nombre de usuario, contraseña cifrada)</li>
              <li className={LI}>Registros de actividad en el sistema (auditoría)</li>
            </ul>

            <p className="text-sm font-semibold text-slate-700 mb-1">Médicos:</p>
            <ul className={UL}>
              <li className={LI}>Nombre completo, RUT, correo electrónico, teléfono</li>
              <li className={LI}>Especialidad médica y datos profesionales</li>
              <li className={LI}>Historial de solicitudes quirúrgicas y cirugías realizadas</li>
            </ul>

            <p className="text-sm font-semibold text-slate-700 mb-1">Pacientes:</p>
            <ul className={UL}>
              <li className={LI}>Nombre completo, RUT, fecha de nacimiento, correo, teléfono</li>
              <li className={LI}>Datos de salud: diagnóstico, tipo de cirugía, insumos utilizados</li>
              <li className={LI}>Historial de procedimientos quirúrgicos</li>
            </ul>
          </div>

          {/* 3. Finalidad */}
          <div className={SECTION}>
            <h2 className={H2}>3. Finalidad del tratamiento</h2>
            <p className={P}>Sus datos se utilizan exclusivamente para:</p>
            <ul className={UL}>
              <li className={LI}>Gestionar la agenda y programación quirúrgica de la clínica</li>
              <li className={LI}>Coordinar solicitudes entre médicos y personal de pabellón</li>
              <li className={LI}>Administrar inventario de insumos por intervención</li>
              <li className={LI}>Enviar notificaciones operativas relacionadas con cirugías</li>
              <li className={LI}>Cumplir con obligaciones legales (registros clínicos, auditoría)</li>
              <li className={LI}>Generar estadísticas anónimas de uso para mejorar la plataforma</li>
            </ul>
            <p className={P}>
              <strong>No vendemos ni cedemos sus datos a terceros</strong> con fines comerciales o publicitarios.
            </p>
          </div>

          {/* 4. Base legal */}
          <div className={SECTION}>
            <h2 className={H2}>4. Base legal del tratamiento</h2>
            <ul className={UL}>
              <li className={LI}><strong>Consentimiento explícito</strong> al momento del registro (art. 12, Ley 21.719)</li>
              <li className={LI}><strong>Ejecución de contrato</strong> de servicio entre la clínica y SurgicalHUB</li>
              <li className={LI}><strong>Obligación legal</strong> de conservar fichas clínicas según Ley 20.584 (mínimo 15 años)</li>
              <li className={LI}><strong>Interés legítimo</strong> en la seguridad del sistema y prevención de fraudes</li>
            </ul>
          </div>

          {/* 5. Retención */}
          <div className={SECTION}>
            <h2 className={H2}>5. Plazo de conservación de los datos</h2>
            <ul className={UL}>
              <li className={LI}><strong>Datos de pacientes y registros clínicos:</strong> mínimo 15 años (Ley 20.584)</li>
              <li className={LI}><strong>Cuentas de usuarios:</strong> mientras la cuenta esté activa + 3 años</li>
              <li className={LI}><strong>Logs de auditoría:</strong> 5 años desde su generación</li>
              <li className={LI}><strong>Notificaciones:</strong> 1 año</li>
            </ul>
            <p className={P}>
              Una vez vencidos estos plazos, los datos se eliminan o anonimizan de forma irreversible.
            </p>
          </div>

          {/* 6. Seguridad */}
          <div className={SECTION}>
            <h2 className={H2}>6. Seguridad de los datos</h2>
            <p className={P}>Implementamos las siguientes medidas técnicas y organizativas:</p>
            <ul className={UL}>
              <li className={LI}>Cifrado en tránsito mediante HTTPS/TLS</li>
              <li className={LI}>Control de acceso por roles (RLS) a nivel de base de datos</li>
              <li className={LI}>Autenticación con contraseñas seguras (mínimo 12 caracteres con complejidad)</li>
              <li className={LI}>Registro de auditoría de todas las operaciones críticas</li>
              <li className={LI}>Infraestructura en Supabase (ISO 27001, SOC 2) con centros de datos en la región</li>
              <li className={LI}>Acceso restringido al personal autorizado con principio de mínimo privilegio</li>
            </ul>
          </div>

          {/* 7. Derechos ARCO+ */}
          <div className={SECTION}>
            <h2 className={H2}>7. Sus derechos como titular de los datos</h2>
            <p className={P}>
              Conforme a la <strong>Ley 21.719</strong>, usted tiene derecho a:
            </p>
            <ul className={UL}>
              <li className={LI}><strong>Acceso:</strong> solicitar una copia de sus datos personales que tratamos</li>
              <li className={LI}><strong>Rectificación:</strong> corregir datos inexactos o incompletos</li>
              <li className={LI}><strong>Cancelación / Supresión:</strong> solicitar la eliminación de sus datos cuando procedan</li>
              <li className={LI}><strong>Oposición:</strong> oponerse a determinados tratamientos de sus datos</li>
              <li className={LI}><strong>Portabilidad:</strong> recibir sus datos en formato estructurado y de uso común</li>
              <li className={LI}><strong>Revocación del consentimiento:</strong> retirar su consentimiento en cualquier momento</li>
            </ul>
            <p className={P}>
              Para ejercer cualquiera de estos derechos, escriba a{' '}
              <strong>privacidad@surgicalhub.cl</strong> indicando su nombre, RUT y la solicitud específica.
              Responderemos en un plazo máximo de <strong>30 días hábiles</strong>.
            </p>
            <p className={P}>
              Si considera que su solicitud no fue atendida correctamente, puede presentar un reclamo ante el{' '}
              <strong>Consejo para la Transparencia (CPLT)</strong> en{' '}
              <a href="https://cplt.cl" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                cplt.cl
              </a>.
            </p>
          </div>

          {/* 8. Transferencias */}
          <div className={SECTION}>
            <h2 className={H2}>8. Transferencias internacionales de datos</h2>
            <p className={P}>
              Los datos se almacenan en servidores de Supabase ubicados en la región de AWS us-east-1
              (Estados Unidos). Supabase cuenta con certificaciones ISO 27001 y SOC 2 Tipo II.
              Esta transferencia se realiza bajo medidas contractuales adecuadas conforme al art. 25 de la Ley 21.719.
            </p>
          </div>

          {/* 9. Cookies */}
          <div className={SECTION}>
            <h2 className={H2}>9. Cookies y almacenamiento local</h2>
            <p className={P}>
              SurgicalHUB utiliza <strong>localStorage</strong> y <strong>sessionStorage</strong> del navegador
              exclusivamente para mantener la sesión activa y preferencias de interfaz. No utilizamos cookies
              de seguimiento ni de publicidad de terceros.
            </p>
          </div>

          {/* 10. Cambios */}
          <div className={SECTION}>
            <h2 className={H2}>10. Modificaciones a esta política</h2>
            <p className={P}>
              Podemos actualizar esta política periódicamente. Cuando realicemos cambios sustanciales,
              se lo notificaremos por correo electrónico o mediante un aviso en la plataforma con al menos
              15 días de anticipación.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-sm text-slate-500">
          <Link to="/" className="inline-flex items-center gap-1.5 hover:text-slate-700 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <span>© 2026 SurgicalHUB — Versión de política 1.0</span>
        </div>

      </div>
    </div>
  )
}
