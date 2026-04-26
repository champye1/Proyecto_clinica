import { useTheme } from '@/contexts/ThemeContext'
import { FileText, Search } from 'lucide-react'
import { codigosOperaciones } from '@/data/codigosOperaciones'
import { sanitizeString } from '@/utils/sanitizeInput'
import Button from '@/components/common/Button'
import EmptyState from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/Skeleton'
import Modal from '@/components/common/Modal'
import { motion } from 'framer-motion'
import { tc } from '@/constants/theme'
import { STYLES } from './solicitudes.styles'
import SolicitudCard from './SolicitudCard'
import DetalleModal from './DetalleModal'
import ProgramacionModal from './ProgramacionModal'
import { useSolicitudes } from './useSolicitudes'

const getEstadoBadge = (estado) => ({
  pendiente: 'bg-yellow-100 text-yellow-800',
  aceptada:  'bg-green-100 text-green-800',
  rechazada: 'bg-red-100 text-red-800',
  cancelada: 'bg-gray-100 text-gray-800',
}[estado] || 'bg-yellow-100 text-yellow-800')

const getPriorityColor = (solicitud) => {
  if (solicitud.prioridad === 'alta' || solicitud.prioridad === 'Alta') return 'bg-red-500'
  if (solicitud.estado === 'pendiente' && solicitud.urgencia === 'alta') return 'bg-red-500'
  return 'bg-blue-500'
}

const getPriorityBadge = (solicitud) => {
  if (solicitud.prioridad === 'alta' || solicitud.prioridad === 'Alta')
    return { text: 'PRIORIDAD ALTA', bg: 'bg-red-500', textColor: 'text-white' }
  if (solicitud.estado === 'pendiente' && solicitud.urgencia === 'alta')
    return { text: 'PRIORIDAD ALTA', bg: 'bg-red-500', textColor: 'text-white' }
  return { text: 'PRIORIDAD MEDIA', bg: 'bg-blue-500', textColor: 'text-white' }
}

const getInitial       = (nombre) => nombre?.charAt(0).toUpperCase() || '?'
const getProcedureName = (codigo) => codigosOperaciones.find(c => c.codigo === codigo)?.nombre || codigo

export default function Solicitudes() {
  const { theme } = useTheme()
  const t      = tc(theme)
  const isDark = theme === 'dark'

  const filterInputClass  = isDark ? STYLES.searchInputDark  : theme === 'medical' ? STYLES.searchInputMedical  : STYLES.searchInputLight
  const filterSelectClass = isDark ? STYLES.filterSelectDark : theme === 'medical' ? STYLES.filterSelectMedical : STYLES.filterSelectLight

  const s = useSolicitudes()

  if (s.isLoading) return <TableSkeleton rows={6} />

  return (
    <div className={STYLES.page}>
      <div className={STYLES.header}>
        <h2 className={isDark ? STYLES.titleDark : STYLES.titleLight}>BANDEJA DE SOLICITUDES</h2>
        <p className={STYLES.subtitle}>MÉDICOS PENDIENTES DE AGENDAMIENTO</p>
      </div>

      <div className={STYLES.filtersSection}>
        <div className={STYLES.searchWrap}>
          <Search className={isDark ? STYLES.searchIconDark : STYLES.searchIconLight} />
          <input
            type="text"
            value={s.busqueda}
            onChange={(e) => s.setBusqueda(sanitizeString(e.target.value))}
            placeholder="Buscar por paciente, RUT, doctor o código..."
            className={filterInputClass}
          />
        </div>
        <div className={STYLES.filtersGrid}>
          <div>
            <label className={isDark ? STYLES.filterLabelDark : STYLES.filterLabelLight}>Filtro por Doctor</label>
            <select value={s.filtroDoctor} onChange={(e) => s.setFiltroDoctor(e.target.value)} className={filterSelectClass}>
              <option value="todos">Todos los doctores</option>
              {s.doctoresUnicos.map(doctor => (
                <option key={doctor.id} value={doctor.id}>Dr. {doctor.nombre} {doctor.apellido}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={isDark ? STYLES.filterLabelDark : STYLES.filterLabelLight}>Filtro por Código de Operación</label>
            <select value={s.filtroCodigoOperacion} onChange={(e) => s.setFiltroCodigoOperacion(e.target.value)} className={filterSelectClass}>
              <option value="todos">Todos los códigos</option>
              {s.codigosUnicos.map(codigo => {
                const obj = codigosOperaciones.find(c => c.codigo === codigo)
                return <option key={codigo} value={codigo}>{codigo} - {obj?.nombre || codigo}</option>
              })}
            </select>
          </div>
          <div>
            <label className={isDark ? STYLES.filterLabelDark : STYLES.filterLabelLight}>Filtro por Estado</label>
            <select value={s.filtroEstado} onChange={(e) => s.setFiltroEstado(e.target.value)} className={filterSelectClass}>
              <option value="todas">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="aceptada">Aceptadas</option>
              <option value="rechazada">Rechazadas</option>
            </select>
          </div>
        </div>
        {(s.busqueda || s.filtroDoctor !== 'todos' || s.filtroCodigoOperacion !== 'todos' || s.filtroEstado !== 'todas') && (
          <div className={isDark ? STYLES.counterDark : STYLES.counterLight}>
            Mostrando {s.solicitudesFiltradas.length} de {s.solicitudes.length} solicitudes
          </div>
        )}
      </div>

      <div className={STYLES.chips}>
        {[
          { value: 'todas',    label: 'Todas',      count: s.solicitudes.length },
          { value: 'pendiente', label: 'Pendientes', count: s.solicitudes.filter(x => x.estado === 'pendiente').length },
          { value: 'aceptada',  label: 'Aceptadas',  count: s.solicitudes.filter(x => x.estado === 'aceptada').length },
        ].map((filtro) => (
          <motion.button
            key={filtro.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => s.setFiltroEstado(filtro.value)}
            className={s.filtroEstado === filtro.value ? STYLES.chipActive : STYLES.chipInactive}
          >
            <span>{filtro.label}</span>
            <span className={s.filtroEstado === filtro.value ? STYLES.chipCountActive : STYLES.chipCountInactive}>
              {filtro.count}
            </span>
          </motion.button>
        ))}
      </div>

      <div className={STYLES.cardsGrid}>
        {s.solicitudesFiltradas.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No hay solicitudes"
            description={s.filtroEstado === 'todas'
              ? 'No se encontraron solicitudes en el sistema'
              : `No hay solicitudes con estado "${s.filtroEstado}"`
            }
          />
        ) : (
          s.solicitudesFiltradas.map((solicitud) => (
            <SolicitudCard
              key={solicitud.id}
              solicitud={solicitud}
              isDark={isDark}
              isMedical={theme === 'medical'}
              onVerDetalle={s.setSolicitudDetalle}
              onAceptarHorario={s.handleAceptarHorarioMedico}
              onAvisoReagendacion={s.handleEnviarAvisoReagendacion}
              onAceptarYProgramar={s.handleAceptarYProgramar}
              onGestionarHora={s.handleGestionarHora}
              onReagendar={s.handleReagendar}
              tieneHorarioPreferido={s.tieneHorarioPreferido}
              getPriorityColor={getPriorityColor}
              getPriorityBadge={getPriorityBadge}
              getInitial={getInitial}
              getProcedureName={getProcedureName}
              programarConHorarioDelMedico={s.programarConHorarioDelMedico}
              reagendarConHorarioDelMedico={s.reagendarConHorarioDelMedico}
              solicitudAceptandoHorario={s.solicitudAceptandoHorario}
            />
          ))
        )}
      </div>

      {s.solicitudDetalle && (
        <DetalleModal
          solicitudDetalle={s.solicitudDetalle}
          isDark={isDark}
          isMedical={theme === 'medical'}
          onClose={() => s.setSolicitudDetalle(null)}
          getEstadoBadge={getEstadoBadge}
        />
      )}

      {s.solicitudProgramando && (
        <ProgramacionModal
          solicitudProgramando={s.solicitudProgramando}
          onClose={s.resetForm}
          formProgramacion={s.formProgramacion}
          setFormProgramacion={s.setFormProgramacion}
          seleccionBloques={s.seleccionBloques}
          setSeleccionBloques={s.setSeleccionBloques}
          pabellonesMostrar={s.pabellonesMostrar}
          pabellones={s.pabellones}
          slotsHorarios={s.slotsHorarios}
          getSlotStatus={s.getSlotStatus}
          areContiguous={s.areContiguous}
          sortTimesAsc={s.sortTimesAsc}
          timeToMinutes={s.timeToMinutes}
          showError={s.showError}
          programarCirugia={s.programarCirugia}
        />
      )}

      <Modal
        isOpen={s.showConfirmRechazar}
        onClose={() => { s.setShowConfirmRechazar(false); s.setSolicitudARechazar(null) }}
        title="Confirmar Rechazo"
      >
        {s.solicitudARechazar && (
          <div className={STYLES.detailSections}>
            <p className={`${STYLES.textSl7} ${t.textPrimary}`}>
              ¿Está seguro de que desea rechazar la solicitud de{' '}
              <span className={STYLES.fontBlk}>
                {s.solicitudARechazar.patients?.nombre} {s.solicitudARechazar.patients?.apellido}
              </span>?
            </p>
            <p className={STYLES.textSmSl5}>Esta acción no se puede deshacer.</p>
            <div className={STYLES.flexGap4End}>
              <Button
                variant="secondary"
                onClick={() => { s.setShowConfirmRechazar(false); s.setSolicitudARechazar(null) }}
                disabled={s.rechazarSolicitud.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => s.solicitudARechazar && s.rechazarSolicitud.mutate(s.solicitudARechazar.id)}
                loading={s.rechazarSolicitud.isPending}
                disabled={s.rechazarSolicitud.isPending}
                className={STYLES.btnRed}
              >
                Confirmar Rechazo
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
