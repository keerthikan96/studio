
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const data: Award[] = [
  {
    id: '1',
    name: 'Robert Fox',
    department: 'Graphics',
    date: '13/09/2025',
    awardName: 'Best Employee',
    avatar: '/placeholder.svg'
  },
  {
    id: '2',
    name: 'Wade Warren',
    department: 'Production',
    date: '24/09/2025',
    awardName: 'Coby Beach',
    avatar: '/placeholder.svg'
  },
  {
    id: '3',
    name: 'Albert Flores',
    department: 'Marketing',
    date: '05/08/2025',
    awardName: 'Best Researcher',
    avatar: '/placeholder.svg'
  },
    {
    id: '4',
    name: 'Ralph Edwards',
    department: 'Electrical',
    date: '17/07/2025',
    awardName: 'Good Work',
    avatar: '/placeholder.svg'
  },
];

type Award = {
  id: string;
  name: string;
  department: string;
  date: string;
  awardName: string;
  avatar: string;
};

const columns: ColumnDef<Award>[] = [
  {
    accessorKey: 'name',
    header: 'NAME',
    cell: ({ row }) => (
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={`https://i.pravatar.cc/40?u=${row.original.id}`} />
                <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{row.getValue('name')}</span>
        </div>
    ),
  },
  {
    accessorKey: 'department',
    header: 'DEPARTMENT',
  },
  {
    accessorKey: 'date',
    header: 'DATE',
  },
  {
    accessorKey: 'awardName',
    header: 'AWARD NAME',
    cell: ({ row }) => {
        const award = row.getValue('awardName') as string;
        const variants: {[key: string]: string} = {
            'Best Employee': 'text-green-600 border-green-200 bg-green-50',
            'Coby Beach': 'text-blue-600 border-blue-200 bg-blue-50',
            'Best Researcher': 'text-purple-600 border-purple-200 bg-purple-50',
            'Good Work': 'text-orange-600 border-orange-200 bg-orange-50',
        }
        return <Badge variant="outline" className={variants[award] || 'text-gray-600 border-gray-200 bg-gray-50'}>{award}</Badge>
    },
  },
];

export function EmployeeAwardList() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full">
      <div className="rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-muted-foreground text-xs">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                   className="border-b-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          1 - {table.getRowModel().rows.length} of {data.length} entries
        </div>
         <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
           <Button variant="outline" size="sm">1</Button>
           <Button variant="outline" size="sm">2</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
