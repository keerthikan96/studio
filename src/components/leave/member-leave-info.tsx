
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LeaveEntitlement, LeaveRequest } from '@/lib/mock-data';
import { getMemberEntitlementsAction, getMemberLeaveRequestsAction } from '@/app/actions/leave';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

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


    if (isPending && entitlements.length === 0 && requests.length === 0) {
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
            <Accordion type="single" collapsible className="w-full" defaultValue='item-1'>
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-semibold">
                        My Leave Entitlements
                    </AccordionTrigger>
                    <AccordionContent>
                         {isPending ? <div className='flex justify-center p-4'><Loader2 className="h-6 w-6 animate-spin" /></div> : (
                            entitlements.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category Name</TableHead>
                                            <TableHead className="text-center">Allocated</TableHead>
                                            <TableHead className="text-center">Used</TableHead>
                                            <TableHead className="text-right">Available</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entitlements.map(ent => {
                                            const usedDays = usedDaysByCategory[ent.category_id] || 0;
                                            const available = ent.days - usedDays;
                                            return (
                                                <TableRow key={ent.id}>
                                                    <TableCell className="font-medium">{ent.leave_category_name}</TableCell>
                                                    <TableCell className="text-center">{ent.days}</TableCell>
                                                    <TableCell className="text-center">{usedDays}</TableCell>
                                                    <TableCell className="text-right font-bold">{available}</TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            ) : <p className='text-sm text-muted-foreground p-4 text-center'>No entitlements found for this year.</p>
                         )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
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
                            {isPending && requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin" /></TableCell>
                                </TableRow>
                            ) : requests.length > 0 ? (
                                requests.slice(0, 5).map(req => ( // Show recent 5
                                    <TableRow key={req.id}>
                                        <TableCell>{req.leave_category_name}</TableCell>
                                        <TableCell>{format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d')}</TableCell>
                                        <TableCell><Badge variant="outline" className={cn(statusStyles[req.status])}>{req.status}</Badge></TableCell>
                                    </TableRow>
                                ))
                            ) : (
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
