import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2, LayoutGrid, Plus, Pencil, Trash2, Check, X,
  CreditCard, Calendar, Users, AlertCircle, CheckCircle2,
  Mail, Phone, Save, Loader2,
} from 'lucide-react'
import { useClinicaInfo, useTrialStatus } from '@/hooks/useClinicaInfo'
import { fetchAllRooms, createRoom, updateRoom, deleteRoom } from '@/services/operatingRoomService'
import { updateClinicaInfo } from '@/services/clinicaService'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:           'max-w-3xl mx-auto space-y-8',
  pageTitle:      'text-2xl font-black uppercase tracking-tighter',
  pageSubtitle:   'text-sm mt-1',
  section:        'rounded-2xl border p-6',
  sectionHeader:  'flex items-center gap-3 mb-5',
  sectionIcon:    'w-9 h-9 rounded-xl flex items-center justify-center',
  sectionTitle:   'font-black text-base uppercase tracking-tight',
  skeletonLine:   'h-5 bg-slate-100 rounded animate-pulse',
  infoGrid:       'grid grid-cols-1 sm:grid-cols-2 gap-4',
  infoLabel:      'text-xs font-bold uppercase tracking-wider mb-1',
  roomList:       'space-y-2',
  roomItemDark:   'flex items-center justify-between px-4 py-3 rounded-xl border border-slate-700 bg-slate-700/40',
  roomItemLight:  'flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 bg-slate-50',
  roomDot:        'w-2 h-2 rounded-full',
  roomInactiveBadge: 'text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full',
  roomActions:    'flex items-center gap-1',
  roomToggleActive: 'p-1.5 rounded-lg transition-colors text-emerald-600 hover:bg-emerald-50',
  roomToggleInactive: 'p-1.5 rounded-lg transition-colors text-slate-400 hover:bg-slate-100',
  roomEditBtn:    'p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors',
  roomDeleteBtn:  'p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors',
  emptyState:     'text-center py-8',
  errorMsg:       'text-red-500 text-xs mt-1',
  modalLabel:     'block text-sm font-semibold text-slate-700 mb-1',
  modalFooter:    'flex justify-end gap-2 pt-2',
  badgeActive:    'inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full',
  badgeExpired:   'inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full',
  badgeTrial:     'inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full',
  iconXs:         'w-3 h-3',
  iconXsMr:       'inline w-3.5 h-3.5 mr-1',
  iconSm:         'w-4 h-4',
  iconMd:         'w-5 h-5 text-blue-600',
  iconViolet:     'w-5 h-5 text-violet-600',
  iconEmerald:    'w-5 h-5 text-emerald-600',
  iconLg:         'w-8 h-8 mx-auto mb-2 opacity-30',
  spaceY3:        'space-y-3',
  spaceY4:        'space-y-4',
  skeletonRoom:   'h-12 bg-slate-100 rounded-xl animate-pulse',
  planRow:        'flex items-center gap-2 flex-wrap',
  sectionTopRow:  'flex items-center justify-between mb-5',
  roomItemRow:    'flex items-center gap-3',
  emptyTextSm:    'text-sm font-medium',
  emptyTextXs:    'text-xs mt-1',
}

export default function Configuracion() {
  const queryClient = useQueryClient()
  const { theme } = useTheme()

  // ── Clínica ──────────────────────────────────────────────
  const { data: clinicaInfo, isLoading: loadingClinica } = useClinicaInfo()
  const trial = useTrialStatus(clinicaInfo)

  // ── Salas ─────────────────────────────────────────────────
  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['all-rooms'],
    queryFn: async () => {
      const { data, error } = await fetchAllRooms()
      if (error) throw error
      return data
    },
  })

  // ── Edición info de contacto ──────────────────────────────
  const [editingContact, setEditingContact] = useState(false)
  const [contactForm, setContactForm]       = useState({ nombre: '', ciudad: '', telefono: '', emailContacto: '' })
  const [contactMsg, setContactMsg]         = useState(null)

  const mutationContact = useMutation({
    mutationFn: () => updateClinicaInfo(contactForm),
    onSuccess: ({ error }) => {
      if (error) {
        setContactMsg({ ok: false, text: 'Error al guardar. Intenta de nuevo.' })
      } else {
        setContactMsg({ ok: true, text: 'Información actualizada.' })
        queryClient.invalidateQueries({ queryKey: ['clinica-info'] })
        setEditingContact(false)
      }
      setTimeout(() => setContactMsg(null), 4000)
    },
  })

  const openContactEdit = () => {
    setContactForm({
      nombre:        clinicaInfo?.nombre         ?? '',
      ciudad:        clinicaInfo?.ciudad         ?? '',
      telefono:      clinicaInfo?.telefono       ?? '',
      emailContacto: clinicaInfo?.email_contacto ?? '',
    })
    setContactMsg(null)
    setEditingContact(true)
  }

  // ── Salas ─────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [roomName, setRoomName] = useState('')
  const [roomError, setRoomError] = useState('')

  const openCreate = () => {
    setEditingRoom(null)
    setRoomName('')
    setRoomError('')
    setShowModal(true)
  }

  const openEdit = (room) => {
    setEditingRoom(room)
    setRoomName(room.nombre)
    setRoomError('')
    setShowModal(true)
  }

  const mutationCreate = useMutation({
    mutationFn: () => createRoom({ nombre: roomName.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms'] })
      setShowModal(false)
    },
    onError: (err) => setRoomError(err.message || 'Error al crear sala'),
  })

  const mutationUpdate = useMutation({
    mutationFn: () => updateRoom(editingRoom.id, { nombre: roomName.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms'] })
      setShowModal(false)
    },
    onError: (err) => setRoomError(err.message || 'Error al actualizar sala'),
  })

  const mutationToggle = useMutation({
    mutationFn: (room) => updateRoom(room.id, { activo: !room.activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-rooms'] }),
  })

  const mutationDelete = useMutation({
    mutationFn: (roomId) => deleteRoom(roomId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-rooms'] }),
  })

  const handleSave = () => {
    if (!roomName.trim()) { setRoomError('El nombre es requerido'); return }
    if (roomName.trim().length < 2) { setRoomError('Mínimo 2 caracteres'); return }
    editingRoom ? mutationUpdate.mutate() : mutationCreate.mutate()
  }

  const t = tc(theme)
  const isDark = theme === 'dark'

  const card  = `${t.cardBg} ${t.border}`
  const label = t.textMuted
  const title = t.textPrimary
  const input = `${t.inputBg} ${t.borderInput} ${t.textPrimary} placeholder-slate-400 focus:ring-blue-500`

  // ── Plan badge ────────────────────────────────────────────
  const estadoBadge = () => {
    if (!clinicaInfo) return null
    if (clinicaInfo.estado === 'activo') {
      return <span className={STYLES.badgeActive}><CheckCircle2 className={STYLES.iconXs} /> Plan activo</span>
    }
    if (trial.isExpired) {
      return <span className={STYLES.badgeExpired}><AlertCircle className={STYLES.iconXs} /> Trial expirado</span>
    }
    return <span className={STYLES.badgeTrial}><Calendar className={STYLES.iconXs} /> {trial.daysLeft} días de trial</span>
  }

  return (
    <div className={STYLES.page}>
      <div>
        <h1 className={`${STYLES.pageTitle} ${title}`}>Configuración</h1>
        <p className={`${STYLES.pageSubtitle} ${label}`}>Administra tu clínica, salas y plan.</p>
      </div>

      {/* ── Información de la clínica ── */}
      <section className={`${STYLES.section} ${card}`}>
        <div className={`${STYLES.sectionTopRow}`}>
          <div className={STYLES.sectionHeader} style={{ marginBottom: 0 }}>
            <div className={`${STYLES.sectionIcon} bg-blue-100`}>
              <Building2 className={STYLES.iconMd} />
            </div>
            <h2 className={`${STYLES.sectionTitle} ${title}`}>Tu clínica</h2>
          </div>
          {!editingContact && clinicaInfo && (
            <Button variant="ghost" size="sm" onClick={openContactEdit} icon={<Pencil className={STYLES.iconSm} />}>
              Editar
            </Button>
          )}
        </div>

        {loadingClinica ? (
          <div className={`${STYLES.spaceY3} mt-5`}>
            {[1,2,3].map(i => <div key={i} className={STYLES.skeletonLine} />)}
          </div>
        ) : clinicaInfo ? (
          <>
            {/* Vista de solo lectura: plan */}
            <div className={`${STYLES.infoGrid} mt-5`}>
              <div>
                <p className={`${STYLES.infoLabel} ${label}`}>Plan</p>
                <div className={STYLES.planRow}>
                  <p className={`font-semibold ${title}`}>{clinicaInfo.planes?.nombre ?? '—'}</p>
                  {estadoBadge()}
                </div>
              </div>
              {clinicaInfo.planes && (
                <div>
                  <p className={`${STYLES.infoLabel} ${label}`}>Límites</p>
                  <p className={`text-sm ${title}`}>
                    <Users className={STYLES.iconXsMr} />
                    {clinicaInfo.planes.max_doctores >= 999 ? 'Ilimitados' : `${clinicaInfo.planes.max_doctores} médicos`}
                    {' · '}
                    <LayoutGrid className={STYLES.iconXsMr} />
                    {clinicaInfo.planes.max_salas >= 99 ? 'Ilimitadas' : `${clinicaInfo.planes.max_salas} salas`}
                  </p>
                </div>
              )}
            </div>

            {/* Separador */}
            <div className={`my-5 border-t ${t.border}`} />

            {/* Información de contacto — editable */}
            {editingContact ? (
              <div className="space-y-4">
                <p className={`text-xs font-black uppercase tracking-wider ${label}`}>Información de contacto</p>
                <div className={STYLES.infoGrid}>
                  <div className="space-y-1">
                    <label className={`text-xs font-bold ${label}`}>Nombre de la clínica</label>
                    <input
                      type="text"
                      value={contactForm.nombre}
                      onChange={e => setContactForm(f => ({ ...f, nombre: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${input}`}
                      placeholder="Nombre de la clínica"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-xs font-bold ${label}`}>Ciudad</label>
                    <input
                      type="text"
                      value={contactForm.ciudad}
                      onChange={e => setContactForm(f => ({ ...f, ciudad: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${input}`}
                      placeholder="Santiago"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-xs font-bold ${label}`}>
                      <Mail className="inline w-3 h-3 mr-1" />Correo de contacto
                    </label>
                    <input
                      type="email"
                      value={contactForm.emailContacto}
                      onChange={e => setContactForm(f => ({ ...f, emailContacto: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${input}`}
                      placeholder="contacto@clinica.cl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-xs font-bold ${label}`}>
                      <Phone className="inline w-3 h-3 mr-1" />Teléfono
                    </label>
                    <input
                      type="tel"
                      value={contactForm.telefono}
                      onChange={e => setContactForm(f => ({ ...f, telefono: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${input}`}
                      placeholder="+56 2 2345 6789"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => mutationContact.mutate()}
                    disabled={mutationContact.isPending}
                    icon={mutationContact.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className={STYLES.iconSm} />}
                  >
                    {mutationContact.isPending ? 'Guardando…' : 'Guardar'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingContact(false)}>
                    Cancelar
                  </Button>
                  {contactMsg && (
                    <p className={`text-sm font-semibold ${contactMsg.ok ? 'text-green-500' : 'text-red-500'}`}>
                      {contactMsg.text}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className={STYLES.infoGrid}>
                <div>
                  <p className={`${STYLES.infoLabel} ${label}`}>Nombre</p>
                  <p className={`font-semibold ${title}`}>{clinicaInfo.nombre || '—'}</p>
                </div>
                <div>
                  <p className={`${STYLES.infoLabel} ${label}`}>Ciudad</p>
                  <p className={`font-semibold ${title}`}>{clinicaInfo.ciudad || '—'}</p>
                </div>
                <div>
                  <p className={`${STYLES.infoLabel} ${label}`}>
                    <Mail className="inline w-3 h-3 mr-1" />Correo de contacto
                  </p>
                  <p className={`font-semibold ${title}`}>{clinicaInfo.email_contacto || <span className={label}>Sin correo configurado</span>}</p>
                </div>
                <div>
                  <p className={`${STYLES.infoLabel} ${label}`}>
                    <Phone className="inline w-3 h-3 mr-1" />Teléfono
                  </p>
                  <p className={`font-semibold ${title}`}>{clinicaInfo.telefono || <span className={label}>Sin teléfono configurado</span>}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className={`text-sm mt-5 ${label}`}>No se pudo cargar la información.</p>
        )}
      </section>

      {/* ── Salas de pabellón ── */}
      <section className={`${STYLES.section} ${card}`}>
        <div className={STYLES.sectionTopRow}>
          <div className={STYLES.sectionHeader} style={{ marginBottom: 0 }}>
            <div className={`${STYLES.sectionIcon} bg-violet-100`}>
              <LayoutGrid className={STYLES.iconViolet} />
            </div>
            <h2 className={`${STYLES.sectionTitle} ${title}`}>Salas de pabellón</h2>
          </div>
          <Button variant="primary" size="sm" onClick={openCreate} icon={<Plus className={STYLES.iconSm} />}>
            Nueva sala
          </Button>
        </div>

        {loadingRooms ? (
          <div className={STYLES.spaceY3}>
            {[1,2].map(i => <div key={i} className={STYLES.skeletonRoom} />)}
          </div>
        ) : rooms.length === 0 ? (
          <div className={`${STYLES.emptyState} ${label}`}>
            <LayoutGrid className={STYLES.iconLg} />
            <p className={STYLES.emptyTextSm}>No hay salas configuradas.</p>
            <p className={STYLES.emptyTextXs}>Agrega tu primera sala para comenzar a programar cirugías.</p>
          </div>
        ) : (
          <ul className={STYLES.roomList}>
            {rooms.map(room => (
              <li key={room.id} className={isDark ? STYLES.roomItemDark : STYLES.roomItemLight}>
                <div className={STYLES.roomItemRow}>
                  <div className={`${STYLES.roomDot} ${room.activo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={`font-semibold text-sm ${room.activo ? title : label}`}>{room.nombre}</span>
                  {!room.activo && <span className={STYLES.roomInactiveBadge}>Inactiva</span>}
                </div>
                <div className={STYLES.roomActions}>
                  <button
                    onClick={() => mutationToggle.mutate(room)}
                    title={room.activo ? 'Desactivar' : 'Activar'}
                    className={room.activo ? STYLES.roomToggleActive : STYLES.roomToggleInactive}
                  >
                    <Check className={STYLES.iconSm} />
                  </button>
                  <button onClick={() => openEdit(room)} className={STYLES.roomEditBtn}>
                    <Pencil className={STYLES.iconSm} />
                  </button>
                  <button onClick={() => mutationDelete.mutate(room.id)} className={STYLES.roomDeleteBtn}>
                    <Trash2 className={STYLES.iconSm} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Plan y facturación ── */}
      <section className={`${STYLES.section} ${card}`}>
        <div className={STYLES.sectionHeader}>
          <div className={`${STYLES.sectionIcon} bg-emerald-100`}>
            <CreditCard className={STYLES.iconEmerald} />
          </div>
          <h2 className={`${STYLES.sectionTitle} ${title}`}>Plan y facturación</h2>
        </div>
        <p className={`text-sm mb-4 ${label}`}>Cambia tu plan, revisa tu historial de pagos o cancela tu suscripción.</p>
        <Button variant="secondary" onClick={() => window.location.assign('/pabellon/facturacion')}>
          Ver facturación →
        </Button>
      </section>

      {/* Modal crear / editar sala */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRoom ? 'Editar sala' : 'Nueva sala de pabellón'}
      >
        <div className={STYLES.spaceY4}>
          <div>
            <label className={STYLES.modalLabel}>Nombre de la sala</label>
            <input
              type="text"
              value={roomName}
              onChange={e => { setRoomName(e.target.value); setRoomError('') }}
              placeholder="Ej: Pabellón 1"
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${input}`}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            {roomError && <p className={STYLES.errorMsg}>{roomError}</p>}
          </div>
          <div className={STYLES.modalFooter}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={mutationCreate.isPending || mutationUpdate.isPending}
            >
              {mutationCreate.isPending || mutationUpdate.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
