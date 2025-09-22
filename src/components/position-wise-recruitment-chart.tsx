
"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Under', value: 15, color: '#fed7aa' },
  { name: 'Solid', value: 25, color: '#fb923c' },
  { name: 'Good', value: 40, color: '#f97316' },
  { name: 'High', value: 62, color: '#ea580c' },
];

export function PositionWiseRecruitmentChart() {
  return (
    <div style={{ width: '100%', height: 150 }}>
      <ResponsiveContainer>
        <BarChart
          layout="vertical"
          data={data}
          margin={{
            top: 5, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
             contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--background))",
            }}
            formatter={(value, name, props) => [`${value}%`, `Marketing`]}
          />
          <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
