
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  CheckCircle,
  ChevronDown,
  CircleSlash,
  Mail,
  MoreHorizontal,
  Pencil,
  KeyRound,
  Loader2,
  PauseCircle,
  ShieldQuestion,
  Eye,
} from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Member, Role } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { updateMemberRoleAction, updateMemberStatusAction } from '@/app/actions/staff';
import { requestPasswordResetAction } from '@/app/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { MemberCard } from './member-card';
import { useIsMobile } from '@/hooks/use-mobile';

const statusStyles: { [key: string]: string } = {
  active: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
  inactive: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
  'on-hold': 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100',
};

const getColumns = (
    onSendInvite: (member: Member) => void,
    onStatusChange: (member: Member, status: Member['status']) => void,
    onSendPasswordReset: (member: Member) => void,
    onRoleChange: (member: Member, roleId: string, roleName: string) => void,
    roles: Role[],
): ColumnDef<Member>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <div className="capitalize font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <div className="lowercase text-muted-foreground">{row.getValue('email')}</div>,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <div className="capitalize">{row.getValue('role')}</div>
  },
  {
    accessorKey: 'domain',
    header: 'Domain',
    cell: ({ row }) => <div className="capitalize">{row.getValue('domain')}</div>
  },
   {
    accessorKey: 'country',
    header: 'Country',
    cell: ({ row }) => <div className="capitalize">{row.getValue('country')}</div>
  },
  {
    accessorKey: 'branch',
    header: 'Branch',
    cell: ({ row }) => <div className="capitalize">{row.getValue('branch')}</div>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
        <Badge variant="outline" className={cn("capitalize", statusStyles[row.getValue('status')] || '')}>
            {row.getValue('status')}
        </Badge>
    ),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const member = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <Link href={`/admin/members/${member.id}`}>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            {member.status === 'pending' && (
                 <DropdownMenuItem onClick={() => onSendInvite(member)}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invite
                 </DropdownMenuItem>
            )}
             {(member.status === 'inactive' || member.status === 'on-hold') && (
                 <DropdownMenuItem onClick={() => onStatusChange(member, 'active')}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activate
                 </DropdownMenuItem>
            )}
            {member.status === 'active' && (
                 <>
                    <DropdownMenuItem onClick={() => onStatusChange(member, 'on-hold')}>
                        <PauseCircle className="mr-2 h-4 w-4" />
                        Set On-hold
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(member, 'inactive')} className="text-destructive">
                        <CircleSlash className="mr-2 h-4 w-4" />
                        Deactivate
                    </DropdownMenuItem>
                </>
            )}
            <DropdownMenuItem onClick={() => onSendPasswordReset(member)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Send Password Reset
            </DropdownMenuItem>
            <DropdownMenuSeparator />
             <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={member.status !== 'active'}>
                    <ShieldQuestion className="mr-2 h-4 w-4" />
                    Change Role
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                        {roles.map((role) => (
                            <DropdownMenuItem 
                                key={role.id} 
                                onClick={() => onRoleChange(member, role.id, role.name)} 
                                disabled={member.role === role.name}
                            >
                                <CheckCircle className={`mr-2 h-4 w-4 ${member.role === role.name ? 'opacity-100' : 'opacity-0'}`} />
                                {role.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];


type MemberListProps = {
    data: Member[];
    setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
    onSendInvite: (member: Member) => void;
    viewMode: 'grid' | 'list';
    roles: Role[];
}

const domains = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'];
const statuses = ['active', 'pending', 'inactive', 'on-hold'];
const countries = ['Canada', 'USA', 'Sri Lanka'];


export function MemberList({ data, setMembers, onSendInvite, viewMode, roles }: MemberListProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [memberToReset, setMemberToReset] = React.useState<Member | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [isResetPending, startResetTransition] = React.useTransition();
  const { toast } = useToast();
  const isMobile = useIsMobile();

   React.useEffect(() => {
    setColumnVisibility({
        email: !isMobile,
        country: !isMobile,
        branch: !isMobile,
    });
  }, [isMobile]);

  const handleStatusChange = (member: Member, status: Member['status']) => {
    startTransition(async () => {
        const { success } = await updateMemberStatusAction(member.id, status);
        if (success) {
            setMembers(current => current.map(m => m.id === member.id ? {...m, status} : m));
            toast({ title: 'Status Updated', description: `${member.name}'s status is now ${status}.`});
        } else {
            toast({ title: 'Error', description: 'Failed to update member status.', variant: 'destructive' });
        }
    });
  };
  
  const handleRoleChange = (member: Member, roleId: string, roleName: string) => {
      startTransition(async () => {
          const { success, error } = await updateMemberRoleAction(member.id, roleId);
          if (success) {
              setMembers(current => current.map(m => m.id === member.id ? {...m, role: roleName } : m));
              toast({ title: 'Role Updated', description: `${member.name}'s role has been changed to ${roleName}.`});
          } else {
              toast({ title: 'Error', description: error || 'Failed to update role.', variant: 'destructive' });
          }
      });
  }

  const handlePasswordResetConfirm = () => {
    if (!memberToReset) return;
    startResetTransition(async () => {
        const result = await requestPasswordResetAction(memberToReset.email, false);
        if (result.success) {
            toast({ title: 'Password Reset Sent', description: `A reset link for ${memberToReset.name} has been logged to the server console.`});
        } else {
            toast({ title: 'Error', description: result.error || 'Failed to send reset link.', variant: 'destructive'});
        }
        setMemberToReset(null);
    });
  };

  const columns = React.useMemo(() => getColumns(onSendInvite, handleStatusChange, setMemberToReset, handleRoleChange, roles), [onSendInvite, roles]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const page = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pagedData = table.getRowModel().rows.map(row => row.original);

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2 flex-wrap">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-xs"
        />
        <Select
            value={(table.getColumn('domain')?.getFilterValue() as string) ?? ''}
            onValueChange={(value) =>
                table.getColumn('domain')?.setFilterValue(value === 'all' ? '' : value)
            }
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by domain" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {domains.map((domain) => (
                    <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                ))}
            </SelectContent>
        </Select>
         <Select
            value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
            onValueChange={(value) =>
                table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
            }
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                    <SelectItem key={status} value={status} className='capitalize'>{status}</SelectItem>
                ))}
            </SelectContent>
        </Select>
        <Select
            value={(table.getColumn('country')?.getFilterValue() as string) ?? ''}
            onValueChange={(value) =>
                table.getColumn('country')?.setFilterValue(value === 'all' ? '' : value)
            }
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by country" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
            </SelectContent>
        </Select>
        <Input
          placeholder="Filter by branch..."
          value={(table.getColumn('branch')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('branch')?.setFilterValue(event.target.value)
          }
          className="max-w-xs"
        />

        {viewMode === 'list' && (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                    return (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                        }
                    >
                        {column.id}
                    </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {pagedData.length > 0 ? (
            pagedData.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                onStatusChange={handleStatusChange}
                onSendInvite={onSendInvite}
                onSendPasswordReset={setMemberToReset}
                onRoleChange={handleRoleChange}
                roles={roles}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              No results.
            </div>
          )}
        </div>
      ) : (
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
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
      )}

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
                table.setPageSize(Number(value))
            }}
            >
            <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
                {[10, 25, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
        <div className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
        </div>
        <div className="space-x-2">
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
      </div>
      <AlertDialog open={!!memberToReset} onOpenChange={() => setMemberToReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Password Reset Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new password reset link for {memberToReset?.name} and log it to the console.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordResetConfirm} disabled={isResetPending}>
                {isResetPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Yes, Send Reset Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    