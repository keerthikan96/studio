'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { TimesheetWeek, TimeEntry } from '@/lib/mock-data';
import {
    getAllTimesheetsAction,
    approveWeekAction,
    rejectWeekAction,
    getWeekEntriesAction,
} from '@/app/actions/timesheet';
import { 
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
} from '@tanstack/react-table';
import { 
    CheckCircle, 
    XCircle, 
    Eye,
    Clock,
    Filter
} from 'lucide-react';
import { format } from 'date-fns';

export default function TimesheetApprovalPage() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [timesheets, setTimesheets] = useState<TimesheetWeek[]>([]);
    const [statusFilter, setStatusFilter] = useState('SUBMITTED');
    const [globalFilter, setGlobalFilter] = useState('');
    
    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
        }
    }, []);
    
    useEffect(() => {
        if (!currentUser) return;
        fetchData();
    }, [currentUser, statusFilter]);
    
    const fetchData = () => {
        if (!currentUser) return;
        
        startTransition(async () => {
            const result = await getAllTimesheetsAction(currentUser.id, {
                status: statusFilter || undefined,
            });
            
            if (Array.isArray(result)) {
                setTimesheets(result);
            } else {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            }
        });
    };
    
    const handleApprove = (weekId: string) => {
        startTransition(async () => {
            const result = await approveWeekAction(currentUser.id, weekId);
            
            if ('error' in result) {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: 'Timesheet approved successfully.',
                });
                fetchData();
            }
        });
    };
    
    if (!currentUser) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }
    
    const columns: ColumnDef<TimesheetWeek>[] = [
        {
            accessorKey: 'user_name',
            header: 'Employee',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.user_name}</div>
                    <div className="text-sm text-muted-foreground">{row.original.user_email}</div>
                </div>
            ),
        },
        {
            accessorKey: 'week_start_date',
            header: 'Week',
            cell: ({ row }) => {
                const start = new Date(row.original.week_start_date);
                const end = new Date(row.original.week_end_date);
                return (
                    <div className="text-sm">
                        {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}
                    </div>
                );
            },
        },
        {
            accessorKey: 'total_hours',
            header: 'Total Hours',
            cell: ({ row }) => (
                <div className="font-semibold">
                    {parseFloat(row.original.total_hours as any).toFixed(2)}h
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge 
                        variant={
                            status === 'APPROVED' ? 'default' : 
                            status === 'SUBMITTED' ? 'secondary' :
                            status === 'REJECTED' ? 'destructive' :
                            'outline'
                        }
                    >
                        {status}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'submitted_at',
            header: 'Submitted',
            cell: ({ row }) => {
                if (!row.original.submitted_at) return '-';
                return (
                    <div className="text-sm text-muted-foreground">
                        {format(new Date(row.original.submitted_at), 'MMM d, yyyy h:mm a')}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <ViewEntriesDialog week={row.original} userId={currentUser.id} />
                    
                    {row.original.status === 'SUBMITTED' && (
                        <>
                            <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(row.original.id)}
                                disabled={isPending}
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                            </Button>
                            <RejectDialog 
                                weekId={row.original.id} 
                                userId={currentUser.id} 
                                onSuccess={fetchData} 
                            />
                        </>
                    )}
                </div>
            ),
        },
    ];
    
    const table = useReactTable({
        data: timesheets,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: {
                pageSize: 25,
            },
        },
    });
    
    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Timesheet Approvals</h1>
                <p className="text-muted-foreground">Review and approve employee timesheets</p>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Timesheets</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="statusFilter">Status:</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All</SelectItem>
                                        <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <Input
                                placeholder="Search employee..."
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-[250px]"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <tr key={headerGroup.id} className="border-b bg-muted/50">
                                            {headerGroup.headers.map((header) => (
                                                <th 
                                                    key={header.id} 
                                                    className="px-4 py-3 text-left text-sm font-medium"
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                                                No timesheets found.
                                            </td>
                                        </tr>
                                    ) : (
                                        table.getRowModel().rows.map((row) => (
                                            <tr key={row.id} className="border-b hover:bg-muted/50">
                                                {row.getVisibleCells().map((cell) => (
                                                    <td key={cell.id} className="px-4 py-3">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                            {Math.min(
                                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                table.getFilteredRowModel().rows.length
                            )}{' '}
                            of {table.getFilteredRowModel().rows.length} results
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Previous
                            </Button>
                            <span className="text-sm">
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ViewEntriesDialog({ week, userId }: { week: TimesheetWeek; userId: string }) {
    const [open, setOpen] = useState(false);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    useEffect(() => {
        if (open) {
            loadEntries();
        }
    }, [open]);
    
    const loadEntries = () => {
        startTransition(async () => {
            const result = await getWeekEntriesAction(week.user_id!, week.week_start_date);
            
            if ('error' in result) {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                setEntries(result.entries);
            }
        });
    };
    
    // Group by date
    const entriesByDate: { [key: string]: TimeEntry[] } = {};
    entries.forEach((entry) => {
        if (!entriesByDate[entry.date]) {
            entriesByDate[entry.date] = [];
        }
        entriesByDate[entry.date].push(entry);
    });
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Timesheet Details - {week.user_name}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Week of {format(new Date(week.week_start_date), 'MMM d')} - {format(new Date(week.week_end_date), 'MMM d, yyyy')}
                    </p>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Hours</p>
                            <p className="text-2xl font-bold">{parseFloat(week.total_hours as any).toFixed(2)}h</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant="secondary" className="mt-1">{week.status}</Badge>
                        </div>
                    </div>
                    
                    {week.notes && (
                        <div className="p-4 bg-secondary rounded-lg">
                            <p className="text-sm font-medium mb-1">Notes:</p>
                            <p className="text-sm">{week.notes}</p>
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        {Object.keys(entriesByDate).sort().map((date) => {
                            const dayEntries = entriesByDate[date];
                            const dayTotal = dayEntries.reduce((sum, e) => sum + (parseFloat(e.hours as any) || 0), 0);
                            
                            return (
                                <div key={date} className="space-y-2">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <h4 className="font-semibold">
                                            {format(new Date(date), 'EEEE, MMM d, yyyy')}
                                        </h4>
                                        <span className="text-sm text-muted-foreground">
                                            {dayTotal.toFixed(2)}h
                                        </span>
                                    </div>
                                    
                                    {dayEntries.map((entry) => (
                                        <div key={entry.id} className="p-3 border rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium">{entry.project_name}</span>
                                                        {entry.milestone_name && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {entry.milestone_name}
                                                            </Badge>
                                                        )}
                                                        <Badge variant="secondary" className="text-xs">
                                                            {entry.pay_type.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    {entry.description && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {entry.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="font-semibold ml-4">{parseFloat(entry.hours as any).toFixed(2)}h</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function RejectDialog({ 
    weekId, 
    userId, 
    onSuccess 
}: { 
    weekId: string; 
    userId: string; 
    onSuccess: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [notes, setNotes] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!notes.trim()) {
            toast({
                title: 'Error',
                description: 'Please provide a reason for rejection.',
                variant: 'destructive',
            });
            return;
        }
        
        startTransition(async () => {
            const result = await rejectWeekAction(userId, weekId, notes);
            
            if ('error' in result) {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: 'Timesheet rejected.',
                });
                setOpen(false);
                setNotes('');
                onSuccess();
            }
        });
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="destructive">
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Timesheet</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="notes">Rejection Reason *</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Explain why this timesheet is being rejected..."
                            rows={4}
                        />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={isPending}>
                            {isPending ? 'Rejecting...' : 'Reject Timesheet'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
