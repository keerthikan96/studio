
"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', sales: 2 },
  { name: 'Feb', sales: 1.5 },
  { name: 'Mar', sales: 3 },
  { name: 'Apr', sales: 1 },
  { name: 'May', sales: 2.5 },
  { name: 'Jun', sales: 0.5 },
  { name: 'Jul', sales: 3.5 },
  { name: 'Aug', sales: 2 },
  { name: 'Sep', sales: 4 },
  { name: 'Oct', sales: 1 },
  { name: 'Nov', sales: 2 },
  { name: 'Dec', sales: 3 },
];

export function SalesAnalyticsChart() {
  return (
    <div style={{ width: '100%', height: 150 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--accent))', radius: 4 }}
            contentStyle={{
              borderRadius: '0.5rem',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--background))',
            }}
          />
          <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={15} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
