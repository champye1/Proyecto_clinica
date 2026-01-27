import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, Building2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { testSupabaseConnection } from '../../utils/testSupabase'

export default function Inicio() {
  const navigate = useNavigate()
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      const result = await testSupabaseConnection()
      setConnectionStatus(result)
      setChecking(false)
    }
    checkConnection()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="max-w-4xl w-full mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="bg-blue-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl shadow-blue-200 rotate-6">
                <Stethoscope className="text-white w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2 px-4">
            Sistema Clínico Quirúrgico
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 font-bold px-4">Clínica Privada Viña del Mar</p>
          <p className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mt-2 px-4">Selecciona tu tipo de acceso</p>
        </div>

        {/* Estado de conexión */}
        {checking ? (
          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm mb-4 sm:mb-6">
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-slate-600">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-600"></div>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Verificando conexión...</span>
            </div>
          </div>
        ) : connectionStatus && !connectionStatus.connected ? (
          <div className="bg-yellow-50 border-yellow-200 border-2 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-yellow-800 text-xs sm:text-sm uppercase tracking-tighter mb-2">⚠️ Supabase no configurado</h3>
                <p className="text-[10px] sm:text-xs text-yellow-700 mb-3 sm:mb-4 font-bold break-words">
                  {connectionStatus.error}
                </p>
                <div className="text-[9px] sm:text-[10px] text-yellow-600 space-y-2 font-bold uppercase tracking-wider">
                  <p className="font-black">Para conectar:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Crea un proyecto en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                    <li>Ve a Settings → API</li>
                    <li>Copia tu Project URL y anon key</li>
                    <li>Edita el archivo <code className="bg-yellow-100 px-1 rounded">.env</code></li>
                    <li>Reemplaza los valores de ejemplo</li>
                    <li>Reinicia el servidor</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border-green-200 border-2 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="font-black text-green-800 text-xs sm:text-sm uppercase tracking-tighter">✅ Conectado a Supabase</h3>
                <p className="text-[10px] sm:text-xs text-green-700 font-bold mt-1">La conexión con la base de datos está activa</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Login Pabellón */}
          <div
            onClick={() => navigate('/login/pabellon')}
            className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] border-2 border-slate-100 shadow-xl cursor-pointer hover:shadow-2xl hover:border-blue-400 transition-all duration-300 active:scale-[0.98] group touch-manipulation"
          >
            <div className="text-center">
              <div className="bg-blue-100 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center group-hover:bg-blue-200 transition-colors shadow-lg shadow-blue-100">
                <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 sm:mb-3">Acceso Pabellón</h2>
              <p className="text-slate-600 mb-6 sm:mb-8 font-bold text-xs sm:text-sm px-2">
                Panel administrativo para gestión de cirugías, médicos e insumos
              </p>
              <div className="space-y-2 sm:space-y-3 text-[10px] sm:text-xs text-slate-500 mb-6 sm:mb-8 font-bold">
                <p className="flex items-center justify-center gap-2"><span className="text-green-500">✓</span> Gestión de solicitudes</p>
                <p className="flex items-center justify-center gap-2"><span className="text-green-500">✓</span> Programación de cirugías</p>
                <p className="flex items-center justify-center gap-2"><span className="text-green-500">✓</span> Administración de médicos</p>
                <p className="flex items-center justify-center gap-2"><span className="text-green-500">✓</span> Control de insumos</p>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-200 transition-all active:scale-95 touch-manipulation">
                Ingresar como Pabellón
              </button>
            </div>
          </div>

          {/* Login Doctor */}
          <div
            onClick={() => navigate('/login/doctor')}
            className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] border-2 border-slate-100 shadow-xl cursor-pointer hover:shadow-2xl hover:border-green-400 transition-all duration-300 active:scale-[0.98] group touch-manipulation"
          >
            <div className="text-center">
              <div className="bg-green-100 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center group-hover:bg-green-200 transition-colors shadow-lg shadow-green-100">
                <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 sm:mb-3">Acceso Doctor</h2>
              <p className="text-slate-600 mb-6 sm:mb-8 font-bold text-xs sm:text-sm px-2">
                Panel médico para gestión de pacientes y solicitudes quirúrgicas
              </p>
              <div className="space-y-2 sm:space-y-3 text-[10px] sm:text-xs text-slate-500 mb-6 sm:mb-8 font-bold">
                <p className="flex items-center justify-center gap-2"><span className="text-green-500">✓</span> Crear fichas de pacientes</p>
                <p className="flex items-center justify-center gap-2"><span className="text-green-500">✓</span> Solicitar cirugías</p>
                <p className="flex items-center justify-center gap-2"><span className="text-green-500">✓</span> Ver calendario personal</p>
                <p className="flex items-center justify-center gap-2"><span className="text-green-500">✓</span> Consultar estado de solicitudes</p>
              </div>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-xl shadow-green-200 transition-all active:scale-95 touch-manipulation">
                Ingresar como Doctor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
