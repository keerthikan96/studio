
'use client';

import { useEffect, useState, useTransition } from "react";
import { getDepartmentsAction, createDepartmentAction, updateDepartmentAction, deleteDepartmentAction } from "@/app/actions/departments";
import { Department } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Edit, Trash2, MoreHorizontal, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function DepartmentPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const fetchDepartments = () => {
        startTransition(() => {
            const storedUser = sessionStorage.getItem('loggedInUser');
            const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
            
            getDepartmentsAction(currentUserId).then((result) => {
                if (Array.isArray(result)) {
                    setDepartments(result);
                } else {
                    console.error('Failed to fetch departments:', result.error);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: result.error || "Failed to fetch departments"
                    });
                    setDepartments([]);
                }
            });
        });
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleOpenDialog = (department?: Department) => {
        if (department) {
            setEditingDepartment(department);
            setFormData({ name: department.name, description: department.description || '' });
        } else {
            setEditingDepartment(null);
            setFormData({ name: '', description: '' });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingDepartment(null);
        setFormData({ name: '', description: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';

        try {
            let result;
            if (editingDepartment) {
                result = await updateDepartmentAction(editingDepartment.id, {
                    name: formData.name,
                    description: formData.description,
                    currentUserId
                });
            } else {
                result = await createDepartmentAction({
                    name: formData.name,
                    description: formData.description,
                    currentUserId
                });
            }

            if ('error' in result) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error
                });
            } else {
                toast({
                    title: "Success",
                    description: `Department ${editingDepartment ? 'updated' : 'created'} successfully`
                });
                handleCloseDialog();
                fetchDepartments();
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingDepartmentId) return;

        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';

        try {
            const result = await deleteDepartmentAction(deletingDepartmentId, currentUserId);

            if ('error' in result) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error
                });
            } else {
                toast({
                    title: "Success",
                    description: "Department deleted successfully"
                });
                fetchDepartments();
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred"
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingDepartmentId(null);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Departments</CardTitle>
                        <CardDescription>Manage organizational departments and their members</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Create Department
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>{editingDepartment ? 'Edit Department' : 'Create New Department'}</DialogTitle>
                                    <DialogDescription>
                                        {editingDepartment ? 'Update the department information.' : 'Add a new department to your organization.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Department Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., People and Culture"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Enter department description..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingDepartment ? 'Update' : 'Create'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Department Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Date Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isPending && departments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : departments.length > 0 ? (
                                departments.map((department) => (
                                    <TableRow key={department.id}>
                                        <TableCell className="font-medium">{department.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{department.description || 'No description'}</TableCell>
                                        <TableCell>{format(new Date(department.created_at), 'PPP')}</TableCell>
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
                                                        <Link href={`/admin/department/${department.id}`}>
                                                            <Users className="mr-2 h-4 w-4" />
                                                            View Members
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(department)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Department
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            setDeletingDepartmentId(department.id);
                                                            setIsDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Department
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No departments found. Create your first department to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the department and remove all member assignments. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingDepartmentId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
