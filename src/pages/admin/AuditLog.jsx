import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScrollText, RefreshCw, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { supabase } from '@/config/supabase'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDebounce } from '@/hooks/useDebounce'
import { exportToCsv } from '@/utils/exportCsv'

const PAGE_SIZE = 20

const ACCION_COLOR = {
  LOGIN:   'bg-blue-900/40 text-blue-400 border-blue-800',
  INSERT:  'bg-emerald-900/40 text-emerald-400 border-emerald-800',
  UPDATE:  'bg-amber-900/40 text-amber-400 border-amber-800',
  DELETE:  'bg-red-900/40 text-red-400 border-red-800',
}

const S = {
  page:         'space-y-6 max-w-6xl',
  header:       'flex items-center justify-between',
  title:        'text-2xl font-black text-white uppercase tracking-tighter',
  subtitle:     'text-slate-400 text-sm mt-1',
  refreshBtn:   'flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-xl transition-colors',
  filtersRow:   'flex flex-wrap gap-3 items-center',
  searchWrap:   'relative flex-1 min-w-48',
  searchIcon:   'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500',
  searchInput:  'w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2 text-sm placeholder-slate-500 focus:border-blue-500 focus:outline-none',
  select:       'bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none',
  tableCard:    'bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden',
  tableHead:    'grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] px-6 py-3 border-b border-slate-700 text-[10px] font-black text-slate-500 uppercase tracking-widest gap-4',
  tableBody:    'divide-y divide-slate-700/40',
  row:          'grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] px-6 py-3.5 items-center gap-4 hover:bg-slate-700/20 transition-colors',
  userEmail:    'text-white text-sm font-medium truncate',
  userRole:     'text-xs text-slate-500',
  badge:        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase border',
  tabla:        'text-slate-400 text-xs font-mono',
  ip:           'text-slate-500 text-xs font-mono',
  time:         'text-slate-500 text-xs',
  emptyState:   'p-12 text-center text-slate-500 text-sm',
  loadingState: 'p-12 text-center text-slate-500 text-sm',
  pagination:   'flex items-center justify-between px-6 py-4 border-t border-slate-700',
  pageInfo:     'text-xs text-slate-500',
  pageButtons:  'flex items-center gap-2',
  pageBtn:      'p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors',
}

export default function AuditLog() {
  const [page, setPage]                   = useState(0)
  const [busqueda, setBusqueda]           = useState('')
  const [filtroAccion, setFiltroAccion]   = useState('')
  const [fechaDesde, setFechaDesde]       = useState('')
  const [fechaHasta, setFechaHasta]       = useState('')
  const debouncedSearch = useDebounce(busqueda, 300)

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', page, fechaDesde, fechaHasta],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_audit_logs_admin', {
        p_limit:       PAGE_SIZE,
        p_offset:      page * PAGE_SIZE,
        p_fecha_desde: fechaDesde ? new Date(fechaDesde).toISOString() : null,
        p_fecha_hasta: fechaHasta ? new Date(fechaHasta + 'T23:59:59').toISOString() : null,
      })
      if (error) throw error
      return data ?? []
    },
  })

  const handleExportCsv = () => {
    exportToCsv(
      filtered.map(r => ({
        Email:   r.user_email ?? 'Sistema',
        Rol:     r.user_role ?? '—',
        Clínica: r.clinica_nombre ?? '—',
        Acción:  r.accion,
        Tabla:   r.tabla_afectada,
        IP:      r.ip_address ?? '—',
        Fecha:   format(new Date(r.created_at), 'dd/MM/yyyy HH:mm:ss'),
      })),
      'auditoria'
    )
  }

  const filtered = data.filter(r => {
    if (filtroAccion && r.accion !== filtroAccion) return false
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      return (
        r.user_email?.toLowerCase().includes(q) ||
        r.clinica_nombre?.toLowerCase().includes(q) ||
        r.tabla_afectada?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const acciones = [...new Set(data.map(r => r.accion))].filter(Boolean)

  return (
    <div className={S.page}>
      <div className={S.header}>
        <div>
          <h1 className={S.title}>Log de Auditoría</h1>
          <p className={S.subtitle}>Registro de todas las acciones en la plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className={`${S.refreshBtn} disabled:opacity-40`}
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button onClick={() => refetch()} className={S.refreshBtn}>
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className={S.filtersRow}>
          <div className={S.searchWrap}>
            <Search className={S.searchIcon} />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por email, clínica o tabla..."
              className={S.searchInput}
            />
          </div>
          <select value={filtroAccion} onChange={e => { setFiltroAccion(e.target.value); setPage(0) }} className={S.select}>
            <option value="">Todas las acciones</option>
            {acciones.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Rango de fechas:</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={e => { setFechaDesde(e.target.value); setPage(0) }}
            className={`${S.select} text-xs`}
          />
          <span className="text-slate-600 text-xs">—</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={e => { setFechaHasta(e.target.value); setPage(0) }}
            className={`${S.select} text-xs`}
          />
          {(fechaDesde || fechaHasta) && (
            <button
              onClick={() => { setFechaDesde(''); setFechaHasta(''); setPage(0) }}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className={S.tableCard}>
        <div className={S.tableHead}>
          <span>Usuario</span>
          <span>Rol</span>
          <span>Acción</span>
          <span>Tabla</span>
          <span>IP</span>
          <span>Fecha</span>
        </div>

        {isLoading ? (
          <div className={S.loadingState}>Cargando registros…</div>
        ) : filtered.length === 0 ? (
          <div className={S.emptyState}>No hay registros de auditoría.</div>
        ) : (
          <ul className={S.tableBody}>
            {filtered.map(r => {
              const color = ACCION_COLOR[r.accion] ?? 'bg-slate-700 text-slate-400 border-slate-600'
              return (
                <li key={r.id} className={S.row}>
                  <div>
                    <p className={S.userEmail}>{r.user_email ?? 'Sistema'}</p>
                    <p className={S.userRole}>{r.clinica_nombre ?? '—'}</p>
                  </div>
                  <p className={S.userRole}>{r.user_role ?? '—'}</p>
                  <span className={`${S.badge} ${color}`}>{r.accion}</span>
                  <p className={S.tabla}>{r.tabla_afectada}</p>
                  <p className={S.ip}>{r.ip_address ?? '—'}</p>
                  <p className={S.time} title={format(new Date(r.created_at), 'dd/MM/yyyy HH:mm:ss')}>
                    {formatDistanceToNow(new Date(r.created_at), { locale: es, addSuffix: true })}
                  </p>
                </li>
              )
            })}
          </ul>
        )}

        {/* Paginación */}
        <div className={S.pagination}>
          <p className={S.pageInfo}>Página {page + 1} · {filtered.length} registros</p>
          <div className={S.pageButtons}>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className={S.pageBtn}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={data.length < PAGE_SIZE} className={S.pageBtn}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
