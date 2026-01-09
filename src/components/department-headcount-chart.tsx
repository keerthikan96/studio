"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"
import { getMembersAction } from "@/app/actions/staff"
import { getDepartmentsAction } from "@/app/actions/departments"

type DepartmentData = {
  name: string;
  count: number;
  color: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export function DepartmentHeadcountChart() {
  const [data, setData] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
        
        const [membersResult, departmentsResult] = await Promise.all([
          getMembersAction(currentUserId),
          getDepartmentsAction(currentUserId)
        ]);
        
        const members = Array.isArray(membersResult) ? membersResult : [];
        const departments = Array.isArray(departmentsResult) ? departmentsResult : [];
        const activeMembers = members.filter(m => m.status === 'active');
        
        // Count members by department
        const departmentCounts = new Map<string, number>();
        activeMembers.forEach(member => {
          const dept = member.domain || 'Unassigned';
          departmentCounts.set(dept, (departmentCounts.get(dept) || 0) + 1);
        });
        
        // Convert to chart data
        const chartData: DepartmentData[] = Array.from(departmentCounts.entries())
          .map(([name, count], index) => ({
            name: name.length > 15 ? name.substring(0, 15) + '...' : name,
            count,
            color: COLORS[index % COLORS.length]
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6); // Top 6 departments
        
        setData(chartData);
      } catch (error) {
        console.error('Error fetching department data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="h-[350px] flex items-center justify-center text-muted-foreground">Loading data...</div>;
  }

  if (data.length === 0) {
    return <div className="h-[350px] flex items-center justify-center text-muted-foreground">No department data available</div>;
  }

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            tickLine={false} 
            axisLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--background))",
            }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar dataKey="count" name="Employees" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
