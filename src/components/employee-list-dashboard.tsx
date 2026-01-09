
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
import { getMembersAction } from '@/app/actions/staff';
import { Member } from '@/lib/mock-data';
import { format } from 'date-fns';

type EmployeeDisplay = {
  id: string;
  name: string;
  jobTitle: string;
  joinDate: string;
  status: string;
  avatar: string;
};

const columns: ColumnDef<EmployeeDisplay>[] = [
  {
    accessorKey: 'name',
    header: 'NAME',
    cell: ({ row }) => (
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={row.original.avatar} />
                <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{row.getValue('name')}</span>
        </div>
    ),
  },
  {
    accessorKey: 'jobTitle',
    header: 'POSITION',
  },
  {
    accessorKey: 'joinDate',
    header: 'JOIN DATE',
  },
  {
    accessorKey: 'status',
    header: 'STATUS',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant = status === 'active' ? 'default' : status === 'pending' ? 'secondary' : 'outline';
      const colorClass = status === 'active' 
        ? 'text-green-600 border-green-200 bg-green-50' 
        : status === 'pending'
        ? 'text-yellow-600 border-yellow-200 bg-yellow-50'
        : 'text-gray-600 border-gray-200 bg-gray-50';
      
      return (
        <Badge variant="outline" className={colorClass}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
];

export function EmployeeListDashboard() {
  const [data, setData] = React.useState<EmployeeDisplay[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
        
        const result = await getMembersAction(currentUserId);
        if (Array.isArray(result)) {
          const employeeData: EmployeeDisplay[] = result
            .slice(0, 10) // Show latest 10 employees
            .map(member => ({
              id: member.id,
              name: member.name,
              jobTitle: member.job_title || 'N/A',
              joinDate: member.start_date ? format(new Date(member.start_date), 'dd/MM/yyyy') : 'N/A',
              status: member.status || 'active',
              avatar: member.profile_picture_url || `https://i.pravatar.cc/40?u=${member.id}`
            }));
          setData(employeeData);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading employees...</div>;
  }

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
           <Button variant="outline" size="sm">3</Button>
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
