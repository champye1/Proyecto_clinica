import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Stethoscope, ArrowLeft } from 'lucide-react'
import { sanitizeEmail } from '../../utils/sanitizeInput'
import { resolveUsernameToEmail, sendPasswordResetEmail } from '../../services/authService'

export default function RecuperarContraseña() {
  const [emailOrUser, setEmailOrUser] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      let emailToUse = emailOrUser.toLowerCase().trim()
      if (!emailToUse) {
        setError('Ingresa tu correo o nombre de usuario.')
        return
      }

      // Si no es un email, intentar resolver username -> email (doctores)
      if (!emailToUse.includes('@')) {
        const { email: resolved, error: rpcError } = await resolveUsernameToEmail(emailToUse)
        if (rpcError || !resolved) {
          setError('No encontramos una cuenta de doctor con ese usuario. Usa tu correo electrónico.')
          return
        }
        emailToUse = resolved
      }

      const { error: resetError } = await sendPasswordResetEmail(emailToUse)
      if (resetError) {
        setError(resetError.message || 'Error al enviar el correo. Intenta de nuevo.')
        return
      }
      setSent(true)
    } catch (err) {
      setError(err.message || 'Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6">
        <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl shadow-green-200 rotate-6">
              <Stethoscope className="text-white w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">
            Revisa tu correo
          </h1>
          <p className="text-slate-600 text-sm mb-6">
            Te enviamos un enlace para restablecer tu contraseña. Revisa la bandeja de entrada y la carpeta de spam.
          </p>
          <p className="text-slate-500 text-xs mb-8">
            El enlace vence en 1 hora. Si no llega, vuelve a solicitarlo.
          </p>
          <Link
            to="/login/doctor"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
        <button
          onClick={() => navigate('/login/doctor')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-bold text-[10px] sm:text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          Volver al login
        </button>

        <div className="flex justify-center mb-6">
          <div className="bg-green-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl shadow-green-200 rotate-6">
            <Stethoscope className="text-white w-6 h-6 sm:w-8 sm:h-8" />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Recuperar contraseña
          </h1>
          <p className="text-slate-500 text-xs mt-2">
            Portal médico – te enviaremos un enlace a tu correo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Correo o usuario
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input
                id="email"
                type="text"
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(sanitizeEmail(e.target.value))}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl py-3 pl-10 pr-4 focus:border-green-500 focus:bg-white outline-none font-bold text-sm text-slate-700"
                placeholder="evenegas o doctor@clinica.cl"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>
      </div>
    </div>
  )
}
