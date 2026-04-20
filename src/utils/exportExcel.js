/**
 * Utilidad de exportación a Excel (.xlsx).
 * Usa SheetJS (xlsx) — ya incluido en package.json.
 */
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function _calcDuration(h1, h2) {
  if (!h1 || !h2) return 0
  const ini = new Date(`2000-01-01T${h1}`)
  const fin = new Date(`2000-01-01T${h2}`)
  return Math.max((fin - ini) / (1000 * 60), 0)
}

const _ESTADO_LABELS = {
  programada: 'Programada',
  completada: 'Completada',
  cancelada:  'Cancelada',
  en_proceso: 'En Proceso',
}

/**
 * Descarga un workbook como archivo .xlsx.
 * @param {XLSX.WorkBook} workbook
 * @param {string} filename - sin extensión
 */
function downloadWorkbook(workbook, filename) {
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Exporta el reporte diario del dashboard de pabellón.
 *
 * @param {object} params
 * @param {Array}  params.cirugiasHoy         — cirugías del día
 * @param {Array}  params.solicitudesPendientes — solicitudes pendientes
 * @param {object} params.ocupacion            — { porcentajeOcupacion, pabellonesOcupados, totalPabellones }
 * @param {number} params.tiempoPromedio       — minutos promedio de cirugía
 * @param {object} params.tasaUtilizacion      — { porcentaje, slotsOcupados }
 */
export function exportDashboardReport({
  cirugiasHoy = [],
  solicitudesPendientes = [],
  ocupacion = {},
  tiempoPromedio = 0,
  tasaUtilizacion = {},
}) {
  const hoy = format(new Date(), 'dd/MM/yyyy')
  const wb = XLSX.utils.book_new()

  // ── Hoja 1: Métricas KPI ─────────────────────────────────────────────────
  const kpiData = [
    ['Indicador', 'Valor', 'Fecha'],
    ['Solicitudes Pendientes',  solicitudesPendientes.length,           hoy],
    ['Cirugías Hoy',            cirugiasHoy.length,                     hoy],
    ['Ocupación de Pabellones', `${ocupacion.porcentajeOcupacion ?? 0}%`, hoy],
    ['Pabellones Ocupados',     `${ocupacion.pabellonesOcupados ?? 0} / ${ocupacion.totalPabellones ?? 0}`, hoy],
    ['Tiempo Promedio Cirugía', tiempoPromedio
      ? `${Math.floor(tiempoPromedio / 60)}h ${tiempoPromedio % 60}m`
      : 'Sin datos', hoy],
    ['Utilización 7 días',      `${tasaUtilizacion.porcentaje ?? 0}%`,  hoy],
  ]
  const wsKpi = XLSX.utils.aoa_to_sheet(kpiData)
  wsKpi['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsKpi, 'Métricas KPI')

  // ── Hoja 2: Cirugías de hoy ──────────────────────────────────────────────
  const cirugiasRows = cirugiasHoy.map(c => ({
    Paciente:   `${c.patients?.nombre ?? ''} ${c.patients?.apellido ?? ''}`.trim() || '—',
    Doctor:     `${c.doctors?.nombre ?? ''} ${c.doctors?.apellido ?? ''}`.trim() || '—',
    Pabellón:   c.operating_rooms?.nombre ?? '—',
    'Hora Inicio': c.hora_inicio ?? '—',
    'Hora Fin':    c.hora_fin ?? '—',
    Estado:     c.estado ?? '—',
    Fecha:      hoy,
  }))

  const wsCirugias = cirugiasRows.length > 0
    ? XLSX.utils.json_to_sheet(cirugiasRows)
    : XLSX.utils.aoa_to_sheet([['No hay cirugías programadas para hoy']])

  if (cirugiasRows.length > 0) {
    wsCirugias['!cols'] = [
      { wch: 25 }, { wch: 25 }, { wch: 18 },
      { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
    ]
  }
  XLSX.utils.book_append_sheet(wb, wsCirugias, 'Cirugías Hoy')

  // ── Hoja 3: Solicitudes Pendientes ───────────────────────────────────────
  const solicitudesRows = solicitudesPendientes.map(s => ({
    Paciente:     `${s.patients?.nombre ?? ''} ${s.patients?.apellido ?? ''}`.trim() || '—',
    RUT:          s.patients?.rut ?? '—',
    Doctor:       `${s.doctors?.nombre ?? ''} ${s.doctors?.apellido ?? ''}`.trim() || '—',
    Especialidad: s.doctors?.especialidad ?? '—',
    Estado:       s.estado ?? '—',
    'Fecha Solicitud': s.created_at ? format(new Date(s.created_at), 'dd/MM/yyyy HH:mm') : '—',
    Notas:        s.notas ?? '',
  }))

  const wsSolicitudes = solicitudesRows.length > 0
    ? XLSX.utils.json_to_sheet(solicitudesRows)
    : XLSX.utils.aoa_to_sheet([['No hay solicitudes pendientes']])

  if (solicitudesRows.length > 0) {
    wsSolicitudes['!cols'] = [
      { wch: 25 }, { wch: 14 }, { wch: 25 },
      { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 30 },
    ]
  }
  XLSX.utils.book_append_sheet(wb, wsSolicitudes, 'Solicitudes Pendientes')

  // ── Descargar ────────────────────────────────────────────────────────────
  const timestamp = format(new Date(), 'yyyy-MM-dd', { locale: es })
  downloadWorkbook(wb, `reporte-pabellon-${timestamp}`)
}

/**
 * Exporta el reporte de analytics con 5 hojas:
 * Resumen · Detalle Cirugías · Por Médico · Por Pabellón · Solicitudes
 *
 * @param {object} params
 * @param {Array}  params.surgeries  — cirugías filtradas del período
 * @param {Array}  params.requests   — solicitudes del período
 * @param {object} params.kpis       — métricas KPI calculadas
 * @param {string} params.periodo    — descripción del período (ej. "2026-03-18 al 2026-04-17")
 */
export function exportAnalyticsReport({ surgeries = [], requests = [], kpis = {}, periodo = '' }) {
  const wb = XLSX.utils.book_new()
  const fechaExport = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })

  // ── Hoja 1: Resumen ──────────────────────────────────────────────────────
  const resumen = [
    ['REPORTE DE ANALYTICS — SurgicalHUB'],
    ['Período:', periodo],
    ['Exportado:', fechaExport],
    [],
    ['INDICADORES CLAVE', 'Valor'],
    ['Total Cirugías',       kpis.total         ?? 0],
    ['Cirugías Completadas', kpis.completadas   ?? 0],
    ['Tasa de Completadas',  `${kpis.tasa ?? 0}%`],
    ['Horas Quirúrgicas',    `${kpis.totalHoras ?? 0}h`],
    ['Duración Promedio',    kpis.avgMin
      ? `${Math.floor(kpis.avgMin / 60)}h ${Math.round(kpis.avgMin % 60)}m`
      : 'Sin datos'],
    ['Total Solicitudes',    kpis.totalRequests ?? 0],
  ]
  const wsResumen = XLSX.utils.aoa_to_sheet(resumen)
  wsResumen['!cols'] = [{ wch: 28 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  // ── Hoja 2: Detalle Cirugías ─────────────────────────────────────────────
  const cirugiasRows = surgeries.map(s => ({
    Fecha:             s.fecha ?? '—',
    Paciente:          s.patients ? `${s.patients.nombre} ${s.patients.apellido}`.trim() : '—',
    RUT:               s.patients?.rut ?? '—',
    Doctor:            s.doctors  ? `${s.doctors.nombre} ${s.doctors.apellido}`.trim()   : '—',
    Especialidad:      s.doctors?.especialidad ?? '—',
    Pabellón:          s.operating_rooms?.nombre ?? '—',
    'Hora Inicio':     s.hora_inicio ?? '—',
    'Hora Fin':        s.hora_fin ?? '—',
    'Duración (min)':  Math.round(_calcDuration(s.hora_inicio, s.hora_fin)),
    Estado:            _ESTADO_LABELS[s.estado] || s.estado,
  }))
  const wsCirugias = cirugiasRows.length > 0
    ? XLSX.utils.json_to_sheet(cirugiasRows)
    : XLSX.utils.aoa_to_sheet([['No hay cirugías en el período seleccionado']])
  if (cirugiasRows.length > 0) {
    wsCirugias['!cols'] = [
      { wch: 12 }, { wch: 26 }, { wch: 14 }, { wch: 26 },
      { wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
    ]
  }
  XLSX.utils.book_append_sheet(wb, wsCirugias, 'Detalle Cirugías')

  // ── Hoja 3: Por Médico ────────────────────────────────────────────────────
  const docMap = {}
  surgeries.forEach(s => {
    if (!s.doctors) return
    const k = s.doctors.id
    if (!docMap[k]) {
      docMap[k] = {
        Doctor:            `${s.doctors.nombre} ${s.doctors.apellido}`.trim(),
        Especialidad:      s.doctors.especialidad ?? '—',
        'Total Cirugías':  0,
        Completadas:       0,
        Canceladas:        0,
        'Horas Operadas':  0,
      }
    }
    docMap[k]['Total Cirugías']++
    if (s.estado === 'completada') docMap[k].Completadas++
    if (s.estado === 'cancelada')  docMap[k].Canceladas++
    docMap[k]['Horas Operadas'] += _calcDuration(s.hora_inicio, s.hora_fin) / 60
  })
  const docRows = Object.values(docMap)
    .sort((a, b) => b['Total Cirugías'] - a['Total Cirugías'])
    .map(d => ({ ...d, 'Horas Operadas': Math.round(d['Horas Operadas'] * 10) / 10 }))
  const wsDoc = docRows.length > 0
    ? XLSX.utils.json_to_sheet(docRows)
    : XLSX.utils.aoa_to_sheet([['Sin datos para el período']])
  if (docRows.length > 0) {
    wsDoc['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }]
  }
  XLSX.utils.book_append_sheet(wb, wsDoc, 'Por Médico')

  // ── Hoja 4: Por Pabellón ──────────────────────────────────────────────────
  const roomMap = {}
  surgeries.forEach(s => {
    if (!s.operating_rooms) return
    const k = s.operating_rooms.id
    if (!roomMap[k]) {
      roomMap[k] = {
        Pabellón:         s.operating_rooms.nombre,
        'Total Cirugías': 0,
        Completadas:      0,
        'Horas Operadas': 0,
      }
    }
    roomMap[k]['Total Cirugías']++
    if (s.estado === 'completada') roomMap[k].Completadas++
    roomMap[k]['Horas Operadas'] += _calcDuration(s.hora_inicio, s.hora_fin) / 60
  })
  const roomRows = Object.values(roomMap)
    .sort((a, b) => b['Total Cirugías'] - a['Total Cirugías'])
    .map(r => ({ ...r, 'Horas Operadas': Math.round(r['Horas Operadas'] * 10) / 10 }))
  const wsRoom = roomRows.length > 0
    ? XLSX.utils.json_to_sheet(roomRows)
    : XLSX.utils.aoa_to_sheet([['Sin datos para el período']])
  if (roomRows.length > 0) {
    wsRoom['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 14 }]
  }
  XLSX.utils.book_append_sheet(wb, wsRoom, 'Por Pabellón')

  // ── Hoja 5: Solicitudes ───────────────────────────────────────────────────
  const reqRows = requests.map(r => ({
    'Fecha Solicitud': r.created_at ? format(new Date(r.created_at), 'dd/MM/yyyy HH:mm') : '—',
    Doctor:            r.doctors ? `${r.doctors.nombre} ${r.doctors.apellido}`.trim() : '—',
    Estado:            r.estado ?? '—',
  }))
  const wsReq = reqRows.length > 0
    ? XLSX.utils.json_to_sheet(reqRows)
    : XLSX.utils.aoa_to_sheet([['Sin solicitudes en el período seleccionado']])
  if (reqRows.length > 0) {
    wsReq['!cols'] = [{ wch: 22 }, { wch: 26 }, { wch: 14 }]
  }
  XLSX.utils.book_append_sheet(wb, wsReq, 'Solicitudes')

  // ── Descargar ────────────────────────────────────────────────────────────
  const ts = format(new Date(), 'yyyy-MM-dd')
  downloadWorkbook(wb, `analytics-surgicalhub-${ts}`)
}
