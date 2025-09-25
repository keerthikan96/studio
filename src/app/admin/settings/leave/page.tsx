
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
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

type LeaveRequest = {
  id: string;
  requestedDate: string;
  requestedBy: string;
  category: 'Sick Leave' | 'Vacation' | 'Casual Leave';
  subcategory: 'Half-Day' | 'Full-Day' | 'Morning' | 'Afternoon';
  startTime: string;
  endTime: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

const mockData: LeaveRequest[] = [
  { id: '1', requestedDate: '2024-07-28', requestedBy: 'John Doe', category: 'Sick Leave', subcategory: 'Full-Day', startTime: '09:00 AM', endTime: '05:00 PM', status: 'Pending' },
  { id: '2', requestedDate: '2024-07-27', requestedBy: 'Jane Smith', category: 'Vacation', subcategory: 'Full-Day', startTime: '09:00 AM', endTime: '05:00 PM', status: 'Approved' },
  { id: '3', requestedDate: '2024-07-26', requestedBy: 'Peter Jones', category: 'Casual Leave', subcategory: 'Half-Day', startTime: '01:00 PM', endTime: '05:00 PM', status: 'Rejected' },
  { id: '4', requestedDate: '2024-07-25', requestedBy: 'Emily Carter', category: 'Sick Leave', subcategory: 'Morning', startTime: '09:00 AM', endTime: '01:00 PM', status: 'Pending' },
];

const columns: ColumnDef<LeaveRequest>[] = [
  {
    accessorKey: 'requestedDate',
    header: 'Requested Date',
  },
  {
    accessorKey: 'requestedBy',
    header: 'Requested By',
  },
   {
    accessorKey: 'category',
    header: 'Category',
  },
  {
    accessorKey: 'startTime',
    header: 'Start Time',
  },
  {
    accessorKey: 'endTime',
    header: 'End Time',
  },
   {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const variants = {
            Pending: 'bg-yellow-100 text-yellow-800',
            Approved: 'bg-green-100 text-green-800',
            Rejected: 'bg-red-100 text-red-800',
        };
        return <Badge variant="outline" className={variants[status]}>{status}</Badge>;
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
          <Button variant="outline" size="sm" className="text-green-600 border-green-400 hover:bg-green-50 hover:text-green-700">Approve</Button>
          <Button variant="outline" size="sm" className="text-red-600 border-red-400 hover:bg-red-50 hover:text-red-700">Reject</Button>
        </div>
      );
    },
  },
];

export default function LeaveManagementPage() {
  const [data, setData] = React.useState(mockData);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Requests</CardTitle>
        <CardDescription>Filter and manage staff time-off requests.</CardDescription>
        <div className="flex items-center gap-4 pt-4">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="sick">Sick Leave</SelectItem>
              <SelectItem value="vacation">Vacation</SelectItem>
              <SelectItem value="casual">Casual Leave</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by subcategory..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              <SelectItem value="full-day">Full-Day</SelectItem>
              <SelectItem value="half-day">Half-Day</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
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
