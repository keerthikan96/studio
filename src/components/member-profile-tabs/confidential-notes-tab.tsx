
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Paperclip, ShieldCheck, Eye, Star, X as XIcon, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Note } from '@/lib/mock-data';
import { getNotesAction } from '@/app/actions/staff';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';

const noteSchema = z.object({
  note_name: z.string().min(1, 'Note name is required.'),
  description: z.string().min(1, 'Description is required.'),
  pinned: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  attachments: z.any(),
});

type NoteFormValues = z.infer<typeof noteSchema>;

type ConfidentialNotesTabProps = {
  memberId: string;
};

export function ConfidentialNotesTab({ memberId }: ConfidentialNotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [userRole, setUserRole] = useState<'staff' | 'HR' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
    setUserRole(storedUser.role || 'staff');
  }, []);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      note_name: '',
      description: '',
      pinned: false,
      tags: [],
      attachments: undefined,
    },
  });
  
  const { register, control } = form;

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control,
    name: "tags",
  });

  const fetchNotes = () => {
    startTransition(() => {
      getNotesAction(memberId).then(allNotes => {
        setNotes(allNotes.filter(note => note.is_confidential));
      });
    });
  };

  useEffect(() => {
    if (userRole === 'HR') {
      fetchNotes();
    }
  }, [memberId, userRole]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !form.getValues('tags')?.includes(newTag)) {
        appendTag(newTag);
        setTagInput('');
      }
    }
  };

  const onSubmit = (data: NoteFormValues) => {
    startTransition(async () => {
      const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
      
      const formData = new FormData();
      formData.append('note_name', data.note_name);
      formData.append('description', data.description);
      formData.append('is_confidential', 'true'); // Always confidential in this tab
      formData.append('pinned', String(data.pinned));
      data.tags?.forEach(tag => formData.append('tags', tag));
      formData.append('created_by_id', loggedInUser.id || 'unknown_user');
      formData.append('created_by_name', loggedInUser.name || 'Unknown User');
      
      const fileInput = form.control._fields.attachments?._f.ref as HTMLInputElement;
      if (fileInput && fileInput.files) {
        for (let i = 0; i < fileInput.files.length; i++) {
          formData.append('attachments', fileInput.files[i]);
        }
      }

      try {
        const response = await fetch(`/api/staff/${memberId}/notes`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to add note.');
        }
        
        toast({ title: 'Confidential Note Added', description: 'The new note has been saved successfully.' });
        form.reset();
        setIsDialogOpen(false);
        fetchNotes(); // Refresh the notes list
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      }
    });
  };

  if (userRole !== 'HR') {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Confidential Notes</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <Lock className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You do not have permission to view confidential notes.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Confidential Member Notes</CardTitle>
          <CardDescription>Log and view confidential notes for this member.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Confidential Note</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add a New Confidential Note</DialogTitle>
              <DialogDescription>
                This note will only be visible to authorized personnel. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-6">
              <div className="pr-1">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="note_name" render={({ field }) => (
                        <FormItem><FormLabel>Note Name</FormLabel><FormControl><Input {...field} placeholder="e.g., Q3 Performance Concern" /></FormControl><FormMessage /></FormItem>
                    )} />

                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={5} placeholder="Detailed notes..." /></FormControl><FormMessage /></FormItem>
                    )} />

                    <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                            <div>
                            <Input placeholder="Type a tag and press Enter" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tagFields.map((field, index) => (
                                <Badge key={field.id} variant="secondary" className="flex items-center gap-1">
                                    {form.getValues('tags')?.[index]}
                                    <button type="button" onClick={() => removeTag(index)}><XIcon className="h-3 w-3" /></button>
                                </Badge>
                                ))}
                            </div>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>

                    <FormItem><FormLabel>Attachments</FormLabel><FormControl><Input type="file" multiple {...register("attachments")} /></FormControl><FormMessage /></FormItem>

                    <FormField control={form.control} name="pinned" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                            <div className="space-y-0.5"><FormLabel>Pin to Top</FormLabel></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    
                    <DialogFooter className="pr-0 pt-4">
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Note
                        </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Note</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending && notes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
            ) : notes.length > 0 ? (
              notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="font-medium">{note.note_name}</TableCell>
                  <TableCell>{note.created_by_name}</TableCell>
                  <TableCell>{format(new Date(note.created_at), 'PPP')}</TableCell>
                  <TableCell className="space-x-2">
                    {note.pinned && <Badge variant="default" className='bg-yellow-500 hover:bg-yellow-600'><Star className="mr-1 h-3 w-3"/>Pinned</Badge>}
                    <Badge variant="destructive"><ShieldCheck className="mr-1 h-3 w-3"/>Confidential</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/>View</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{note.note_name}</DialogTitle>
                                <DialogDescription>Created by {note.created_by_name} on {format(new Date(note.created_at), 'PPP p')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.description}</p>
                                {note.tags && note.tags.length > 0 && (
                                    <div><h4 className="font-medium mb-2">Tags</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {note.tags.map((tag, index) => <Badge key={index} variant="secondary">{tag}</Badge>)}
                                        </div>
                                    </div>
                                )}
                                {note.attachments && note.attachments.length > 0 && (
                                    <div><h4 className="font-medium mb-2">Attachments</h4>
                                        <ul className="space-y-2">
                                            {note.attachments.map((file, index) => (
                                                <li key={index} className="flex items-center text-sm">
                                                    <Paperclip className="h-4 w-4 mr-2 text-muted-foreground"/>
                                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{file.name}</a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="h-24 text-center">No confidential notes found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
