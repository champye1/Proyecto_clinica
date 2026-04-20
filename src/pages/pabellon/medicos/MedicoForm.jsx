import { Globe, Key, Eye, EyeOff } from 'lucide-react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { sanitizeString, sanitizeEmail, sanitizeCode, sanitizeRut, sanitizePassword } from '@/utils/sanitizeInput'
import { formatRut } from '@/utils/rutFormatter'

const ESPECIALIDADES = [
  'cirugia_general','cirugia_cardiovascular','cirugia_plastica','cirugia_ortopedica',
  'neurocirugia','cirugia_oncologica','urologia','ginecologia','otorrinolaringologia','oftalmologia','otra'
]

const S = {
  formTitle:          'text-xl font-bold mb-4',
  formBody:           'space-y-4',
  formGrid2:          'grid grid-cols-2 gap-4',
  formLabel:          'label-field',
  formLabelSm:        'label-field text-xs font-bold text-gray-600 uppercase',
  formInput:          'input-field',
  formInputError:     'input-field border-red-500',
  formError:          'text-xs text-red-600 mt-1',
  formPasswordHint:   'text-xs text-gray-500 mt-1',
  accessSection:      'border-2 border-blue-200 rounded-2xl p-4 bg-blue-50/30',
  accessHeader:       'flex items-center gap-2 mb-4',
  accessCheckbox:     'w-4 h-4',
  accessLabel:        'text-sm font-bold text-gray-700',
  accessFields:       'space-y-4 mt-4',
  passwordWrap:       'relative',
  passwordInput:      'input-field pr-12',
  passwordInputError: 'input-field pr-12 border-red-500',
  passwordBtns:       'absolute right-3 top-1/2 -translate-y-1/2 flex gap-2',
  passwordGenBtn:     'p-1 text-blue-600 hover:text-blue-800 transition-colors',
  passwordToggleBtn:  'p-1 text-gray-600 hover:text-gray-800 transition-colors',
  formFooter:         'flex gap-2',
  loadingRow:         'flex items-center gap-2',
  iconSm:             'w-4 h-4',
  globeIcon:          'w-5 h-5 text-blue-600',
}

export default function MedicoForm({
  formData, setFormData, medicoEditando,
  fieldErrors, touchedFields, handleFieldChange, handleFieldBlur,
  showPassword, setShowPassword,
  generarPassword, generarUsername,
  handleSubmit, onCancel,
  crearPending, actualizarPending,
}) {
  return (
    <div className="card">
      <h2 className={S.formTitle}>{medicoEditando ? 'Editar Médico' : 'Nuevo Médico'}</h2>
      <form onSubmit={handleSubmit} className={S.formBody}>
        <div className={S.formGrid2}>
          <div>
            <label className={S.formLabel}>Nombre *</label>
            <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: sanitizeString(e.target.value) })} className={S.formInput} required />
          </div>
          <div>
            <label className={S.formLabel}>Apellido *</label>
            <input type="text" value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: sanitizeString(e.target.value) })} className={S.formInput} required />
          </div>
        </div>

        <div className={S.formGrid2}>
          <div>
            <label className={S.formLabel}>RUT *</label>
            <input
              type="text"
              value={formData.rut}
              onChange={(e) => { const sanitized = sanitizeRut(e.target.value); handleFieldChange('rut', formatRut(sanitized)) }}
              onBlur={() => handleFieldBlur('rut')}
              className={fieldErrors.rut ? S.formInputError : S.formInput}
              placeholder="12.345.678-9"
              required
              maxLength={12}
            />
            {fieldErrors.rut && touchedFields.rut && <p className={S.formError}>{fieldErrors.rut}</p>}
          </div>
          <div>
            <label className={S.formLabel}>Correo *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', sanitizeEmail(e.target.value))}
              onBlur={() => handleFieldBlur('email')}
              className={fieldErrors.email ? S.formInputError : S.formInput}
              required
              disabled={!!medicoEditando}
            />
            {fieldErrors.email && touchedFields.email && <p className={S.formError}>{fieldErrors.email}</p>}
          </div>
        </div>

        <div className={S.formGrid2}>
          <div>
            <label className={S.formLabel}>Teléfono WhatsApp</label>
            <input type="tel" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: sanitizeString(e.target.value) })} className={S.formInput} placeholder="+56912345678" />
          </div>
          <div />
        </div>

        <div className={S.formGrid2}>
          <div>
            <label className={S.formLabel}>Especialidad *</label>
            <select value={formData.especialidad} onChange={(e) => setFormData({ ...formData, especialidad: sanitizeString(e.target.value) })} className={S.formInput} required>
              <option value="">Seleccionar...</option>
              {ESPECIALIDADES.map(esp => <option key={esp} value={esp}>{esp.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className={S.formLabel}>Estado *</label>
            <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: sanitizeString(e.target.value) })} className={S.formInput} required>
              <option value="activo">Activo</option>
              <option value="vacaciones">Vacaciones</option>
            </select>
          </div>
        </div>

        <div className={S.accessSection}>
          <div className={S.accessHeader}>
            <Globe className={S.globeIcon} />
            <input
              type="checkbox"
              id="acceso_web"
              checked={formData.acceso_web_enabled}
              onChange={(e) => {
                const enabled = e.target.checked
                const nuevoUsername = enabled ? generarUsername(formData.nombre, formData.apellido) : ''
                setFormData({ ...formData, acceso_web_enabled: enabled, username: enabled ? nuevoUsername : formData.username, password: enabled && !formData.password ? generarPassword() : (enabled ? formData.password : '') })
              }}
              className={S.accessCheckbox}
            />
            <label htmlFor="acceso_web" className={S.accessLabel}>HABILITAR ACCESO WEB</label>
          </div>

          {formData.acceso_web_enabled && (
            <div className={S.accessFields}>
              <div>
                <label className={S.formLabelSm}>Nombre de Usuario</label>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: sanitizeCode(e.target.value.toLowerCase()) })} className={S.formInput} placeholder="Ej: esteban" required={formData.acceso_web_enabled} />
              </div>
              <div>
                <label className={S.formLabelSm}>Contraseña</label>
                <div className={S.passwordWrap}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleFieldChange('password', sanitizePassword(e.target.value))}
                    onBlur={() => handleFieldBlur('password')}
                    className={fieldErrors.password ? S.passwordInputError : S.passwordInput}
                    placeholder="Ingrese contraseña o use la generada"
                    required={formData.acceso_web_enabled}
                  />
                  {fieldErrors.password && touchedFields.password && <p className={S.formError}>{fieldErrors.password}</p>}
                  <div className={S.passwordBtns}>
                    <button type="button" onClick={() => setFormData({ ...formData, password: generarPassword() })} className={S.passwordGenBtn} title="Generar contraseña aleatoria">
                      <Key className={S.iconSm} />
                    </button>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={S.passwordToggleBtn} title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      {showPassword ? <EyeOff className={S.iconSm} /> : <Eye className={S.iconSm} />}
                    </button>
                  </div>
                </div>
                {formData.password && <p className={S.formPasswordHint}>Contraseña generada. El usuario podrá cambiarla al primer inicio de sesión.</p>}
              </div>
            </div>
          )}
        </div>

        <div className={S.formFooter}>
          <button type="submit" className="btn-primary" disabled={crearPending || actualizarPending}>
            {crearPending || actualizarPending
              ? <span className={S.loadingRow}><LoadingSpinner size="sm" />{medicoEditando ? 'Actualizando...' : 'Creando...'}</span>
              : medicoEditando ? 'Actualizar' : 'Crear'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={crearPending || actualizarPending}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
