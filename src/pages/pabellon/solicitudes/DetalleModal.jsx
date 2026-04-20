import { Clock, Stethoscope, Package, FileText, User, X } from 'lucide-react'
import { format } from 'date-fns'
import { codigosOperaciones } from '@/data/codigosOperaciones'
import { STYLES } from './solicitudes.styles'

export default function DetalleModal({ solicitudDetalle, isDark, isMedical, onClose, getEstadoBadge }) {
  if (!solicitudDetalle) return null

  return (
    <div className={STYLES.detailOverlay}>
      <div className={isDark ? STYLES.detailBoxDark : STYLES.detailBoxLight}>
        <div className={STYLES.detailHeaderRow}>
          <h2 className={isDark ? STYLES.detailTitleDark : STYLES.detailTitleLight}>Detalles de la Solicitud</h2>
          <button onClick={onClose} className={isDark ? STYLES.detailCloseDark : STYLES.detailCloseLight}>
            <X className={isDark ? STYLES.detailCloseIconDark : STYLES.detailCloseIconLight} />
          </button>
        </div>

        <div className={STYLES.detailSections}>
          <div className={isDark ? STYLES.patientSectionDark : isMedical ? STYLES.patientSectionMed : STYLES.patientSectionLight}>
            <div className={STYLES.sectionIconRowUser}>
              <div className={isDark ? STYLES.userIconDark : STYLES.userIconLight}>
                <User className={isDark ? STYLES.userIconInnerDark : STYLES.userIconInnerLight} />
              </div>
              <h3 className={isDark ? STYLES.sectionTitleDark : STYLES.sectionTitleLight}>Información del Paciente</h3>
            </div>
            <div className={STYLES.detailGrid2}>
              <div>
                <p className={isDark ? STYLES.fieldLabelDark : STYLES.fieldLabelLight}>Nombre Completo</p>
                <p className={isDark ? STYLES.fieldValueDark : STYLES.fieldValueLight}>
                  {solicitudDetalle.patients?.nombre} {solicitudDetalle.patients?.apellido}
                </p>
              </div>
              <div>
                <p className={isDark ? STYLES.fieldLabelDark : STYLES.fieldLabelLight}>RUT</p>
                <p className={isDark ? STYLES.fieldValueDark : STYLES.fieldValueLight}>{solicitudDetalle.patients?.rut}</p>
              </div>
            </div>
          </div>

          <div className={STYLES.staticSection}>
            <div className={STYLES.sectionIconRowUser}>
              <div className={STYLES.iconWrapGreen}>
                <Stethoscope className={STYLES.iconGreen} />
              </div>
              <h3 className={STYLES.detailSectionTitle}>Información del Doctor</h3>
            </div>
            <div className={STYLES.detailGrid2}>
              <div>
                <p className={STYLES.detailFieldLabel}>Nombre Completo</p>
                <p className={STYLES.fieldValueLight}>
                  {solicitudDetalle.doctors?.nombre} {solicitudDetalle.doctors?.apellido}
                </p>
              </div>
              <div>
                <p className={STYLES.detailFieldLabel}>Especialidad</p>
                <p className={STYLES.detailFieldValueCap}>
                  {solicitudDetalle.doctors?.especialidad?.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className={STYLES.detailFieldLabel}>Estado</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  solicitudDetalle.doctors?.estado === 'activo'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {solicitudDetalle.doctors?.estado}
                </span>
              </div>
            </div>
          </div>

          <div className={STYLES.staticSection}>
            <div className={STYLES.sectionIconRowUser}>
              <div className={STYLES.iconWrapPurple}>
                <FileText className={STYLES.iconPurple} />
              </div>
              <h3 className={STYLES.detailSectionTitle}>Información de la Operación</h3>
            </div>
            <div className={STYLES.detailGrid2}>
              <div>
                <p className={STYLES.detailFieldLabel}>Código de Operación</p>
                <p className={STYLES.fieldValueLight}>{solicitudDetalle.codigo_operacion}</p>
                {(() => {
                  const operacion = codigosOperaciones.find(op => op.codigo === solicitudDetalle.codigo_operacion)
                  return operacion ? (
                    <div className={STYLES.mt2}>
                      <p className={STYLES.textXsSl6Bold}>{operacion.nombre}</p>
                      {operacion.descripcion && (
                        <p className={STYLES.textXsSl5Mt1}>{operacion.descripcion}</p>
                      )}
                    </div>
                  ) : null
                })()}
              </div>
              <div>
                <p className={STYLES.detailFieldLabel}>
                  {solicitudDetalle.fecha_preferida ? 'Horario solicitado (slot vacío)' : 'Hora Recomendada'}
                </p>
                <p className={STYLES.fieldValueLight}>
                  {solicitudDetalle.fecha_preferida ? (
                    <>
                      {format(new Date(solicitudDetalle.fecha_preferida), 'dd/MM/yyyy')}
                      {solicitudDetalle.hora_recomendada && (
                        <> · {typeof solicitudDetalle.hora_recomendada === 'string' ? solicitudDetalle.hora_recomendada.slice(0, 5) : solicitudDetalle.hora_recomendada}
                          {solicitudDetalle.hora_fin_recomendada && `–${typeof solicitudDetalle.hora_fin_recomendada === 'string' ? solicitudDetalle.hora_fin_recomendada.slice(0, 5) : solicitudDetalle.hora_fin_recomendada}`}
                        </>
                      )}
                    </>
                  ) : (
                    solicitudDetalle.hora_recomendada
                      ? (typeof solicitudDetalle.hora_recomendada === 'string' ? solicitudDetalle.hora_recomendada.slice(0, 5) : solicitudDetalle.hora_recomendada)
                      : 'No especificada'
                  )}
                </p>
              </div>
              <div className={STYLES.colSpan2}>
                <p className={STYLES.detailFieldLabel}>Estado</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getEstadoBadge(solicitudDetalle.estado)}`}>
                  {solicitudDetalle.estado}
                </span>
              </div>
              {solicitudDetalle.observaciones && (
                <div className={STYLES.colSpan2}>
                  <p className={STYLES.detailFieldLabel}>Observaciones</p>
                  <p className={STYLES.detailObsValue}>{solicitudDetalle.observaciones}</p>
                </div>
              )}
            </div>
          </div>

          {solicitudDetalle.surgery_request_supplies?.length > 0 && (
            <div className={STYLES.staticSection}>
              <div className={STYLES.sectionIconRowUser}>
                <div className={STYLES.iconWrapOrange}>
                  <Package className={STYLES.iconOrange} />
                </div>
                <h3 className={STYLES.detailSectionTitle}>Insumos Requeridos</h3>
              </div>
              <div className={STYLES.spaceY2}>
                {solicitudDetalle.surgery_request_supplies.map((item, idx) => (
                  <div key={idx} className={STYLES.insumosItem}>
                    <div className={STYLES.flex1}>
                      <p className={STYLES.fieldValueLight}>{item.supplies?.nombre}</p>
                      <div className={STYLES.flexGap3Mt1}>
                        <span className={STYLES.textXsSl5}>Código: {item.supplies?.codigo}</span>
                        {item.supplies?.grupo_prestacion && (
                          <span className={STYLES.textXsBlue6Bold}>{item.supplies.grupo_prestacion}</span>
                        )}
                      </div>
                    </div>
                    <div className={STYLES.ml4}>
                      <span className={STYLES.cantBadge}>Cantidad: {item.cantidad}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={STYLES.staticSection}>
            <div className={STYLES.sectionIconRowUser}>
              <div className={STYLES.iconWrapSlate}>
                <Clock className={STYLES.iconSlate6} />
              </div>
              <h3 className={STYLES.detailSectionTitle}>Información Adicional</h3>
            </div>
            <div className={STYLES.detailGrid2}>
              <div>
                <p className={STYLES.detailFieldLabel}>Fecha de Creación</p>
                <p className={STYLES.fieldValueLight}>
                  {format(new Date(solicitudDetalle.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className={STYLES.detailFieldLabel}>Última Actualización</p>
                <p className={STYLES.fieldValueLight}>
                  {format(new Date(solicitudDetalle.updated_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={STYLES.detailCloseFooter}>
          <button onClick={onClose} className="btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
