
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { LeaveRequest, LeaveCategory, LeaveEntitlement } from '@/lib/mock-data';
import { getLeaveCategoriesAction, getLeaveRequestsAction, updateLeaveRequestStatusAction } from '@/app/actions/leave';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { LeaveRequestDialog } from '@/components/leave-request-dialog';

const statusStyles: { [key: string]: string } = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Approved: 'bg-green-100 text-green-800 border-green-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
};

const getColumns = (
    onUpdateStatus: (id: string, status: 'Approved' | 'Rejected') => void,
    isPending: boolean
): ColumnDef<LeaveRequest & { member_name: string }>[] => [
  {
    accessorKey: 'member_name',
    header: 'Requested By',
  },
  {
    accessorKey: 'leave_category_name',
    header: 'Category',
  },
  {
    accessorKey: 'start_date',
    header: 'Start Date',
    cell: ({ row }) => format(new Date(row.getValue('start_date')), 'PPP'),
  },
  {
    accessorKey: 'end_date',
    header: 'End Date',
     cell: ({ row }) => format(new Date(row.getValue('end_date')), 'PPP'),
  },
   {
    accessorKey: 'days',
    header: 'Days',
  },
   {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return <Badge variant="outline" className={cn(statusStyles[status])}>{status}</Badge>;
    },
  },
  {
    id: 'actions',
    header: 'Action',
    cell: ({ row }) => {
      const request = row.original;
      if (request.status !== 'Pending') {
        return <Button variant="ghost" size="sm" disabled>Processed</Button>;
      }
      return (
        <div className="space-x-2">
          <Button variant="outline" size="sm" className="text-green-600 border-green-400 hover:bg-green-50 hover:text-green-700" onClick={() => onUpdateStatus(request.id, 'Approved')} disabled={isPending}>Approve</Button>
          <Button variant="outline" size="sm" className="text-red-600 border-red-400 hover:bg-red-50 hover:text-red-700" onClick={() => onUpdateStatus(request.id, 'Rejected')} disabled={isPending}>Reject</Button>
        </div>
      );
    },
  },
];

export default function LeaveManagementPage() {
    const [requests, setRequests] = useState<(LeaveRequest & { member_name: string })[]>([]);
    const [categories, setCategories] = useState<LeaveCategory[]>([]);
    const [isPending, startTransition] = React.useTransition();
    const [user, setUser] = useState<{id: string, role: string} | null>(null);
    const { toast } = useToast();

    const fetchLeaveData = () => {
        startTransition(async () => {
            const [reqs, cats] = await Promise.all([
                const storedUser = sessionStorage.getItem('loggedInUser');
                const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
                return Promise.all([
                    getLeaveRequestsAction(currentUserId),
                getLeaveCategoriesAction()
            ]);
            setRequests(reqs);
            setCategories(cats);
        });
    }

    React.useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchLeaveData();
    }, []);

    const handleStatusUpdate = (id: string, status: 'Approved' | 'Rejected') => {
        if (!user) return;

        startTransition(async () => {
            const result = await updateLeaveRequestStatusAction(id, status, user.id);
            if (result.success) {
                toast({ title: 'Success', description: `Leave request has been ${status.toLowerCase()}.` });
                fetchLeaveData();
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        });
    }

    const columns = React.useMemo(() => getColumns(handleStatusUpdate, isPending), [isPending]);

    const table = useReactTable({
        data: requests,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    if (!user) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle>Leave Requests</CardTitle>
                    <CardDescription>Filter and manage staff time-off requests.</CardDescription>
                </div>
                {user && <LeaveRequestDialog userId={user.id} onNewRequest={fetchLeaveData} />}
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 pt-4 mb-4 flex-wrap">
                <Select
                    value={(table.getColumn('leave_category_name')?.getFilterValue() as string) ?? ''}
                    onValueChange={value => table.getColumn('leave_category_name')?.setFilterValue(value === 'all' ? '' : value)}
                >
                    <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by category..." />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                    <Select
                    value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
                    onValueChange={value => table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)}
                >
                    <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                            return (
                            <TableHead key={header.id}>
                                {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                            );
                        })}
                        </TableRow>
                    ))}
                    </TableHeader>
                    <TableBody>
                    {isPending ? (
                            <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            </TableCell>
                        </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                            ))}
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                            No results.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
                </div>
            </CardContent>
            </Card>
        </div>
    );
}
