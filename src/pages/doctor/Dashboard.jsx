import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { getCurrentUser } from '@/services/authService'
import { Calendar, FileText, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTheme } from '@/contexts/ThemeContext'
import { MetricSkeleton, CardSkeleton } from '@/components/common/Skeleton'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:                  'space-y-6',
  skeletonGrid:          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
  errorWrap:             'text-center py-8',
  errorTextDark:         'text-slate-300',
  errorTextLight:        'text-gray-600',
  titleDark:             'text-3xl font-bold text-white',
  titleLight:            'text-3xl font-bold text-gray-900',
  dateDark:              'mt-2 text-slate-400',
  dateLight:             'mt-2 text-gray-600',
  metricsGrid:           'grid grid-cols-1 md:grid-cols-3 gap-6',
  metricInner:           'flex items-center justify-between',
  metricLabelDark:       'text-sm text-slate-400',
  metricLabelLight:      'text-sm text-gray-600',
  metricValueDark:       'text-3xl font-bold mt-2 text-white',
  metricValueLight:      'text-3xl font-bold mt-2 text-gray-900',
  iconBlueDark:          'bg-blue-900/50 p-3 rounded-full',
  iconBlueLight:         'bg-blue-100 p-3 rounded-full',
  iconBlue:              'w-8 h-8 text-blue-400',
  iconBlueDay:           'w-8 h-8 text-blue-600',
  iconYellowDark:        'bg-yellow-900/50 p-3 rounded-full',
  iconYellowLight:       'bg-yellow-100 p-3 rounded-full',
  iconYellow:            'w-8 h-8 text-yellow-400',
  iconYellowDay:         'w-8 h-8 text-yellow-600',
  iconGreenDark:         'bg-green-900/50 p-3 rounded-full',
  iconGreenLight:        'bg-green-100 p-3 rounded-full',
  iconGreen:             'w-8 h-8 text-green-400',
  iconGreenDay:          'w-8 h-8 text-green-600',
  twoColGrid:            'grid grid-cols-1 lg:grid-cols-2 gap-6',
  sectionTitleDark:      'text-xl font-bold mb-4 text-white',
  sectionTitleLight:     'text-xl font-bold mb-4 text-gray-900',
  cardList:              'space-y-3',
  emptyDark:             'text-center py-4 text-slate-300',
  emptyLight:            'text-center py-4 text-gray-500',
  itemDark:              'border rounded-lg p-4 transition-colors bg-slate-800 border-slate-700 hover:bg-slate-700',
  itemLight:             'border rounded-lg p-4 transition-colors bg-white border-slate-200 hover:bg-slate-50',
  itemHeader:            'flex justify-between items-start',
  itemNameDark:          'font-medium text-white',
  itemNameLight:         'font-medium text-gray-900',
  itemMetaDark:          'text-sm text-slate-200',
  itemMetaLight:         'text-sm text-gray-600',
  itemStateDark:         'text-sm mt-1 text-slate-300',
  itemStateLight:        'text-sm mt-1 text-gray-500',
  badgeGreenDark:        'px-2 py-1 text-xs rounded bg-green-900 text-green-200',
  badgeGreenLight:       'px-2 py-1 text-xs rounded bg-green-100 text-green-800',
  reminderAcceptedDark:  'border rounded-lg p-4 transition-colors bg-green-900/30 border-green-700 hover:bg-green-900/50',
  reminderAcceptedLight: 'border rounded-lg p-4 transition-colors bg-green-50 border-green-200 hover:bg-green-100',
  reminderHeaderRow:     'flex items-start justify-between',
  reminderTitleDark:     'font-medium text-green-200',
  reminderTitleLight:    'font-medium text-green-800',
  reminderPatientDark:   'text-sm mt-1 text-slate-100',
  reminderPatientLight:  'text-sm mt-1 text-gray-700',
  reminderDateDark:      'text-sm text-slate-200',
  reminderDateLight:     'text-sm text-gray-600',
  reminderReschDark:     'text-xs mt-0.5 text-amber-300',
  reminderReschLight:    'text-xs mt-0.5 text-amber-700',
  reminderCodeDark:      'text-xs mt-2 text-slate-300',
  reminderCodeLight:     'text-xs mt-2 text-gray-500',
  reminderIcon:          'w-5 h-5 flex-shrink-0 ml-2',
  reminderIconDark:      'text-green-400',
  reminderIconLight:     'text-green-600',
  reminderRelatedDark:   'mt-2 p-2 rounded bg-blue-900/30',
  reminderRelatedLight:  'mt-2 p-2 rounded bg-blue-50',
  reminderRelTextDark:   'text-xs text-blue-200',
  reminderRelTextLight:  'text-xs text-blue-800',
  reminderTsDark:        'text-xs mt-2 text-slate-400',
  reminderTsLight:       'text-xs mt-2 text-gray-400',
  badgeAmberDark:        'px-2 py-1 text-xs rounded bg-amber-900 text-amber-200',
  badgeAmberLight:       'px-2 py-1 text-xs rounded bg-amber-100 text-amber-800',
  badgeBlueDark:         'px-2 py-1 text-xs rounded bg-blue-900 text-blue-200',
  badgeBlueLight:        'px-2 py-1 text-xs rounded bg-blue-100 text-blue-800',
  card:                  'card',
  flex1:                 'flex-1',
}

export default function Dashboard() {
  const { theme } = useTheme()
  const { data: doctor, isLoading: loadingDoctor, isError: errorDoctor } = useQuery({
    queryKey: ['doctor-actual'],
    queryFn: async () => {
      const { user } = await getCurrentUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error) throw error
      return data
    },
  })

  const { data: cirugiasHoy = [] } = useQuery({
    queryKey: ['cirugias-doctor-hoy'],
    queryFn: async () => {
      if (!doctor) return []

      const { data, error } = await supabase
        .from('surgeries')
        .select(`
          *,
          patients:patient_id(nombre, apellido, rut),
          operating_rooms:operating_room_id(nombre)
        `)
        .eq('doctor_id', doctor.id)
        .eq('fecha', format(new Date(), 'yyyy-MM-dd'))
        .is('deleted_at', null)
        .order('hora_inicio', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!doctor,
  })

  const { data: solicitudesPendientes = [] } = useQuery({
    queryKey: ['solicitudes-doctor-pendientes'],
    queryFn: async () => {
      if (!doctor) return []

      const { data, error } = await supabase
        .from('surgery_requests')
        .select(`
          *,
          patients:patient_id(nombre, apellido)
        `)
        .eq('doctor_id', doctor.id)
        .eq('estado', 'pendiente')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!doctor,
  })

  const { data: cirugiasConfirmadas = [] } = useQuery({
    queryKey: ['cirugias-doctor-confirmadas'],
    queryFn: async () => {
      if (!doctor) return []

      const { data, error } = await supabase
        .from('surgeries')
        .select(`
          *,
          patients:patient_id(nombre, apellido),
          operating_rooms:operating_room_id(nombre)
        `)
        .eq('doctor_id', doctor.id)
        .gte('fecha', format(new Date(), 'yyyy-MM-dd'))
        .is('deleted_at', null)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true })
        .limit(5)
      
      if (error) throw error
      return data
    },
    enabled: !!doctor,
  })

  const { data: recordatorios = [] } = useQuery({
    queryKey: ['recordatorios-doctor'],
    queryFn: async () => {
      const { user } = await getCurrentUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) {
        logger.errorWithContext('Error al obtener recordatorios', error)
        return []
      }
      return data || []
    },
  })

  const { data: cirugiasAceptadas = [] } = useQuery({
    queryKey: ['cirugias-aceptadas-doctor'],
    queryFn: async () => {
      if (!doctor) return []

      const { data, error } = await supabase
        .from('surgeries')
        .select(`
          *,
          patients:patient_id(nombre, apellido, rut),
          operating_rooms:operating_room_id(nombre),
          surgery_requests:surgery_request_id(codigo_operacion)
        `)
        .eq('doctor_id', doctor.id)
        .gte('fecha', format(new Date(), 'yyyy-MM-dd'))
        .is('deleted_at', null)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true })
        .limit(5)
      
      if (error) throw error
      return data
    },
    enabled: !!doctor,
  })

  const isDark = theme === 'dark'

  if (loadingDoctor) {
    return (
      <div className={STYLES.page}>
        <div className={STYLES.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)}
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }
  if (errorDoctor || !doctor) {
    return (
      <div className={STYLES.errorWrap}>
        <p className={isDark ? STYLES.errorTextDark : STYLES.errorTextLight}>
          {errorDoctor ? 'Error al cargar el perfil.' : 'No se encontró perfil de doctor. Contacte al administrador.'}
        </p>
      </div>
    )
  }

  return (
    <div className={STYLES.page}>
      <div>
        <h1 className={isDark ? STYLES.titleDark : STYLES.titleLight}>
          Bienvenido, Dr. {doctor.nombre} {doctor.apellido}
        </h1>
        <p className={isDark ? STYLES.dateDark : STYLES.dateLight}>
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Métricas */}
      <div className={STYLES.metricsGrid}>
        <div className={STYLES.card}>
          <div className={STYLES.metricInner}>
            <div>
              <p className={isDark ? STYLES.metricLabelDark : STYLES.metricLabelLight}>Cirugías Hoy</p>
              <p className={isDark ? STYLES.metricValueDark : STYLES.metricValueLight}>
                {cirugiasHoy.length}
              </p>
            </div>
            <div className={isDark ? STYLES.iconBlueDark : STYLES.iconBlueLight}>
              <Calendar className={isDark ? STYLES.iconBlue : STYLES.iconBlueDay} />
            </div>
          </div>
        </div>

        <div className={STYLES.card}>
          <div className={STYLES.metricInner}>
            <div>
              <p className={isDark ? STYLES.metricLabelDark : STYLES.metricLabelLight}>Solicitudes Pendientes</p>
              <p className={isDark ? STYLES.metricValueDark : STYLES.metricValueLight}>
                {solicitudesPendientes.length}
              </p>
            </div>
            <div className={isDark ? STYLES.iconYellowDark : STYLES.iconYellowLight}>
              <Clock className={isDark ? STYLES.iconYellow : STYLES.iconYellowDay} />
            </div>
          </div>
        </div>

        <div className={STYLES.card}>
          <div className={STYLES.metricInner}>
            <div>
              <p className={isDark ? STYLES.metricLabelDark : STYLES.metricLabelLight}>Cirugías Confirmadas</p>
              <p className={isDark ? STYLES.metricValueDark : STYLES.metricValueLight}>
                {cirugiasConfirmadas.length}
              </p>
            </div>
            <div className={isDark ? STYLES.iconGreenDark : STYLES.iconGreenLight}>
              <CheckCircle2 className={isDark ? STYLES.iconGreen : STYLES.iconGreenDay} />
            </div>
          </div>
        </div>
      </div>

      <div className={STYLES.twoColGrid}>
        {/* Cirugías de hoy */}
        <div className={STYLES.card}>
          <h2 className={isDark ? STYLES.sectionTitleDark : STYLES.sectionTitleLight}>Cirugías de Hoy</h2>
          <div className={STYLES.cardList}>
            {cirugiasHoy.length === 0 ? (
              <p className={isDark ? STYLES.emptyDark : STYLES.emptyLight}>No hay cirugías programadas para hoy</p>
            ) : (
              cirugiasHoy.map(cirugia => (
                <div key={cirugia.id} className={isDark ? STYLES.itemDark : STYLES.itemLight}>
                  <div className={STYLES.itemHeader}>
                    <div>
                      <p className={isDark ? STYLES.itemNameDark : STYLES.itemNameLight}>
                        {cirugia.patients?.nombre} {cirugia.patients?.apellido}
                      </p>
                      <p className={isDark ? STYLES.itemMetaDark : STYLES.itemMetaLight}>
                        {cirugia.operating_rooms?.nombre} - {cirugia.hora_inicio}
                      </p>
                      <p className={isDark ? STYLES.itemStateDark : STYLES.itemStateLight}>
                        Estado: {cirugia.estado}
                      </p>
                    </div>
                    <span className={isDark ? STYLES.badgeGreenDark : STYLES.badgeGreenLight}>
                      Confirmada
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Muro de Recordatorios */}
        <div className={STYLES.card}>
          <h2 className={isDark ? STYLES.sectionTitleDark : STYLES.sectionTitleLight}>Muro de Recordatorios</h2>
          <div className={STYLES.cardList}>
            {recordatorios.length === 0 && cirugiasAceptadas.length === 0 ? (
              <p className={isDark ? STYLES.emptyDark : STYLES.emptyLight}>No hay recordatorios nuevos</p>
            ) : (
              <>
                {/* Operaciones Aceptadas */}
                {cirugiasAceptadas.map(cirugia => (
                  <div key={cirugia.id} className={isDark ? STYLES.reminderAcceptedDark : STYLES.reminderAcceptedLight}>
                    <div className={STYLES.reminderHeaderRow}>
                      <div className={STYLES.flex1}>
                        <p className={isDark ? STYLES.reminderTitleDark : STYLES.reminderTitleLight}>Operación Aceptada</p>
                        <p className={isDark ? STYLES.reminderPatientDark : STYLES.reminderPatientLight}>
                          {cirugia.patients?.nombre} {cirugia.patients?.apellido}
                        </p>
                        <p className={isDark ? STYLES.reminderDateDark : STYLES.reminderDateLight}>
                          {format(new Date(cirugia.fecha), 'dd/MM/yyyy')} a las {typeof cirugia.hora_inicio === 'string' ? cirugia.hora_inicio.substring(0, 5) : cirugia.hora_inicio}
                        </p>
                        {cirugia.estado_hora === 'reagendado' && cirugia.fecha_anterior && (
                          <p className={isDark ? STYLES.reminderReschDark : STYLES.reminderReschLight}>
                            Fecha original (ya no aplica): {format(new Date(cirugia.fecha_anterior), 'dd/MM/yyyy')} a las {typeof cirugia.hora_inicio_anterior === 'string' ? cirugia.hora_inicio_anterior.substring(0, 5) : cirugia.hora_inicio_anterior}
                          </p>
                        )}
                        <p className={isDark ? STYLES.reminderDateDark : STYLES.reminderDateLight}>
                          Pabellón: {cirugia.operating_rooms?.nombre}
                        </p>
                        <p className={isDark ? STYLES.reminderCodeDark : STYLES.reminderCodeLight}>
                          Código: {cirugia.surgery_requests?.codigo_operacion}
                        </p>
                      </div>
                      <CheckCircle2 className={`${STYLES.reminderIcon} ${isDark ? STYLES.reminderIconDark : STYLES.reminderIconLight}`} />
                    </div>
                  </div>
                ))}

                {/* Recordatorios Generales */}
                {recordatorios.filter(r => r.tipo !== 'operacion_aceptada').map(recordatorio => (
                  <div key={recordatorio.id} className={isDark ? STYLES.itemDark : STYLES.itemLight}>
                    <p className={isDark ? STYLES.itemNameDark : STYLES.itemNameLight}>{recordatorio.titulo}</p>
                    <p className={isDark ? STYLES.itemMetaDark : STYLES.itemMetaLight}>{recordatorio.contenido}</p>
                    {recordatorio.relacionado_con && (
                      <div className={isDark ? STYLES.reminderRelatedDark : STYLES.reminderRelatedLight}>
                        <p className={isDark ? STYLES.reminderRelTextDark : STYLES.reminderRelTextLight}>
                          Relacionado con cirugía ID: {recordatorio.relacionado_con}
                        </p>
                      </div>
                    )}
                    <p className={isDark ? STYLES.reminderTsDark : STYLES.reminderTsLight}>
                      {format(new Date(recordatorio.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Próximas cirugías confirmadas */}
      <div className="card">
        <h2 className={isDark ? STYLES.sectionTitleDark : STYLES.sectionTitleLight}>Próximas Cirugías Confirmadas</h2>
        <div className={STYLES.cardList}>
          {cirugiasConfirmadas.length === 0 ? (
            <p className={isDark ? STYLES.emptyDark : STYLES.emptyLight}>No hay cirugías confirmadas próximas</p>
          ) : (
            cirugiasConfirmadas.map(cirugia => (
              <div key={cirugia.id} className={isDark ? STYLES.itemDark : STYLES.itemLight}>
                <div className={STYLES.itemHeader}>
                  <div>
                    <p className={isDark ? STYLES.itemNameDark : STYLES.itemNameLight}>
                      {cirugia.patients?.nombre} {cirugia.patients?.apellido}
                    </p>
                    <p className={isDark ? STYLES.itemMetaDark : STYLES.itemMetaLight}>
                      {format(new Date(cirugia.fecha), 'dd/MM/yyyy')} - {typeof cirugia.hora_inicio === 'string' ? cirugia.hora_inicio.substring(0, 5) : cirugia.hora_inicio}
                    </p>
                    {cirugia.estado_hora === 'reagendado' && cirugia.fecha_anterior && (
                      <p className={isDark ? STYLES.reminderReschDark : STYLES.reminderReschLight}>
                        Fecha original (ya no aplica): {format(new Date(cirugia.fecha_anterior), 'dd/MM/yyyy')} a las {typeof cirugia.hora_inicio_anterior === 'string' ? cirugia.hora_inicio_anterior.substring(0, 5) : cirugia.hora_inicio_anterior}
                      </p>
                    )}
                    <p className={isDark ? STYLES.itemStateDark : STYLES.itemStateLight}>
                      {cirugia.operating_rooms?.nombre}
                    </p>
                  </div>
                  <span className={
                    cirugia.estado_hora === 'reagendado'
                      ? (isDark ? STYLES.badgeAmberDark : STYLES.badgeAmberLight)
                      : (isDark ? STYLES.badgeBlueDark : STYLES.badgeBlueLight)
                  }>
                    {cirugia.estado_hora === 'reagendado' ? 'Reagendada' : 'Programada'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
