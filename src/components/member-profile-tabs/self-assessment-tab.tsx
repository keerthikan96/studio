
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Paperclip, Eye, CalendarIcon, Star, X as XIcon, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SelfEvaluation } from '@/lib/mock-data';
import { getSelfEvaluationsAction, updateSelfEvaluationAction } from '@/app/actions/staff';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { Slider } from '../ui/slider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '../ui/alert-dialog';
import { DateRange } from 'react-day-picker';


const evaluationSchema = z.object({
  evaluation_date: z.date({ required_error: "A evaluation date is required." }),
  self_rating: z.number().min(0).max(100).optional(),
  comments: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.any(),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

const hrFeedbackSchema = z.object({
  hr_feedback: z.string().min(1, "Feedback is required."),
});
type HrFeedbackFormValues = z.infer<typeof hrFeedbackSchema>;

type SelfAssessmentTabProps = {
  memberId: string;
};

export function SelfAssessmentTab({ memberId }: SelfAssessmentTabProps) {
  const [evaluations, setEvaluations] = useState<SelfEvaluation[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<SelfEvaluation | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [userRole, setUserRole] = useState<'staff' | 'HR' | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    setIsClient(true);
    const storedUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
    setUserRole(storedUser.role === 'admin' ? 'HR' : (storedUser.role || 'staff'));
  }, []);

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: { evaluation_date: new Date(), self_rating: 50, comments: '', tags: [], attachments: undefined },
  });
  
  const hrForm = useForm<HrFeedbackFormValues>({
    resolver: zodResolver(hrFeedbackSchema),
    defaultValues: { hr_feedback: '' },
  });

  const { register, control, watch } = form;
  const ratingValue = watch('self_rating');
  
  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control, name: "tags",
  });

  const fetchEvaluations = () => {
    startTransition(() => {
      getSelfEvaluationsAction(memberId).then(setEvaluations);
    });
  };

  useEffect(fetchEvaluations, [memberId]);

  const filteredEvaluations = useMemo(() => {
    if (!date || (!date.from && !date.to)) {
      return evaluations;
    }
    return evaluations.filter(evaluation => {
      const evaluationDate = new Date(evaluation.evaluation_date);
      if (date.from && evaluationDate < date.from) {
        return false;
      }
      if (date.to) {
        const toDate = new Date(date.to);
        toDate.setHours(23, 59, 59, 999);
        if (evaluationDate > toDate) {
          return false;
        }
      }
      return true;
    });
  }, [evaluations, date]);

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

  const onSubmit = (data: EvaluationFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('evaluation_date', format(data.evaluation_date, 'yyyy-MM-dd'));
      if(data.self_rating) formData.append('self_rating', data.self_rating.toString());
      if(data.comments) formData.append('comments', data.comments);
      data.tags?.forEach(tag => formData.append('tags', tag));
      
      const fileInput = form.control._fields.attachments?._f.ref as HTMLInputElement;
      if (fileInput && fileInput.files) {
        for (let i = 0; i < fileInput.files.length; i++) {
          formData.append('attachments', fileInput.files[i]);
        }
      }

      try {
        const response = await fetch(`/api/staff/${memberId}/self-evaluation`, {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to add evaluation.');
        
        toast({ title: 'Evaluation Submitted', description: 'Your self-evaluation has been recorded.' });
        form.reset();
        setIsAddDialogOpen(false);
        fetchEvaluations();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      }
    });
  };

  const onFinalizeSubmit = (data: HrFeedbackFormValues) => {
    if (!selectedEvaluation) return;
    startTransition(async () => {
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
        const result = await updateSelfEvaluationAction(selectedEvaluation.id, {
            hr_feedback: data.hr_feedback,
            status: 'Finalized',
            finalized_by_id: loggedInUser.id,
            finalized_by_name: loggedInUser.name
        });

        if ('error' in result) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Evaluation Finalized", description: "Feedback has been submitted." });
            fetchEvaluations();
            setIsFinalizeDialogOpen(false);
            setSelectedEvaluation(null);
        }
    });
  }

  const statusStyles: {[key: string]: string} = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Finalized': 'bg-green-100 text-green-800',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Self-Performance Evaluation</CardTitle>
          <CardDescription>Submit and view your self-assessments.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
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
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {isClient && userRole !== 'HR' && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Evaluation</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                    <DialogTitle>Add Self-Evaluation</DialogTitle>
                    <DialogDescription>Reflect on your performance. Click save when you're done.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="evaluation_date" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Evaluation Date</FormLabel>
                            <Popover><PopoverTrigger asChild>
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

                        <FormField control={form.control} name="self_rating" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Self-Rating: <span className='font-bold'>{ratingValue}%</span></FormLabel>
                            <FormControl><Slider defaultValue={[50]} max={100} step={1} onValueChange={(val) => field.onChange(val[0])} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />

                        <FormField control={form.control} name="comments" render={({ field }) => (
                        <FormItem><FormLabel>Reflections/Comments</FormLabel><FormControl><Textarea {...field} rows={5} placeholder="Your thoughts on your performance, achievements, and areas for improvement..." /></FormControl><FormMessage /></FormItem>
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
                        
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Evaluation
                            </Button>
                        </DialogFooter>
                    </form>
                    </Form>
                </DialogContent>
                </Dialog>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evaluation Date</TableHead>
              <TableHead>Self-Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending && filteredEvaluations.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
            ) : filteredEvaluations.length > 0 ? (
              filteredEvaluations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{format(new Date(item.evaluation_date), 'PPP')}</TableCell>
                  <TableCell>{item.self_rating !== null ? `${item.self_rating}%` : 'N/A'}</TableCell>
                  <TableCell><Badge variant="outline" className={cn(statusStyles[item.status])}>{item.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/>View</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Self-Evaluation Details</DialogTitle>
                                <DialogDescription>Submitted on {format(new Date(item.evaluation_date), 'PPP')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                {item.self_rating && <div><h4 className="font-medium mb-2">Self-Rating</h4><p>{item.self_rating}%</p></div>}
                                {item.comments && <div><h4 className="font-medium mb-2">Comments</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.comments}</p></div>}
                                {item.tags && item.tags.length > 0 && (
                                    <div><h4 className="font-medium mb-2">Tags</h4>
                                        <div className="flex flex-wrap gap-2">{item.tags.map((tag, index) => <Badge key={index} variant="secondary">{tag}</Badge>)}</div>
                                    </div>
                                )}
                                {item.attachments && item.attachments.length > 0 && (
                                    <div><h4 className="font-medium mb-2">Attachments</h4>
                                        <ul className="space-y-2">{item.attachments.map((file, index) => (
                                            <li key={index} className="flex items-center text-sm"><Paperclip className="h-4 w-4 mr-2 text-muted-foreground"/>
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{file.name}</a>
                                            </li>
                                        ))}</ul>
                                    </div>
                                )}
                                <hr />
                                <div>
                                    <h4 className="font-medium mb-2">Manager/HR Feedback</h4>
                                    {item.status === 'Finalized' && item.hr_feedback ? (
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.hr_feedback}</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Pending feedback.</p>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                    {isClient && userRole === 'HR' && item.status === 'Pending' && (
                        <Button variant="default" size="sm" onClick={() => { setSelectedEvaluation(item); setIsFinalizeDialogOpen(true); }}>
                            <Edit className="mr-2 h-4 w-4"/> Finalize
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="h-24 text-center">No self-evaluations found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <AlertDialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Finalize Evaluation</AlertDialogTitle>
                    <AlertDialogDescription>Provide feedback for the self-evaluation submitted on {selectedEvaluation ? format(new Date(selectedEvaluation.evaluation_date), 'PPP') : ''}. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <Form {...hrForm}>
                    <form onSubmit={hrForm.handleSubmit(onFinalizeSubmit)} id="hr-feedback-form">
                        <FormField control={hrForm.control} name="hr_feedback" render={({field}) => (
                            <FormItem>
                                <FormLabel>Your Feedback</FormLabel>
                                <FormControl><Textarea {...field} rows={5} placeholder="Provide constructive feedback..." /></FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                    </form>
                </Form>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button type="submit" form="hr-feedback-form" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Submit & Finalize
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
