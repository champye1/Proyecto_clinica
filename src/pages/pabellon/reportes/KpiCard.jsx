export default function KpiCard({ label, value, sub, icon: Icon, color, loading, isDark }) {
  const bg = {
    blue:   isDark ? 'bg-blue-900/30 border-blue-800'     : 'bg-blue-50 border-blue-100',
    green:  isDark ? 'bg-green-900/30 border-green-800'   : 'bg-green-50 border-green-100',
    amber:  isDark ? 'bg-amber-900/30 border-amber-800'   : 'bg-amber-50 border-amber-100',
    indigo: isDark ? 'bg-indigo-900/30 border-indigo-800' : 'bg-indigo-50 border-indigo-100',
  }
  const ic = { blue: 'text-blue-500', green: 'text-green-500', amber: 'text-amber-500', indigo: 'text-indigo-500' }

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${bg[color]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg" />
          ) : (
            <p className={`text-2xl sm:text-3xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {value ?? '—'}
            </p>
          )}
          {sub && !loading && (
            <p className={`text-[10px] font-semibold mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{sub}</p>
          )}
        </div>
        <div className={`shrink-0 mt-1 ${ic[color]}`}><Icon size={22} /></div>
      </div>
    </div>
  )
}
