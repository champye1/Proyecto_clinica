import { useState } from 'react'
import { X, Clock, Activity, CheckCircle2, Lock } from 'lucide-react'
import { format } from 'date-fns'
import Button from '@/components/common/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Modal from '@/components/common/Modal'
import { sanitizeString } from '@/utils/sanitizeInput'
import { STYLES } from './solicitudes.styles'

export default function ProgramacionModal({
  solicitudProgramando,
  onClose,
  formProgramacion,
  setFormProgramacion,
  seleccionBloques,
  setSeleccionBloques,
  pabellonesMostrar,
  pabellones,
  slotsHorarios,
  getSlotStatus,
  areContiguous,
  sortTimesAsc,
  timeToMinutes,
  showError,
  programarCirugia,
}) {
  const [showConfirmAgendamiento, setShowConfirmAgendamiento] = useState(false)
  const [confirmAgendamientoData, setConfirmAgendamientoData] = useState(null)
  const [showConfirmReserva, setShowConfirmReserva] = useState(false)

  const handleProgramar = (e) => {
    e.preventDefault()
    if (!solicitudProgramando) return
    if (formProgramacion.hora_inicio && formProgramacion.hora_fin) {
      const [h1, m1] = formProgramacion.hora_inicio.split(':').map(Number)
      const [h2, m2] = formProgramacion.hora_fin.split(':').map(Number)
      if ((h2 * 60 + m2) <= (h1 * 60 + m1)) {
        showError('La hora de fin debe ser mayor que la hora de inicio')
        return
      }
    }
    setShowConfirmReserva(true)
  }

  return (
    <>
      <div className={STYLES.progOverlay}>
        <div className={STYLES.progBox}>
          <div className={STYLES.progHeader}>
            <div>
              <h2 className={STYLES.progTitle}>Programar Cirugía</h2>
              <p className={STYLES.progSubtitle}>Agendamiento Quirúrgico</p>
            </div>
            <button onClick={onClose} className={STYLES.progCloseBtn}>
              <X size={24} className={STYLES.iconWhite} />
            </button>
          </div>

          <form onSubmit={handleProgramar} className={STYLES.progForm}>
            <div className={STYLES.grid1gap4}>
              <div className={STYLES.spaceY2}>
                <label className={STYLES.progLabel}>Fecha *</label>
                <input
                  type="date"
                  value={formProgramacion.fecha}
                  onChange={(e) => setFormProgramacion({ ...formProgramacion, fecha: sanitizeString(e.target.value) })}
                  className={STYLES.progInput}
                  required
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>

            {formProgramacion.fecha && (
              <div className={STYLES.progCalWrap}>
                <div className={STYLES.progSidebar}>
                  <div className={STYLES.progSolCard}>
                    <div className={STYLES.progGlow} />
                    <div className={STYLES.relZ10}>
                      <h3 className={STYLES.progSolTitle}>Solicitud en curso</h3>
                      {solicitudProgramando ? (
                        <div className={STYLES.spaceY4Mt4}>
                          <div>
                            <div className={STYLES.progFieldLabel}>Paciente</div>
                            <div className={STYLES.progPatientName}>
                              {solicitudProgramando.patients?.nombre} {solicitudProgramando.patients?.apellido}
                            </div>
                            <div className={STYLES.progPatientRut}>
                              RUT: {solicitudProgramando.patients?.rut}
                            </div>
                          </div>
                          <div className={STYLES.progOpRow}>
                            <Activity size={16} className={STYLES.iconBlue5} />
                            <span className={STYLES.progOpCode}>{solicitudProgramando.codigo_operacion}</span>
                          </div>
                          <div className={STYLES.progDoctorLabel}>
                            Cirujano:{' '}
                            <span className={STYLES.iconWhite}>
                              {solicitudProgramando.doctors?.nombre} {solicitudProgramando.doctors?.apellido}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className={STYLES.progNoSol}>Navegación libre por disponibilidad</p>
                      )}
                    </div>
                  </div>

                  <div className={STYLES.legendCard}>
                    <h4 className={STYLES.legendTitle}>
                      <span className={STYLES.legendHelpIcon}>?</span>
                      Leyenda
                    </h4>
                    <div className={STYLES.spaceY3}>
                      <div className={STYLES.flexGap3}>
                        <div className={STYLES.legendDotAvail} />
                        <span className={STYLES.legendLabel}>Disponible</span>
                      </div>
                      <div className={STYLES.flexGap3}>
                        <div className={STYLES.legendDotOccup} />
                        <span className={STYLES.legendLabel}>Ocupado</span>
                      </div>
                      <div className={STYLES.flexGap3}>
                        <div className={STYLES.legendDotBlock} />
                        <span className={STYLES.legendLabel}>Prioridad / Convenio</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={STYLES.gridMain}>
                  <div className={STYLES.gridHeaderRow}>
                    <div className={STYLES.gridTimeCell}>
                      <Clock size={18} className={STYLES.iconSl4} />
                    </div>
                    {Array.from({ length: 4 }).map((_, index) => {
                      const p = pabellonesMostrar[index]
                      if (!p) {
                        return (
                          <div key={`empty-${index}`} className={STYLES.gridEmptyCol}>
                            <h4 className={STYLES.gridColTitle4}>Pabellón {index + 1}</h4>
                            <span className={STYLES.gridColSubSl3}>No disponible</span>
                          </div>
                        )
                      }
                      const ocupados = slotsHorarios.filter(time => {
                        const { status } = getSlotStatus(p.id, time)
                        return status === 'occupied' || status === 'blocked'
                      }).length
                      const libres = slotsHorarios.length - ocupados
                      return (
                        <div key={p.id} className={STYLES.gridColActive}>
                          <h4 className={STYLES.gridColTitle9}>{p.nombre}</h4>
                          <span className={STYLES.gridColSubGreen}>{libres} Libres</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className={`flex-1 overflow-y-auto custom-scrollbar bg-white ${formProgramacion.operating_room_id && formProgramacion.hora_inicio ? 'pb-24' : ''}`}>
                    {slotsHorarios.map((time) => (
                      <div key={time} className={STYLES.gridRow}>
                        <div className={STYLES.gridTimeLabel}>{time}</div>
                        {Array.from({ length: 4 }).map((_, index) => {
                          const pav = pabellonesMostrar[index]
                          if (!pav) {
                            return (
                              <div key={`${time}-empty-${index}`} className={STYLES.gridEmptyCell}>
                                <div className={STYLES.gridEmptyCellInner}>
                                  <span className={STYLES.gridNALabel}>N/A</span>
                                </div>
                              </div>
                            )
                          }
                          const { status, data } = getSlotStatus(pav.id, time)
                          const isSelected  = seleccionBloques.pabellonId === pav.id && seleccionBloques.times.includes(time)
                          const isOccupied  = status === 'occupied' || status === 'blocked'

                          return (
                            <div
                              key={`${time}-${pav.id}`}
                              onClick={() => {
                                if (isOccupied) {
                                  if (status === 'occupied') showError('Este horario ya está ocupado por otra cirugía')
                                  else showError('Este horario está bloqueado por convenio')
                                  return
                                }
                                if (seleccionBloques.pabellonId && seleccionBloques.pabellonId !== pav.id) {
                                  const nueva = { pabellonId: pav.id, times: [time] }
                                  setSeleccionBloques(nueva)
                                  setFormProgramacion({
                                    ...formProgramacion,
                                    operating_room_id: pav.id,
                                    hora_inicio: time,
                                    hora_fin: `${String(parseInt(time.split(':')[0]) + 1).padStart(2, '0')}:${time.split(':')[1] || '00'}`,
                                  })
                                  return
                                }
                                const exists    = seleccionBloques.times.includes(time)
                                const nextTimes = exists
                                  ? seleccionBloques.times.filter(t => t !== time)
                                  : [...seleccionBloques.times, time]
                                if (nextTimes.length === 0) {
                                  setSeleccionBloques({ pabellonId: null, times: [] })
                                  setFormProgramacion({ ...formProgramacion, operating_room_id: '', hora_inicio: '', hora_fin: '' })
                                  return
                                }
                                if (!areContiguous(nextTimes)) {
                                  showError('Debes seleccionar bloques consecutivos en el mismo pabellón')
                                  return
                                }
                                const ordered = sortTimesAsc(nextTimes)
                                const start   = ordered[0]
                                const endHour = parseInt(ordered[ordered.length - 1].split(':')[0]) + 1
                                const endMin  = ordered[ordered.length - 1].split(':')[1] || '00'
                                setSeleccionBloques({ pabellonId: pav.id, times: ordered })
                                setFormProgramacion({
                                  ...formProgramacion,
                                  operating_room_id: pav.id,
                                  hora_inicio: start,
                                  hora_fin: `${String(endHour).padStart(2, '0')}:${endMin}`,
                                })
                              }}
                              className={`flex-1 min-h-[110px] border-r last:border-r-0 p-2.5 transition-all ${isOccupied ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50/30'}`}
                            >
                              {status === 'occupied' ? (
                                <div className={STYLES.slotOccupied}>
                                  <span className={STYLES.slotOccTitle}>Ocupado</span>
                                  <span className={STYLES.slotOccName}>
                                    {data.doctors?.apellido ? `Dr. ${data.doctors.apellido}` : data.doctors?.nombre ? `Dr. ${data.doctors.nombre}` : 'Cirugía'}
                                  </span>
                                </div>
                              ) : status === 'blocked' ? (
                                <div className={STYLES.slotBlocked}>
                                  <span className={STYLES.slotBlockTitle}><Lock size={8} /> Convenio</span>
                                  <span className={STYLES.slotBlockLabel}>Bloqueado</span>
                                </div>
                              ) : (
                                <div className={`h-full w-full flex items-center justify-center border-2 border-dashed rounded-2xl transition-all duration-300 ${
                                  isSelected ? 'border-blue-500 bg-blue-50 scale-[0.97] shadow-inner' : 'border-slate-200 group-hover:border-slate-300'
                                }`}>
                                  {isSelected && <CheckCircle2 size={36} className={STYLES.slotSelIcon} />}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  {seleccionBloques.times.length > 0 && (
                    <div className={STYLES.selFooter}>
                      <div className={STYLES.selFooterLeft}>
                        <div className={STYLES.selFooterIcon}>
                          <Activity size={24} />
                        </div>
                        <div>
                          <div className={STYLES.selFooterLabel}>Bloque Seleccionado</div>
                          <div className={STYLES.selFooterValue}>
                            {pabellonesMostrar.find(p => p.id === seleccionBloques.pabellonId)?.nombre || 'Pabellón'}
                            <span className={STYLES.selFooterSep}>•</span>
                            {formProgramacion.hora_inicio} – {formProgramacion.hora_fin}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const pabellon = pabellonesMostrar.find(p => p.id === seleccionBloques.pabellonId)
                          if (pabellon && seleccionBloques.times.length > 0) {
                            setConfirmAgendamientoData({
                              fecha:              formProgramacion.fecha,
                              hora_inicio:        formProgramacion.hora_inicio,
                              hora_fin:           formProgramacion.hora_fin,
                              operating_room_id:  seleccionBloques.pabellonId,
                              pabellonNombre:     pabellon.nombre,
                              observaciones:      formProgramacion.observaciones,
                            })
                            setShowConfirmAgendamiento(true)
                          }
                        }}
                        className={STYLES.selFooterBtn}
                      >
                        Proceder al agendamiento
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={STYLES.spaceY2}>
              <label className={STYLES.progLabel}>Observaciones</label>
              <textarea
                value={formProgramacion.observaciones}
                onChange={(e) => setFormProgramacion({ ...formProgramacion, observaciones: sanitizeString(e.target.value) })}
                className={STYLES.progTextarea}
                rows={3}
                placeholder="Notas adicionales sobre la cirugía..."
                maxLength={500}
              />
              <p className={STYLES.charCount}>{formProgramacion.observaciones?.length || 0}/500 caracteres</p>
            </div>

            <div className={STYLES.progActions}>
              <button type="button" onClick={onClose} className={STYLES.progCancelBtn}>
                Cancelar
              </button>
              <button
                type="submit"
                className={STYLES.progSubmitBtn}
                disabled={
                  !formProgramacion.operating_room_id ||
                  !formProgramacion.fecha ||
                  !formProgramacion.hora_inicio ||
                  !formProgramacion.hora_fin ||
                  programarCirugia.isPending
                }
              >
                {programarCirugia.isPending ? (
                  <><LoadingSpinner size="sm" />Programando...</>
                ) : (
                  'Programar Cirugía'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfirmAgendamiento && confirmAgendamientoData && solicitudProgramando && (
        <Modal
          isOpen={showConfirmAgendamiento}
          onClose={() => { setShowConfirmAgendamiento(false); setConfirmAgendamientoData(null) }}
          title="Confirmar Agendamiento"
        >
          <div className={STYLES.spaceY5}>
            <div className={STYLES.flexStartGap3}>
              <Activity className={STYLES.iconBlue6} />
              <div className={STYLES.flex1}>
                <p className={STYLES.textSmBoldSl9}>Revise los detalles antes de confirmar.</p>
                <div className={STYLES.detailsList}>
                  <p><span className={STYLES.fontBold}>Paciente:</span> {solicitudProgramando.patients?.nombre} {solicitudProgramando.patients?.apellido}</p>
                  <p><span className={STYLES.fontBold}>Doctor:</span> Dr. {solicitudProgramando.doctors?.apellido || solicitudProgramando.doctors?.nombre}</p>
                  <p><span className={STYLES.fontBold}>Fecha:</span> {format(new Date(confirmAgendamientoData.fecha), 'dd/MM/yyyy')}</p>
                  <p><span className={STYLES.fontBold}>Pabellón:</span> {confirmAgendamientoData.pabellonNombre}</p>
                  <p><span className={STYLES.fontBold}>Horario:</span> {String(confirmAgendamientoData.hora_inicio).slice(0, 5)} - {String(confirmAgendamientoData.hora_fin).slice(0, 5)}</p>
                  {confirmAgendamientoData.observaciones && (
                    <p><span className={STYLES.fontBold}>Observaciones:</span> {confirmAgendamientoData.observaciones}</p>
                  )}
                </div>
              </div>
            </div>
            <div className={STYLES.borderRndP3}>
              <div className={STYLES.grid4gap2}>
                {slotsHorarios.map((t) => {
                  const { status } = getSlotStatus(confirmAgendamientoData.operating_room_id, t)
                  const isSel =
                    timeToMinutes(t) >= timeToMinutes(confirmAgendamientoData.hora_inicio) &&
                    timeToMinutes(t) < timeToMinutes(confirmAgendamientoData.hora_fin)
                  return (
                    <div key={t} className={`text-center text-[10px] font-bold px-2 py-1 rounded ${
                      isSel            ? 'bg-blue-600 text-white' :
                      status === 'occupied' ? 'bg-red-100 text-red-700' :
                      status === 'blocked'  ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className={STYLES.flexGap4End}>
              <Button
                variant="secondary"
                onClick={() => { setShowConfirmAgendamiento(false); setConfirmAgendamientoData(null) }}
                disabled={programarCirugia.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  try {
                    sessionStorage.setItem('highlight_slot', JSON.stringify({
                      date:       confirmAgendamientoData.fecha,
                      time:       confirmAgendamientoData.hora_inicio,
                      pabellonId: confirmAgendamientoData.operating_room_id,
                    }))
                  } catch {}
                  programarCirugia.mutate({
                    solicitudId: solicitudProgramando.id,
                    formData: {
                      fecha:              confirmAgendamientoData.fecha,
                      hora_inicio:        confirmAgendamientoData.hora_inicio,
                      hora_fin:           confirmAgendamientoData.hora_fin,
                      operating_room_id:  confirmAgendamientoData.operating_room_id,
                      observaciones:      confirmAgendamientoData.observaciones || null,
                    },
                  })
                  setShowConfirmAgendamiento(false)
                  setConfirmAgendamientoData(null)
                }}
                loading={programarCirugia.isPending}
                disabled={programarCirugia.isPending}
                className={STYLES.btnBlue}
              >
                Confirmar Agendamiento
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={showConfirmReserva}
        onClose={() => setShowConfirmReserva(false)}
        title="Confirmar Reserva"
      >
        <div className={STYLES.detailSections}>
          <p className={STYLES.textSl7}>¿Está seguro de que desea crear esta reserva?</p>
          <div className={STYLES.flexGap4End}>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmReserva(false)}
              disabled={programarCirugia.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowConfirmReserva(false)
                programarCirugia.mutate({
                  solicitudId: solicitudProgramando.id,
                  formData:    formProgramacion,
                })
              }}
              loading={programarCirugia.isPending}
              disabled={programarCirugia.isPending}
              className={STYLES.btnBlue}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
