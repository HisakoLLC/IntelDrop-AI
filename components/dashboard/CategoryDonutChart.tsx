'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function CategoryDonutChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="p-4 text-sm font-bold opacity-50 uppercase tracking-widest text-black">NO CATEGORICAL SPREAD DETECTED</div>;

  return (
    <div className="w-full h-72 font-mono relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#000000', color: '#ffffff', border: '3px solid #000000', borderRadius: 0, fontWeight: 'black', fontSize: '12px', textTransform: 'uppercase' }}
            itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
