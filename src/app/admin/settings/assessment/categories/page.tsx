
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AssessmentCategory } from '@/lib/mock-data';
import { getAssessmentCategoriesAction, addAssessmentCategoryAction, deleteAssessmentCategoryAction } from '@/app/actions/staff';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export default function AssessmentCategoriesPage() {
    const [categories, setCategories] = useState<AssessmentCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isPending, startTransition] = useTransition();
    const [isLoading, startLoadingTransition] = useTransition();
    const [categoryToDelete, setCategoryToDelete] = useState<AssessmentCategory | null>(null);
    const { toast } = useToast();

    const fetchCategories = () => {
        startLoadingTransition(() => {
            getAssessmentCategoriesAction().then(setCategories);
        });
    };

    useEffect(fetchCategories, []);

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) {
            toast({ title: 'Error', description: 'Category name cannot be empty.', variant: 'destructive' });
            return;
        }

        startTransition(async () => {
            const result = await addAssessmentCategoryAction(newCategoryName);
            if ('error' in result) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Category Added', description: `"${newCategoryName}" has been added.` });
                setNewCategoryName('');
                fetchCategories();
            }
        });
    };

    const handleDeleteConfirm = () => {
        if (!categoryToDelete) return;
        
        startTransition(async () => {
            const result = await deleteAssessmentCategoryAction(categoryToDelete.id);
            if (result.success) {
                toast({ title: 'Category Deleted', description: `"${categoryToDelete.name}" has been removed.` });
                setCategoryToDelete(null);
                fetchCategories();
            } else {
                 toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Self-Assessment Categories</CardTitle>
                    <CardDescription>
                        Manage the categories available for employee self-evaluations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Enter new category name..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                            className="max-w-sm"
                        />
                        <Button onClick={handleAddCategory} disabled={isPending}>
                            {isPending && !isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Add Category
                        </Button>
                    </div>

                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={2} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                                ) : categories.length > 0 ? (
                                    categories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="destructive" size="icon" onClick={() => setCategoryToDelete(category)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={2} className="h-24 text-center">No categories found. Add one to get started.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </CardContent>
            </Card>

             <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the category "{categoryToDelete?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Yes, Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
