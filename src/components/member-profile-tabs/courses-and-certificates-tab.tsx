
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Award, BookOpen, Link as LinkIcon, CheckCircle, ExternalLink, Share2, Annoyed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CourseOrCertificate } from '@/lib/mock-data';
import { getCoursesAndCertificatesAction } from '@/app/actions/staff';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const formSchema = z.object({
  type: z.enum(['Course', 'Certificate']),
  name: z.string().min(1, 'Name is required.'),
  provider: z.string().optional(),
  course_url: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  status: z.enum(['Completed', 'In Progress']).optional(),
  verification_url: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  certificate: z.any().optional(),
}).refine(data => {
    if (data.type === 'Certificate' && !data.certificate) {
        return false;
    }
    return true;
}, {
    message: 'Certificate file is mandatory.',
    path: ['certificate'],
});

type FormValues = z.infer<typeof formSchema>;

type CoursesAndCertificatesTabProps = {
  memberId: string;
  memberName: string;
};

export function CoursesAndCertificatesTab({ memberId, memberName }: CoursesAndCertificatesTabProps) {
  const [records, setRecords] = useState<CourseOrCertificate[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CourseOrCertificate | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: 'Course', name: '' },
  });
  
  const watchedType = form.watch('type');

  const fetchRecords = () => {
    startTransition(() => {
      getCoursesAndCertificatesAction(memberId).then(setRecords);
    });
  };

  useEffect(fetchRecords, [memberId]);
  
  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) {
            if (key === 'certificate' && value instanceof File) {
                formData.append(key, value);
            } else if (key !== 'certificate') {
                formData.append(key, value as string);
            }
        }
      });

      try {
        const response = await fetch(`/api/staff/${memberId}/certificates-and-courses`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to add record.');
        
        toast({ title: `${data.type} Added`, description: `"${data.name}" has been successfully saved.` });
        setLastAddedItem(result);
        setShowShareDialog(true); // Trigger share dialog
        form.reset({ type: 'Course', name: '' });
        setIsDialogOpen(false);
        fetchRecords();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      }
    });
  };
  
  const handleShareToFeed = () => {
    if (!lastAddedItem) return;
    console.log(`Sharing achievement to news feed: ${memberName} completed ${lastAddedItem.name}`);
     toast({
      title: "Shared to Feed!",
      description: `An announcement about this achievement has been posted.`,
    });
    setShowShareDialog(false);
    setLastAddedItem(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Certificates & Courses</CardTitle>
            <CardDescription>Manage member's professional development records.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Course or Certificate</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem><FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="Course">Course</SelectItem><SelectItem value="Certificate">Certificate</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                  )} />

                  <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder={watchedType === 'Course' ? 'e.g., Advanced React' : 'e.g., AWS Certified Developer'} /></FormControl><FormMessage /></FormItem>
                  )} />

                  {watchedType === 'Course' && (
                    <>
                      <FormField control={form.control} name="provider" render={({ field }) => (
                          <FormItem><FormLabel>Provider</FormLabel><FormControl><Input {...field} placeholder="e.g., Coursera, Udemy" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="course_url" render={({ field }) => (
                          <FormItem><FormLabel>Course URL</FormLabel><FormControl><Input {...field} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="status" render={({ field }) => (
                          <FormItem><FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select status..."/></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="Completed">Completed</SelectItem><SelectItem value="In Progress">In Progress</SelectItem></SelectContent>
                            </Select><FormMessage />
                          </FormItem>
                      )} />
                    </>
                  )}
                  
                  <FormField control={form.control} name="verification_url" render={({ field }) => (
                      <FormItem><FormLabel>Verification URL</FormLabel><FormControl><Input {...field} placeholder="https://credential.net/..." /></FormControl><FormMessage /></FormItem>
                  )} />

                   <FormField control={form.control} name="certificate" render={({ field: { onChange, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Certificate File {watchedType === 'Certificate' && <span className='text-destructive'>*</span>}</FormLabel>
                      <FormControl>
                        <Input type="file" accept={ALLOWED_FILE_TYPES.join(',')} onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} {...rest} />
                      </FormControl>
                       <FormDescription>PDF, JPG, or PNG file. Max 15MB.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isPending}>
                          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Record'}
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
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Links</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && records.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
              ) : records.length > 0 ? (
                records.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {item.type === 'Course' ? <BookOpen className='h-4 w-4 text-muted-foreground' /> : <Award className='h-4 w-4 text-muted-foreground' />}
                        {item.type}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.provider || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(item.created_at), 'PPP')}</TableCell>
                    <TableCell className="text-right space-x-2">
                        {item.course_url && <Button variant="outline" size="sm" asChild><a href={item.course_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4"/></a></Button>}
                        {item.verification_url && <Button variant="outline" size="sm" asChild><a href={item.verification_url} target="_blank" rel="noopener noreferrer"><CheckCircle className="h-4 w-4"/></a></Button>}
                        {item.certificate_url && <Button variant="outline" size="sm" asChild><a href={item.certificate_url} target="_blank" rel="noopener noreferrer"><LinkIcon className="h-4 w-4"/></a></Button>}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">No courses or certificates found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Achievement Unlocked!</AlertDialogTitle>
                <AlertDialogDescription>
                    Would you like to share this achievement with the rest of the company on the Workfeed?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                    <Annoyed className="mr-2 h-4 w-4" /> No, Thanks
                </Button>
                <Button onClick={handleShareToFeed}>
                    <Share2 className="mr-2 h-4 w-4" /> Share to Feed
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
