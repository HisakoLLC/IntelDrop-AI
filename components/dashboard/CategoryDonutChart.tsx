'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface DonutData {
  name: string
  value: number
  fill: string
}

export default function CategoryDonutChart({ data }: { data: DonutData[] }) {
  if (!data || data.length === 0) return <div className="p-4 text-sm font-semibold opacity-30 text-notion-black text-center">No categorical spread detected</div>;

  return (
    <div className="w-full h-72 relative flex items-center justify-center font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius="65%"
            outerRadius="85%"
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity" />
            ))}
          </Pie>
          <Tooltip 
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
            itemStyle={{ color: '#050505', fontWeight: 600 }}
            cursor={{ fill: 'transparent' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
