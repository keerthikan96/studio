
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Briefcase, CalendarCheck, CalendarClock, UserMinus } from "lucide-react";
import { LeaveRequest } from "@/lib/mock-data";
import { useMemo } from "react";
import { isToday } from "date-fns";

export function LeaveStatCards({ requests }: { requests: LeaveRequest[] }) {
    const stats = useMemo(() => {
        const approvedRequests = requests.filter(r => r.status === 'Approved');
        const pendingRequests = requests.filter(r => r.status === 'Pending');

        const onLeaveToday = approvedRequests.filter(r => {
            const today = new Date();
            return new Date(r.start_date) <= today && new Date(r.end_date) >= today;
        }).length;

        const totalLeaveThisMonth = approvedRequests.filter(r => {
             const today = new Date();
             return new Date(r.start_date).getMonth() === today.getMonth();
        }).reduce((acc, r) => acc + r.days, 0);

        return {
            onLeaveToday,
            totalLeaveThisMonth,
            pendingRequests: pendingRequests.length,
        };
    }, [requests]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On Leave Today</CardTitle>
                    <UserMinus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.onLeaveToday}</div>
                    <p className="text-xs text-muted-foreground">employees currently on approved leave.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                    <p className="text-xs text-muted-foreground">requests awaiting approval.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Leave Days (This Month)</CardTitle>
                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalLeaveThisMonth}</div>
                    <p className="text-xs text-muted-foreground">total approved leave days this month.</p>
                </CardContent>
            </Card>
        </div>
    )
}
