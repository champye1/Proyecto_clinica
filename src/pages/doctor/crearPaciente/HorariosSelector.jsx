import { Calendar, LayoutGrid } from 'lucide-react'
import { tc } from '@/constants/theme'
import CalendarioPabellonesGrid from '@/components/CalendarioPabellonesGrid'
import { HORAS_SELECT } from '@/utils/horasOpciones'
import { sanitizeString } from '@/utils/sanitizeInput'

const S = {
  mt3:                    'mt-3',
  calBtnDark:             'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors bg-slate-700 text-slate-100 hover:bg-slate-600 border border-slate-600',
  calBtnLight:            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors bg-white border border-slate-300 text-gray-700 hover:bg-slate-100',
  calHintDark:            'text-xs mt-1.5 text-slate-400',
  calHintLight:           'text-xs mt-1.5 text-gray-500',
  calGridWrapDark:        'mt-4 p-4 rounded-xl border bg-slate-800/30 border-slate-600',
  calGridWrapLight:       'mt-4 p-4 rounded-xl border bg-slate-50 border-slate-200',
  pabellonNoticeDark:     'mt-3 flex flex-wrap items-center gap-2 p-4 rounded-xl border bg-slate-800/50 border-slate-600',
  pabellonNoticeLight:    'mt-3 flex flex-wrap items-center gap-2 p-4 rounded-xl border bg-slate-100 border-slate-200',
  pabellonNoticeTextDark: 'text-sm text-slate-200',
  pabellonNoticeTextLight:'text-sm text-gray-700',
  horariosPanelDark:      'mt-4 p-4 rounded-xl border space-y-4 bg-slate-800/50 border-slate-600',
  horariosPanelLight:     'mt-4 p-4 rounded-xl border space-y-4 bg-slate-50 border-slate-200',
  horariosPanelHintDark:  'text-xs text-slate-400',
  horariosPanelHintLight: 'text-xs text-gray-500',
  slotBadgeDark:          'flex flex-wrap items-center gap-2 p-3 rounded-xl border-2 border-dashed bg-blue-500/20 border-blue-400/50',
  slotBadgeLight:         'flex flex-wrap items-center gap-2 p-3 rounded-xl border-2 border-dashed bg-blue-50 border-blue-200',
  slotNameDark:           'text-sm font-semibold text-slate-100',
  slotNameLight:          'text-sm font-semibold text-gray-800',
  slotQuitarDark:         'ml-auto text-sm font-medium underline text-slate-400 hover:text-slate-200',
  slotQuitarLight:        'ml-auto text-sm font-medium underline text-gray-600 hover:text-gray-800',
  addDayBtnDark:          'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700',
  addDayBtnLight:         'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border bg-white border-slate-300 text-gray-700 hover:bg-slate-100',
  noSlotTextDark:         'text-xs text-slate-400',
  noSlotTextLight:        'text-xs text-gray-500',
  extraSlotLabelDark:     'text-sm font-semibold text-slate-200',
  extraSlotLabelLight:    'text-sm font-semibold text-gray-800',
  extraQuitarDark:        'text-sm underline text-slate-400 hover:text-slate-200',
  extraQuitarLight:       'text-sm underline text-gray-500 hover:text-gray-800',
  extraFieldsRow:         'flex flex-wrap gap-3 items-end',
  extraInputLabelDark:    'block text-xs font-medium mb-0.5 text-slate-400',
  extraInputLabelLight:   'block text-xs font-medium mb-0.5 text-gray-500',
  extraDateInput:         'input-field mt-0 w-auto min-w-[140px]',
  extraPabellonSelectDark:'input-field mt-0 w-auto min-w-[140px] bg-slate-800 border-slate-600',
  extraPabellonSelectLight:'input-field mt-0 w-auto min-w-[140px]',
  extraHoraSelectDark:    'input-field mt-0 w-auto min-w-[90px] bg-slate-800 border-slate-600',
  extraHoraSelectLight:   'input-field mt-0 w-auto min-w-[90px]',
  hourLabelDark:          'block text-sm font-semibold mb-2 text-slate-200',
  hourLabelLight:         'block text-sm font-semibold mb-2 text-gray-700',
  hourSelectDark:         'input-field max-w-md bg-slate-800 border-slate-600',
  hourSelectLight:        'input-field max-w-md',
  iconMd:                 'w-5 h-5',
  iconSmFade:             'w-4 h-4 opacity-70',
  extraSlotRow:           'space-y-2',
  flexWrapGap2:           'flex flex-wrap items-center gap-2',
  formMt:                 'mt-4',
}

export default function HorariosSelector({
  formData, setFormData,
  slot1Seleccionado, setSlot1Seleccionado,
  slot2Seleccionado, setSlot2Seleccionado,
  showSegundoHorario, setShowSegundoHorario,
  showCalendarioGrid, setShowCalendarioGrid,
  pabellonesList, initialFecha, theme,
}) {
  const t = tc(theme)
  const isDark = theme === 'dark'

  const handleCalendarConfirm = (payload) => {
    if (!payload.slot1) { setShowCalendarioGrid(false); return }
    const yaTienePrimerHorario = formData.fecha_preferida && formData.hora_recomendada
    const eligioSoloUnSlot = !payload.slot2
    if (yaTienePrimerHorario && eligioSoloUnSlot) {
      setFormData(prev => ({
        ...prev,
        fecha_preferida_2: payload.fechaPreferida || '',
        hora_recomendada_2: payload.slot1.horaInicio || '',
        hora_fin_recomendada_2: payload.slot1.horaFin || '',
        operating_room_id_preferido_2: payload.slot1.operating_room_id || '',
      }))
      setSlot2Seleccionado({ operating_room_id: payload.slot1.operating_room_id, nombre_pabellon: payload.slot1.nombrePabellon || '', hora_inicio: payload.slot1.horaInicio, hora_fin: payload.slot1.horaFin })
      setShowSegundoHorario(true)
    } else {
      setFormData(prev => ({
        ...prev,
        fecha_preferida: payload.fechaPreferida || '',
        hora_recomendada: payload.slot1.horaInicio || '',
        hora_fin_recomendada: payload.slot1.horaFin || '',
        operating_room_id_preferido: payload.slot1.operating_room_id || '',
        fecha_preferida_2: payload.slot2 ? (payload.fechaPreferida2 || payload.fechaPreferida) : '',
        hora_recomendada_2: payload.slot2?.horaInicio || '',
        hora_fin_recomendada_2: payload.slot2?.horaFin || '',
        operating_room_id_preferido_2: payload.slot2?.operating_room_id || '',
      }))
      setSlot1Seleccionado({ operating_room_id: payload.slot1.operating_room_id, nombre_pabellon: payload.slot1.nombrePabellon || '', hora_inicio: payload.slot1.horaInicio, hora_fin: payload.slot1.horaFin })
      setSlot2Seleccionado(payload.slot2 ? { operating_room_id: payload.slot2.operating_room_id, nombre_pabellon: payload.slot2.nombrePabellon || '', hora_inicio: payload.slot2.horaInicio, hora_fin: payload.slot2.horaFin } : null)
      if (payload.slot2) setShowSegundoHorario(true)
    }
    setShowCalendarioGrid(false)
  }

  return (
    <div className={S.formMt}>
      <label htmlFor="horario-tipo" className={isDark ? S.hourLabelDark : S.hourLabelLight}>Seleccionar hora</label>
      <select
        id="horario-tipo"
        value={formData.dejar_fecha_a_pabellon ? 'pabellon' : 'doctor'}
        onChange={(e) => {
          const esPabellon = e.target.value === 'pabellon'
          setFormData(prev => ({
            ...prev,
            dejar_fecha_a_pabellon: esPabellon,
            ...(esPabellon ? { fecha_preferida: '', hora_recomendada: '', hora_fin_recomendada: '', operating_room_id_preferido: '', fecha_preferida_2: '', hora_recomendada_2: '', hora_fin_recomendada_2: '', operating_room_id_preferido_2: '', horarios_extra: [] } : {}),
          }))
          setShowCalendarioGrid(!esPabellon)
        }}
        className={isDark ? S.hourSelectDark : S.hourSelectLight}
      >
        <option value="doctor">Seleccionar hora</option>
        <option value="pabellon">Pabellón toma la hora</option>
      </select>

      {!formData.dejar_fecha_a_pabellon && (
        <>
          <div className={S.mt3}>
            <button type="button" onClick={() => setShowCalendarioGrid(prev => !prev)} className={isDark ? S.calBtnDark : S.calBtnLight}>
              <Calendar className={S.iconMd} />
              <span>{showCalendarioGrid ? 'Ocultar calendario' : 'Ver calendario y disponibilidad de pabellones'}</span>
              <LayoutGrid className={S.iconSmFade} />
            </button>
            <p className={isDark ? S.calHintDark : S.calHintLight}>
              {formData.fecha_preferida ? 'Ve en qué pabellón está libre cada slot. Puede cambiar de día y volver a elegir.' : 'Se muestra el día actual con todos los pabellones (libre, ocupado, bloqueado). Elija día y hora desde el calendario.'}
            </p>
          </div>

          {showCalendarioGrid && (
            <div className={isDark ? S.calGridWrapDark : S.calGridWrapLight}>
              <CalendarioPabellonesGrid
                theme={theme}
                inlineMode
                initialFecha={initialFecha}
                onCerrar={() => setShowCalendarioGrid(false)}
                onConfirm={handleCalendarConfirm}
              />
            </div>
          )}
        </>
      )}

      {formData.dejar_fecha_a_pabellon && (
        <div className={isDark ? S.pabellonNoticeDark : S.pabellonNoticeLight}>
          <p className={isDark ? S.pabellonNoticeTextDark : S.pabellonNoticeTextLight}>
            La fecha y hora serán asignadas por pabellón. Al enviar la solicitud se notificará a pabellón para que la persona a cargo elija una hora apropiada.
          </p>
        </div>
      )}

      {!formData.dejar_fecha_a_pabellon && formData.fecha_preferida && (
        <div className={isDark ? S.horariosPanelDark : S.horariosPanelLight}>
          <p className={isDark ? S.horariosPanelHintDark : S.horariosPanelHintLight}>
            Horario fijado desde el calendario. Para elegir otro, pulse Quitar y vuelva a usar el calendario.
          </p>

          <div className={isDark ? S.slotBadgeDark : S.slotBadgeLight}>
            <span className={isDark ? S.slotNameDark : S.slotNameLight}>
              1º — {slot1Seleccionado?.nombre_pabellon || pabellonesList.find(p => p.id === formData.operating_room_id_preferido)?.nombre || 'Pabellón'} · {formData.fecha_preferida ? new Date(formData.fecha_preferida + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''} · {formData.hora_recomendada || ''}–{formData.hora_fin_recomendada || ''}
            </span>
            <button type="button" onClick={() => { setSlot1Seleccionado(null); setFormData(prev => ({ ...prev, fecha_preferida: '', hora_recomendada: '', hora_fin_recomendada: '', operating_room_id_preferido: '' })) }} className={isDark ? S.slotQuitarDark : S.slotQuitarLight}>
              Quitar
            </button>
          </div>

          {formData.fecha_preferida && formData.hora_recomendada && !showSegundoHorario && (
            <button type="button" onClick={() => { setShowSegundoHorario(true); setShowCalendarioGrid(true) }} className={isDark ? S.addDayBtnDark : S.addDayBtnLight}>
              Agregar otro día
            </button>
          )}

          {showSegundoHorario && (
            <>
              {(formData.fecha_preferida_2 || formData.hora_recomendada_2) ? (
                <div className={isDark ? S.slotBadgeDark : S.slotBadgeLight}>
                  <span className={isDark ? S.slotNameDark : S.slotNameLight}>
                    2º — {slot2Seleccionado?.nombre_pabellon || pabellonesList.find(p => p.id === formData.operating_room_id_preferido_2)?.nombre || 'Pabellón'} · {formData.fecha_preferida_2 ? new Date(formData.fecha_preferida_2 + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''} · {formData.hora_recomendada_2 || ''}–{formData.hora_fin_recomendada_2 || ''}
                  </span>
                  <button type="button" onClick={() => { setSlot2Seleccionado(null); setFormData(prev => ({ ...prev, fecha_preferida_2: '', hora_recomendada_2: '', hora_fin_recomendada_2: '', operating_room_id_preferido_2: '' })); setShowSegundoHorario(false) }} className={isDark ? S.slotQuitarDark : S.slotQuitarLight}>
                    Quitar
                  </button>
                </div>
              ) : (
                <p className={isDark ? S.noSlotTextDark : S.noSlotTextLight}>
                  Abra el calendario de arriba y elija otro día; use «Usar como 1º y elegir 2º (otro día)» para fijar el segundo horario.
                </p>
              )}

              {formData.horarios_extra.map((extra, idx) => (
                <div key={idx} className={S.extraSlotRow}>
                  <div className={S.flexWrapGap2}>
                    <span className={isDark ? S.extraSlotLabelDark : S.extraSlotLabelLight}>{idx + 3}º horario</span>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, horarios_extra: prev.horarios_extra.filter((_, i) => i !== idx) }))} className={isDark ? S.extraQuitarDark : S.extraQuitarLight}>Quitar</button>
                  </div>
                  <div className={S.extraFieldsRow}>
                    <div>
                      <label htmlFor={`extra-${idx}-fecha`} className={isDark ? S.extraInputLabelDark : S.extraInputLabelLight}>Día</label>
                      <input id={`extra-${idx}-fecha`} type="date" value={extra.fecha_preferida || ''} onChange={(e) => setFormData(prev => ({ ...prev, horarios_extra: prev.horarios_extra.map((h, i) => i === idx ? { ...h, fecha_preferida: sanitizeString(e.target.value) } : h) }))} min={new Date().toISOString().split('T')[0]} className={S.extraDateInput} />
                    </div>
                    <div>
                      <label htmlFor={`extra-${idx}-pabellon`} className={isDark ? S.extraInputLabelDark : S.extraInputLabelLight}>Pabellón</label>
                      <select id={`extra-${idx}-pabellon`} value={extra.operating_room_id || ''} onChange={(e) => setFormData(prev => ({ ...prev, horarios_extra: prev.horarios_extra.map((h, i) => i === idx ? { ...h, operating_room_id: e.target.value || '' } : h) }))} className={isDark ? S.extraPabellonSelectDark : S.extraPabellonSelectLight}>
                        <option value="">Seleccione</option>
                        {pabellonesList.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`extra-${idx}-inicio`} className={isDark ? S.extraInputLabelDark : S.extraInputLabelLight}>Hora inicio</label>
                      <select id={`extra-${idx}-inicio`} value={extra.hora_recomendada || ''} onChange={(e) => setFormData(prev => ({ ...prev, horarios_extra: prev.horarios_extra.map((h, i) => i === idx ? { ...h, hora_recomendada: e.target.value } : h) }))} className={isDark ? S.extraHoraSelectDark : S.extraHoraSelectLight}>
                        <option value="">--</option>
                        {HORAS_SELECT.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`extra-${idx}-fin`} className={isDark ? S.extraInputLabelDark : S.extraInputLabelLight}>Hora fin</label>
                      <select id={`extra-${idx}-fin`} value={extra.hora_fin_recomendada || ''} onChange={(e) => setFormData(prev => ({ ...prev, horarios_extra: prev.horarios_extra.map((h, i) => i === idx ? { ...h, hora_fin_recomendada: e.target.value } : h) }))} className={isDark ? S.extraHoraSelectDark : S.extraHoraSelectLight}>
                        <option value="">--</option>
                        {HORAS_SELECT.filter(h => !extra.hora_recomendada || h > extra.hora_recomendada).map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={() => setFormData(prev => ({ ...prev, horarios_extra: [...prev.horarios_extra, { fecha_preferida: '', operating_room_id: '', hora_recomendada: '', hora_fin_recomendada: '' }] }))} className={isDark ? S.addDayBtnDark : S.addDayBtnLight}>
                Añadir otra hora
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
