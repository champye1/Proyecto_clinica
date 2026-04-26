import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, Activity, Users, Clock } from 'lucide-react'
import Card from '@/components/common/Card'
import { STYLES } from './constants'

function ChartTooltip({ isDark, ...rest }) {
  return (
    <Tooltip
      contentStyle={{
        borderRadius: '0.75rem',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        backgroundColor: isDark ? '#1e293b' : '#fff',
        fontSize: '11px',
        color: isDark ? '#fff' : '#0f172a',
        padding: '10px 14px',
      }}
      labelStyle={{ fontWeight: 700, marginBottom: 4, color: isDark ? '#fff' : '#0f172a' }}
      itemStyle={{ color: isDark ? '#cbd5e1' : '#475569' }}
      {...rest}
    />
  )
}

export default function ChartsGrid({ dailyData, statusData, doctorData, roomData, isDark }) {
  const chartColor = isDark ? '#94a3b8' : '#64748b'
  const gridColor  = isDark ? '#334155' : '#e2e8f0'
  const chartTitle = `${STYLES.chartTitle} ${isDark ? 'text-white' : 'text-slate-800'}`
  const xInterval  = dailyData.length > 20 ? Math.floor(dailyData.length / 8) : 0

  return (
    <div className={STYLES.chartsGrid}>
      {/* Cirugías por período */}
      <Card hover={false}>
        <h3 className={chartTitle}>
          <TrendingUp size={15} className="text-blue-500" />
          Cirugías por Período
        </h3>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={dailyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="aComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="fecha" tick={{ fill: chartColor, fontSize: 10, fontWeight: 600 }} stroke={gridColor} interval={xInterval} />
            <YAxis tick={{ fill: chartColor, fontSize: 10, fontWeight: 600 }} stroke={gridColor} allowDecimals={false} />
            <ChartTooltip isDark={isDark} formatter={(v, n) => [v, n === 'total' ? 'Total' : 'Completadas']} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={v => v === 'total' ? 'Total' : 'Completadas'} />
            <Area type="monotone" dataKey="total"      stroke="#2563eb" fill="url(#aTotal)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="completadas" stroke="#16a34a" fill="url(#aComp)"  strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Estado distribución */}
      <Card hover={false}>
        <h3 className={chartTitle}>
          <Activity size={15} className="text-blue-500" />
          Distribución por Estado
        </h3>
        {statusData.length === 0 ? (
          <p className={STYLES.emptyCell}>Sin datos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <ChartTooltip isDark={isDark} formatter={(v, n) => [v + ' cirugías', n]} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} formatter={(v, entry) => `${v} (${entry.payload.value})`} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Top médicos */}
      <Card hover={false}>
        <h3 className={chartTitle}>
          <Users size={15} className="text-blue-500" />
          Top Médicos
        </h3>
        {doctorData.length === 0 ? (
          <p className={STYLES.emptyCell}>Sin datos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={doctorData} layout="vertical" margin={{ top: 0, right: 30, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fill: chartColor, fontSize: 10, fontWeight: 600 }} stroke={gridColor} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: chartColor, fontSize: 10, fontWeight: 600 }} stroke={gridColor} width={95}
                tickFormatter={v => v.length > 15 ? v.slice(0, 15) + '…' : v} />
              <ChartTooltip isDark={isDark} formatter={(v) => [v, 'Cirugías']} />
              <Bar dataKey="cirugias" fill="#2563eb" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Horas por pabellón */}
      <Card hover={false}>
        <h3 className={chartTitle}>
          <Clock size={15} className="text-blue-500" />
          Horas Operadas por Pabellón
        </h3>
        {roomData.length === 0 ? (
          <p className={STYLES.emptyCell}>Sin datos en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={roomData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="nombre" tick={{ fill: chartColor, fontSize: 10, fontWeight: 600 }} stroke={gridColor} />
              <YAxis tick={{ fill: chartColor, fontSize: 10, fontWeight: 600 }} stroke={gridColor} />
              <ChartTooltip isDark={isDark}
                formatter={(v, n) => [n === 'horas' ? `${v} h` : v, n === 'horas' ? 'Horas operadas' : 'Cirugías']} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={v => v === 'horas' ? 'Horas' : 'Cirugías'} />
              <Bar dataKey="cirugias" fill="#2563eb" radius={[6, 6, 0, 0]} name="cirugias" />
              <Bar dataKey="horas"    fill="#16a34a" radius={[6, 6, 0, 0]} name="horas" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
