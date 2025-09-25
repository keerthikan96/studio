
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Eye, Trash2, Edit, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/lib/mock-data';
import { getDocumentsAction, deleteDocumentAction } from '@/app/actions/staff';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_FILE_TYPES = ['.jpeg', '.jpg', '.png', '.pdf', '.xls', '.xlsx', '.csv', '.docx', '.doc'];

const documentSchema = z.object({
  name: z.string().min(1, 'Document name is required.'),
  description: z.string().min(1, 'Description is required.'),
  file: z.instanceof(File).refine(file => file.size <= MAX_FILE_SIZE, `Max file size is 15MB.`).optional(),
});

const editDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required.'),
  description: z.string().min(1, 'Description is required.'),
});

type DocumentFormValues = z.infer<typeof documentSchema>;
type EditDocumentFormValues = z.infer<typeof editDocumentSchema>;

type DocumentsTabProps = {
  memberId: string;
};

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function DocumentsTab({ memberId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { toast } = useToast();

  const addForm = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema.refine(data => data.file, { message: "File is required.", path: ["file"] })),
  });

  const editForm = useForm<EditDocumentFormValues>({
    resolver: zodResolver(editDocumentSchema),
  });

  const fetchDocuments = () => {
    startTransition(() => {
      getDocumentsAction(memberId).then(setDocuments);
    });
  };

  useEffect(fetchDocuments, [memberId]);

  const onAddSubmit = (data: DocumentFormValues) => {
    if (!data.file) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('file', data.file);

      try {
        const response = await fetch(`/api/staff/${memberId}/documents`, {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        
        toast({ title: 'Document Added', description: 'The new document has been uploaded successfully.' });
        addForm.reset();
        setIsAddDialogOpen(false);
        fetchDocuments();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({ title: 'Upload Error', description: errorMessage, variant: 'destructive' });
      }
    });
  };
  
  const onEditSubmit = (data: EditDocumentFormValues) => {
    if (!selectedDocument) return;

    startTransition(async () => {
        try {
            const response = await fetch(`/api/staff/${memberId}/documents?docId=${selectedDocument.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            toast({ title: 'Document Updated', description: 'The document details have been updated.' });
            editForm.reset();
            setIsEditDialogOpen(false);
            fetchDocuments();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
            toast({ title: 'Update Error', description: errorMessage, variant: 'destructive' });
        }
    });
  };
  
  const onDeleteConfirm = () => {
    if (!selectedDocument) return;
    
    startTransition(async () => {
        try {
            const response = await fetch(`/api/staff/${memberId}/documents?docId=${selectedDocument.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete document.');
            }
            
            toast({ title: 'Document Deleted', description: 'The document has been removed.' });
            setIsDeleteDialogOpen(false);
            fetchDocuments();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
            toast({ title: 'Deletion Error', description: errorMessage, variant: 'destructive' });
        }
    });
  };

  const handleEditClick = (doc: Document) => {
    setSelectedDocument(doc);
    editForm.reset({ name: doc.name, description: doc.description });
    setIsEditDialogOpen(true);
  }

  const handleDeleteClick = (doc: Document) => {
    setSelectedDocument(doc);
    setIsDeleteDialogOpen(true);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Manage documents related to this member.</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Document</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add a New Document</DialogTitle>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <FormField control={addForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Document Name</FormLabel><FormControl><Input {...field} placeholder="e.g., Q3 Performance Review" /></FormControl><FormMessage /></FormItem>
                  )} />

                  <FormField control={addForm.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="A brief summary of the document." /></FormControl><FormMessage /></FormItem>
                  )} />

                  <FormField control={addForm.control} name="file" render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept={ALLOWED_FILE_TYPES.join(',')}
                          onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isPending}>
                          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Upload & Save'}
                      </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>File Size</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && documents.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
              ) : documents.length > 0 ? (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/>{doc.name}</TableCell>
                    <TableCell>{doc.description}</TableCell>
                    <TableCell>{doc.file_size ? formatBytes(doc.file_size) : 'N/A'}</TableCell>
                    <TableCell>{format(new Date(doc.created_at), 'PPP')}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" asChild><a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Eye className="mr-2 h-4 w-4"/>View</a></Button>
                       <Button variant="secondary" size="sm" onClick={() => handleEditClick(doc)}><Edit className="mr-2 h-4 w-4"/>Edit</Button>
                       <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(doc)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">No documents found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Document</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                    <FormField control={editForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Document Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={editForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete the document "{selectedDocument?.name}".</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDeleteConfirm} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Yes, Delete'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    