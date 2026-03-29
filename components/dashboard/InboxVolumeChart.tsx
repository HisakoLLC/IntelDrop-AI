'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function InboxVolumeChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="p-4 text-sm font-bold opacity-50 uppercase tracking-widest text-black">NO TELEMETRY AVAILABLE</div>;

  return (
    <div className="w-full h-72 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#000000', fontSize: 10, fontWeight: 'bold' }} 
            axisLine={{ stroke: '#000000', strokeWidth: 3 }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#000000', fontSize: 10, fontWeight: 'bold' }}
            axisLine={{ stroke: '#000000', strokeWidth: 3 }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip 
            cursor={{ fill: '#e5e5e5', opacity: 0.8 }}
            contentStyle={{ backgroundColor: '#000000', color: '#ffffff', border: '3px solid #000000', borderRadius: 0, fontWeight: 'black', fontSize: '12px', textTransform: 'uppercase' }}
            itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
          />
          <Bar dataKey="count" fill="#000000" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
