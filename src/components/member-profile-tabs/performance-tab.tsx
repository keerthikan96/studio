
'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
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
import { Loader2, PlusCircle, Paperclip, ShieldCheck, Eye, CalendarIcon, Star, Trash, X as XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PerformanceRecord } from '@/lib/mock-data';
import { getPerformanceRecordsAction } from '@/app/actions/staff';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { Slider } from '../ui/slider';
import { DateRange } from 'react-day-picker';

const recordSchema = z.object({
  review_date: z.date({ required_error: "A review date is required." }),
  score: z.number().min(0).max(100).optional(),
  comments: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_confidential: z.boolean().default(false),
  pinned: z.boolean().default(false),
  attachments: z.any(),
});

type RecordFormValues = z.infer<typeof recordSchema>;

type PerformanceTabProps = {
  memberId: string;
};

export function PerformanceTab({ memberId }: PerformanceTabProps) {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();

  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      review_date: new Date(),
      score: 50,
      comments: '',
      tags: [],
      is_confidential: false,
      pinned: false,
      attachments: undefined,
    },
  });
  
  const { register, control, watch } = form;
  const scoreValue = watch('score');
  
  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control,
    name: "tags",
  });

  const fetchRecords = () => {
    startTransition(() => {
      getPerformanceRecordsAction(memberId).then(setRecords);
    });
  };

  useEffect(() => {
    fetchRecords();
  }, [memberId]);

  const filteredRecords = useMemo(() => {
    if (!dateRange || (!dateRange.from && !dateRange.to)) {
      return records;
    }
    return records.filter(record => {
      const recordDate = new Date(record.review_date);
      if (dateRange.from && recordDate < dateRange.from) {
        return false;
      }
      // Set the 'to' date to the end of the day for inclusive filtering
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (recordDate > toDate) {
          return false;
        }
      }
      return true;
    });
  }, [records, dateRange]);


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

  const onSubmit = (data: RecordFormValues) => {
    startTransition(async () => {
      const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
      
      const formData = new FormData();
      formData.append('review_date', format(data.review_date, 'yyyy-MM-dd'));
      if(data.score) formData.append('score', data.score.toString());
      if(data.comments) formData.append('comments', data.comments);
      data.tags?.forEach(tag => formData.append('tags', tag));
      formData.append('is_confidential', String(data.is_confidential));
      formData.append('pinned', String(data.pinned));
      formData.append('reviewer_id', loggedInUser.id || 'unknown_user');
      formData.append('reviewer_name', loggedInUser.name || 'Unknown User');
      
      const fileInput = form.control._fields.attachments?._f.ref as HTMLInputElement;
      if (fileInput && fileInput.files) {
        for (let i = 0; i < fileInput.files.length; i++) {
          formData.append('attachments', fileInput.files[i]);
        }
      }

      try {
        const response = await fetch(`/api/staff/${memberId}/performance`, {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to add record.');
        
        toast({ title: 'Record Added', description: 'The new performance record has been saved.' });
        form.reset();
        setIsDialogOpen(false);
        fetchRecords();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Performance Records</CardTitle>
          <CardDescription>Log and view performance reviews for this member.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(dateRange.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                <DialogTitle>Add Performance Record</DialogTitle>
                <DialogDescription>Fill in the details for the performance review.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="review_date" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date of Review</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>
                    )} />

                    <FormField control={form.control} name="score" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Performance Score: <span className='font-bold'>{scoreValue}%</span></FormLabel>
                        <FormControl><Slider defaultValue={[50]} max={100} step={1} onValueChange={(val) => field.onChange(val[0])} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />

                    <FormField control={form.control} name="comments" render={({ field }) => (
                    <FormItem><FormLabel>Comments</FormLabel><FormControl><Textarea {...field} rows={5} placeholder="Detailed feedback..." /></FormControl><FormMessage /></FormItem>
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

                    <div className="flex justify-between gap-4">
                    <FormField control={form.control} name="is_confidential" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                        <div className="space-y-0.5"><FormLabel>Confidential</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="pinned" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                        <div className="space-y-0.5"><FormLabel>Pin to Top</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    </div>

                    <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Record</Button>
                    </DialogFooter>
                </form>
                </Form>
            </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Review Date</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending && filteredRecords.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{format(new Date(record.review_date), 'PPP')}</TableCell>
                  <TableCell>{record.reviewer_name}</TableCell>
                  <TableCell>{record.score !== null ? `${record.score}%` : 'N/A'}</TableCell>
                  <TableCell className="space-x-2">
                    {record.pinned && <Badge variant="default" className='bg-yellow-500 hover:bg-yellow-600'><Star className="mr-1 h-3 w-3"/>Pinned</Badge>}
                    {record.is_confidential && <Badge variant="destructive"><ShieldCheck className="mr-1 h-3 w-3"/>Confidential</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                     <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/>View</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Performance Review</DialogTitle>
                                <DialogDescription>Review by {record.reviewer_name} on {format(new Date(record.review_date), 'PPP')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {record.score && <div><h4 className="font-medium mb-2">Score</h4><p>{record.score}%</p></div>}
                                {record.comments && <div><h4 className="font-medium mb-2">Comments</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.comments}</p></div>}
                                {record.tags && record.tags.length > 0 && (
                                    <div><h4 className="font-medium mb-2">Tags</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {record.tags.map((tag, index) => <Badge key={index} variant="secondary">{tag}</Badge>)}
                                        </div>
                                    </div>
                                )}
                                {record.attachments && record.attachments.length > 0 && (
                                    <div><h4 className="font-medium mb-2">Attachments</h4>
                                        <ul className="space-y-2">
                                            {record.attachments.map((file, index) => (
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
              <TableRow><TableCell colSpan={5} className="h-24 text-center">No performance records found for the selected date range.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

      