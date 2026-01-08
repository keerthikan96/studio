
'use client';

import { useEffect, useState, useTransition } from "react";
import { getRolesAction } from "@/app/actions/roles";
import { Role } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import Link from "next/link";

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isPending, startTransition] = useTransition();

    const fetchRoles = () => {
        startTransition(() => {
            const storedUser = sessionStorage.getItem('loggedInUser');
            const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
            
            getRolesAction(currentUserId).then((result) => {
                if (Array.isArray(result)) {
                    setRoles(result);
                } else {
                    console.error('Failed to fetch roles:', result.error);
                    setRoles([]);
                }
            });
        });
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Roles & Permissions</CardTitle>
                        <CardDescription>A list of all configured roles in the system.</CardDescription>
                    </div>
                     <Button asChild>
                        <Link href="/admin/settings/user-management/roles/new">
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New Role
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Date Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isPending && roles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : roles.length > 0 ? (
                                roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{role.description}</TableCell>
                                        <TableCell>{format(new Date(role.created_at), 'PPP')}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/settings/user-management/roles/${role.id}`}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Role
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Role
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No roles found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
