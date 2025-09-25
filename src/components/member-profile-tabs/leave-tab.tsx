
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

type LeaveRequest = {
  id: string;
  leaveType: 'Sick Leave' | 'Vacation' | 'Casual Leave' | 'Personal';
  date: string;
  duration: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

const mockData: LeaveRequest[] = [
  { id: '1', leaveType: 'Sick Leave', date: '2024-07-28', duration: 'Full Day', reason: 'Fever and headache', status: 'Pending' },
  { id: '2', leaveType: 'Vacation', date: '2024-07-27', duration: 'Full Day', reason: 'Family trip', status: 'Approved' },
  { id: '3', leaveType: 'Casual Leave', date: '2024-07-26', duration: 'Half Day - PM', reason: 'Bank appointment', status: 'Approved' },
  { id: '4', leaveType: 'Personal', date: '2024-07-25', duration: '2 hours', reason: 'Doctor\'s appointment', status: 'Rejected' },
];

const statusStyles: { [key: string]: string } = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Approved: 'bg-green-100 text-green-800 border-green-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
};

const columns: ColumnDef<LeaveRequest>[] = [
  {
    accessorKey: 'leaveType',
    header: 'Leave Type',
  },
  {
    accessorKey: 'date',
    header: 'Date',
  },
   {
    accessorKey: 'duration',
    header: 'Duration',
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
  },
   {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return <Badge variant="outline" className={cn(statusStyles[status])}>{status}</Badge>;
    },
  },
];

type LeaveTabProps = {
    memberId: string;
}

export function LeaveTab({ memberId }: LeaveTabProps) {
  const [data, setData] = useState(mockData);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave History</CardTitle>
        <CardDescription>View and filter time-off requests for this member.</CardDescription>
        <div className="flex items-center gap-4 pt-4">
          <Select
            value={(table.getColumn('leaveType')?.getFilterValue() as string) ?? ''}
            onValueChange={value => table.getColumn('leaveType')?.setFilterValue(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Sick Leave">Sick Leave</SelectItem>
              <SelectItem value="Vacation">Vacation</SelectItem>
              <SelectItem value="Casual Leave">Casual Leave</SelectItem>
              <SelectItem value="Personal">Personal</SelectItem>
            </SelectContent>
          </Select>
          <Select
             value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
             onValueChange={value => table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[180px]">
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
      </CardHeader>
      <CardContent>
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
              {table.getRowModel().rows?.length ? (
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
  );
}
