'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface VolumeData {
  date: string
  count: number
}

export default function InboxVolumeChart({ data }: { data: VolumeData[] }) {
  if (!data || data.length === 0) return <div className="p-4 text-sm font-semibold opacity-30 text-notion-black text-center">No telemetry available</div>;

  return (
    <div className="w-full h-72 font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#9b9b9b', fontSize: 11, fontWeight: 500 }} 
            axisLine={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1 }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#9b9b9b', fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1 }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.03)', radius: [4, 4, 0, 0] }}
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              color: '#050505', 
              border: '1px solid rgba(0,0,0,0.1)', 
              borderRadius: '6px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontWeight: 600, 
              fontSize: '13px',
              padding: '10px 14px'
            }}
            itemStyle={{ color: '#0075DE', fontWeight: 700 }}
          />
          <Bar dataKey="count" fill="#0075DE" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
