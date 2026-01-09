"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { getLeaveRequestsAction } from "@/app/actions/leave"
import { startOfMonth, endOfMonth, format, eachMonthOfInterval, subMonths } from "date-fns"

type MonthlyData = {
  month: string;
  approved: number;
  pending: number;
  rejected: number;
}

export function LeaveRequestsTrendChart() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
        
        const leaveResult = await getLeaveRequestsAction(currentUserId);
        const leaves = Array.isArray(leaveResult) ? leaveResult : [];
        
        // Get last 6 months
        const now = new Date();
        const sixMonthsAgo = subMonths(now, 5);
        const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });
        
        const chartData: MonthlyData[] = months.map(month => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          
          const monthLeaves = leaves.filter(leave => {
            const leaveDate = new Date(leave.created_at || leave.start_date);
            return leaveDate >= monthStart && leaveDate <= monthEnd;
          });
          
          return {
            month: format(month, 'MMM'),
            approved: monthLeaves.filter(l => l.status === 'Approved').length,
            pending: monthLeaves.filter(l => l.status === 'Pending').length,
            rejected: monthLeaves.filter(l => l.status === 'Rejected').length,
          };
        });
        
        setData(chartData);
      } catch (error) {
        console.error('Error fetching leave trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="h-[350px] flex items-center justify-center text-muted-foreground">Loading data...</div>;
  }

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--background))",
            }}
          />
          <Legend iconType="circle" iconSize={10} wrapperStyle={{paddingTop: '20px'}} />
          <Bar dataKey="approved" fill="#10b981" name="Approved" radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="rejected" fill="#ef4444" name="Rejected" radius={[4, 4, 0, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
