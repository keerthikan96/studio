
"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { name: 'Sun', present: 80, absent: 10, leave: 10 },
  { name: 'Mon', present: 60, absent: 30, leave: 10 },
  { name: 'Tue', present: 75, absent: 15, leave: 10 },
  { name: 'Wed', present: 85, absent: 5, leave: 10 },
  { name: 'Thu', present: 70, absent: 20, leave: 10 },
  { name: 'Fri', present: 65, absent: 25, leave: 10 },
  { name: 'Sat', present: 40, absent: 40, leave: 20 },
]

export function DailyAttendanceChart() {
  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--background))",
            }}
          />
          <Legend iconType="circle" iconSize={10} wrapperStyle={{paddingTop: '20px'}} />
          <Bar dataKey="present" fill="#3b82f6" name="Present" radius={[4, 4, 0, 0]} barSize={10} />
          <Bar dataKey="absent" fill="#9ca3af" name="Absent" radius={[4, 4, 0, 0]} barSize={10} />
          <Bar dataKey="leave" fill="#a78bfa" name="Leave" radius={[4, 4, 0, 0]} barSize={10}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
