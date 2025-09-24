
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PerformanceRecord } from '@/lib/mock-data';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

type PerformanceGrowthChartProps = {
  data: PerformanceRecord[];
};

export function PerformanceGrowthChart({ data }: PerformanceGrowthChartProps) {
  // We only want to plot records that have a score
  const chartData = data
    .filter(record => typeof record.score === 'number')
    .map(record => ({
        ...record,
        // Format date for the chart tooltip and axis
        review_date_formatted: format(new Date(record.review_date), 'MMM yyyy'),
        score: record.score,
    }))
    // Sort data chronologically for the line chart
    .sort((a, b) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime());

  if (chartData.length < 2) {
      return (
          <Card>
            <CardHeader>
                <CardTitle>Performance Growth</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] flex items-center justify-center">
                    <p className="text-muted-foreground">Not enough data to display performance growth.</p>
                </div>
            </CardContent>
          </Card>
      );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Performance Growth</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                data={chartData}
                margin={{
                    top: 5,
                    right: 30,
                    left: -10,
                    bottom: 5,
                }}
                >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="review_date_formatted" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip
                    contentStyle={{
                        borderRadius: '0.5rem',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--background))',
                    }}
                    labelFormatter={(label) => `Review: ${label}`}
                />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" name="Performance Score" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
            </div>
        </CardContent>
    </Card>
  );
}
