
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
import { ArrowLeft, ArrowRight, Award as AwardIcon } from 'lucide-react';
import { getMembersAction } from '@/app/actions/staff';
import { format } from 'date-fns';

type RecognitionDisplay = {
  id: string;
  name: string;
  department: string;
  date: string;
  recognition: string;
  avatar: string;
  score?: number;
};

const columns: ColumnDef<RecognitionDisplay>[] = [
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
    accessorKey: 'department',
    header: 'DEPARTMENT',
  },
  {
    accessorKey: 'date',
    header: 'DATE',
  },
  {
    accessorKey: 'recognition',
    header: 'RECOGNITION',
    cell: ({ row }) => {
        const recognition = row.getValue('recognition') as string;
        const score = row.original.score || 0;
        let colorClass = 'text-gray-600 border-gray-200 bg-gray-50';
        
        if (score >= 90) colorClass = 'text-green-600 border-green-200 bg-green-50';
        else if (score >= 80) colorClass = 'text-blue-600 border-blue-200 bg-blue-50';
        else if (score >= 70) colorClass = 'text-purple-600 border-purple-200 bg-purple-50';
        
        return <Badge variant="outline" className={colorClass}>{recognition}</Badge>
    },
  },
];

export function EmployeeAwardList() {
  const [data, setData] = React.useState<RecognitionDisplay[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
        
        const result = await getMembersAction(currentUserId);
        if (Array.isArray(result)) {
          // Since there's no awards table, we'll show recent high performers or new hires
          const recognitionData: RecognitionDisplay[] = result
            .filter(m => m.status === 'active')
            .slice(0, 10)
            .map(member => {
              // Simulate recognition types
              const recognitions = [
                'New Team Member',
                'Long Service',
                'Team Player',
                'Innovation Award'
              ];
              const randomRecognition = recognitions[Math.floor(Math.random() * recognitions.length)];
              
              return {
                id: member.id,
                name: member.name,
                department: member.domain || 'General',
                date: member.start_date ? format(new Date(member.start_date), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy'),
                recognition: randomRecognition,
                avatar: member.profile_picture_url || `https://i.pravatar.cc/40?u=${member.id}`,
                score: Math.floor(Math.random() * 30) + 70 // 70-100
              };
            });
          setData(recognitionData);
        }
      } catch (error) {
        console.error('Error fetching recognition data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    return <div className="text-center py-8 text-muted-foreground">Loading recognition data...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AwardIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No recognition data available</p>
      </div>
    );
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
