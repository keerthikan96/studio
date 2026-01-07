
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentCategory } from '@/app/actions/documents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { DocumentPreview } from '../document-preview';

const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'application/pdf',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  isCompanyWide: z.boolean().default(false),
  file: z.any()
    .refine((files) => files?.length == 1, 'File is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE_BYTES, `Max file size is ${MAX_FILE_SIZE_MB}MB.`)
    .refine(
      (files) => ALLOWED_FILE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .png, .pdf, .xls(x), .csv, and .doc(x) formats are supported."
    ),
});

type FormValues = z.infer<typeof formSchema>;

type DocumentUploadDialogProps = {
  categories: DocumentCategory[];
  onUploadSuccess: () => void;
  userId?: string;
};

export function DocumentUploadDialog({ categories, onUploadSuccess, userId }: DocumentUploadDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      isCompanyWide: false,
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!userId) {
        toast({ title: 'Error', description: 'You must be logged in to upload a document.', variant: 'destructive'});
        return;
    }
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      if (data.categoryId) formData.append('categoryId', data.categoryId);
      formData.append('isCompanyWide', String(data.isCompanyWide));
      formData.append('file', data.file[0]);
      formData.append('uploadedBy', userId);

      try {
        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to upload document.');
        }

        toast({ title: 'Upload Successful', description: `"${data.title}" has been uploaded.` });
        setSelectedFile(null);
        form.reset();
        setIsDialogOpen(false);
        onUploadSuccess();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast({ title: 'Upload Failed', description: errorMessage, variant: 'destructive' });
      }
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload New Document</DialogTitle>
          <DialogDescription>
            Select a file and provide details to add it to the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Document Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem><FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a category (optional)" /></SelectTrigger></FormControl>
                  <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="isCompanyWide" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5"><FormLabel>Company Wide</FormLabel><FormDescription>Make this document visible to everyone.</FormDescription></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="file" render={({ field }) => (
                <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                        <Input
                            type="file"
                            onChange={(e) => {
                                field.onChange(e.target.files);
                                setSelectedFile(e.target.files?.[0] || null);
                            }}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            {selectedFile && (
              <DocumentPreview 
                file={selectedFile} 
                onClear={() => {
                  setSelectedFile(null);
                  form.setValue('file', undefined);
                }}
              />
            )}
            
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
