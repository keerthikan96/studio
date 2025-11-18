
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LeaveEntitlement, LeaveRequest } from '@/lib/mock-data';
import { getMemberEntitlementsAction, getMemberLeaveRequestsAction } from '@/app/actions/leave';
import { Progress } from '../ui/progress';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusStyles: { [key: string]: string } = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Approved: 'bg-green-100 text-green-800 border-green-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
};

type MemberLeaveInfoProps = {
    memberId: string;
    refetchTrigger: number;
}

export function MemberLeaveInfo({ memberId, refetchTrigger }: MemberLeaveInfoProps) {
    const [entitlements, setEntitlements] = React.useState<LeaveEntitlement[]>([]);
    const [requests, setRequests] = React.useState<LeaveRequest[]>([]);
    const [isPending, startTransition] = React.useTransition();

    const fetchData = React.useCallback(() => {
         startTransition(async () => {
            const currentYear = new Date().getFullYear();
            const [ents, reqs] = await Promise.all([
                getMemberEntitlementsAction(memberId, currentYear),
                getMemberLeaveRequestsAction(memberId),
            ]);
            setEntitlements(ents);
            setRequests(reqs);
        });
    }, [memberId]);

    React.useEffect(() => {
        fetchData();
    }, [memberId, refetchTrigger, fetchData]);
    
    const usedDaysByCategory = React.useMemo(() => {
        const used: { [key: string]: number } = {};
        requests.filter(r => r.status === 'Approved').forEach(r => {
            if (!used[r.category_id]) {
                used[r.category_id] = 0;
            }
            used[r.category_id] += r.days;
        });
        return used;
    }, [requests]);


    if (isPending) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>My Leave Info</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
             </Card>
        )
    }

    return (
        <div className='space-y-6'>
            <Card>
                <CardHeader>
                    <CardTitle>My Leave Entitlements</CardTitle>
                    <CardDescription>Your available leave days for the current year.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {entitlements.length > 0 ? entitlements.map(ent => {
                        const usedDays = usedDaysByCategory[ent.category_id] || 0;
                        const remaining = ent.days - usedDays;
                        const progress = (usedDays / ent.days) * 100;
                        return (
                            <div key={ent.id}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">{ent.leave_category_name}</span>
                                    <span className="text-sm text-muted-foreground">{remaining} / {ent.days} days remaining</span>
                                </div>
                                <Progress value={progress} />
                            </div>
                        )
                    }) : <p className='text-sm text-muted-foreground'>No entitlements found for this year.</p>}
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>My Leave Requests</CardTitle>
                    <CardDescription>History of your submitted leave requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.slice(0, 5).map(req => ( // Show recent 5
                                <TableRow key={req.id}>
                                    <TableCell>{req.leave_category_name}</TableCell>
                                    <TableCell>{format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d')}</TableCell>
                                    <TableCell><Badge variant="outline" className={cn(statusStyles[req.status])}>{req.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                             {requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">No requests submitted yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
