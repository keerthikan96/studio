
"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Software', value: 3346, color: '#3b82f6' },
  { name: 'Electrical', value: 2278, color: '#10b981' },
  { name: 'Production', value: 1350, color: '#f97316' },
  { name: 'Graphics', value: 590, color: '#f59e0b' },
  { name: 'Marketing', value: 3346, color: '#6366f1' },
  { name: 'Remaining', value: 2000, color: '#e5e7eb' },
];

const totalLoan = 8440;

export function LoanPaymentChart() {
  return (
    <div className="h-[350px] w-full flex flex-col items-center">
      <ResponsiveContainer width="100%" height="70%">
        <PieChart>
          <Tooltip
             contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--background))",
            }}
           />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
           <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-foreground">
            ${totalLoan.toLocaleString()}
          </text>
          <text x="50%" y="50%" dy={20} textAnchor="middle" className="text-sm fill-muted-foreground">
            Total Loan
          </text>
        </PieChart>
      </ResponsiveContainer>
       <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mt-4">
        {data.slice(0, -1).map(item => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
            <span>{item.name}</span>
            <span className="font-semibold ml-auto">{((item.value / totalLoan) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
