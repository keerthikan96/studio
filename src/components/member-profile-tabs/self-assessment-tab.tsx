
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
import { Loader2, PlusCircle, Paperclip, Eye, CalendarIcon, X as XIcon, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SelfEvaluation, AssessmentCategory, AssessmentCategoryComment } from '@/lib/mock-data';
import { getSelfEvaluationsAction, updateSelfEvaluationAction, getAssessmentCategoriesAction } from '@/app/actions/staff';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { Slider } from '../ui/slider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '../ui/alert-dialog';
import { DateRange } from 'react-day-picker';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';


const evaluationCommentSchema = z.object({
  category: z.string().min(1, "Category is required"),
  comment: z.string().min(1, "Comment is required"),
});

const evaluationSchema = z.object({
  evaluation_date: z.date({ required_error: "An evaluation date is required." }),
  comments: z.array(evaluationCommentSchema).min(1, "At least one category comment is required."),
  self_rating: z.number().min(0).max(100).optional(),
  other_comments: z.string().optional(),
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
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<SelfEvaluation | null>(null);
  const [userRole, setUserRole] = useState<'staff' | 'HR' | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [isCategoryPopoverOpen, setCategoryPopoverOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
    setUserRole(storedUser.role === 'HR' ? 'HR' : (storedUser.role || 'staff'));
  }, []);

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: { evaluation_date: new Date(), self_rating: 50, comments: [], other_comments: '', tags: [], attachments: undefined },
  });
  
  const hrForm = useForm<HrFeedbackFormValues>({
    resolver: zodResolver(hrFeedbackSchema),
    defaultValues: { hr_feedback: '' },
  });

  const { register, control, watch } = form;
  const ratingValue = watch('self_rating');

  const { fields: commentFields, append: appendComment, remove: removeComment } = useFieldArray({
    control, name: "comments"
  });

  const fetchInitialData = () => {
    startTransition(() => {
      getSelfEvaluationsAction(memberId).then(setEvaluations);
      getAssessmentCategoriesAction().then(setCategories);
    });
  };

  useEffect(fetchInitialData, [memberId]);

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

  const onSubmit = (data: EvaluationFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('evaluation_date', format(data.evaluation_date, 'yyyy-MM-dd'));
      if(data.self_rating) formData.append('self_rating', data.self_rating.toString());
      
      formData.append('comments', JSON.stringify(data.comments));
      
      if (data.other_comments) {
        formData.append('other_comments', data.other_comments);
      }

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
        fetchInitialData();
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
            fetchInitialData();
            setIsFinalizeDialogOpen(false);
            setSelectedEvaluation(null);
        }
    });
  }
  
  const unselectedCategories = useMemo(() => {
    const selected = form.watch('comments').map(c => c.category);
    return categories.filter(c => !selected.includes(c.name));
  }, [categories, form.watch('comments')]);


  const statusStyles: {[key: string]: string} = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Finalized': 'bg-green-100 text-green-800',
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <CardTitle>Self-Performance Evaluation</CardTitle>
                <CardDescription>Submit and view your self-assessments.</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full md:w-[300px] justify-start text-left font-normal",
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
                            <Button className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Evaluation</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                            <DialogTitle>Add Self-Evaluation</DialogTitle>
                            <DialogDescription>Reflect on your performance. Click save when you're done.</DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[70vh] pr-6">
                                <div className="pr-1 pt-4">
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
                                        
                                        <div className="space-y-4">
                                            <FormLabel>Category-wise Comments</FormLabel>
                                            {commentFields.map((field, index) => (
                                                <Card key={field.id} className="p-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`comments.${index}.comment`}
                                                        render={({ field: commentField }) => (
                                                            <FormItem>
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <FormLabel>{form.getValues(`comments.${index}.category`)}</FormLabel>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeComment(index)}>
                                                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                                                    </Button>
                                                                </div>
                                                                <FormControl>
                                                                    <Textarea
                                                                        {...commentField}
                                                                        placeholder={`Add your comments for ${form.getValues(`comments.${index}.category`)}...`}
                                                                        rows={3}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </Card>
                                            ))}
                                            <FormMessage>{form.formState.errors.comments?.root?.message}</FormMessage>

                                            <Popover open={isCategoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" role="combobox" aria-expanded={isCategoryPopoverOpen} className="w-full justify-between" disabled={unselectedCategories.length === 0}>
                                                        {unselectedCategories.length > 0 ? "Add another category..." : "All categories added"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search category..." />
                                                        <CommandList>
                                                            <CommandEmpty>No categories found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {unselectedCategories.map((category) => (
                                                                <CommandItem
                                                                    key={category.id}
                                                                    value={category.name}
                                                                    onSelect={() => {
                                                                        appendComment({ category: category.name, comment: '' });
                                                                        setCategoryPopoverOpen(false);
                                                                    }}
                                                                >
                                                                     <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            commentFields.some(c => c.category === category.name) ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {category.name}
                                                                </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <FormField control={form.control} name="self_rating" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Overall Self-Rating: <span className='font-bold'>{ratingValue}%</span></FormLabel>
                                            <FormControl><Slider defaultValue={[50]} max={100} step={1} onValueChange={(val) => field.onChange(val[0])} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )} />
                                        
                                        <FormField control={form.control} name="other_comments" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Other Comments</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} rows={4} placeholder="Add any other comments or thoughts here..." />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        
                                        <DialogFooter className="pt-4">
                                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                            <Button type="submit" disabled={isPending}>
                                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Evaluation
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
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
                  <TableCell>{item.self_rating !== null && item.self_rating !== undefined ? `${item.self_rating}%` : 'N/A'}</TableCell>
                  <TableCell><Badge variant="outline" className={cn(statusStyles[item.status])}>{item.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/>View</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Self-Evaluation Details</DialogTitle>
                                <DialogDescription>Submitted on {format(new Date(item.evaluation_date), 'PPP')}</DialogDescription>
                            </DialogHeader>
                             <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                {item.comments && item.comments.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2">Category Comments</h4>
                                    <div className="space-y-2">
                                        {item.comments.map((c, i) => (
                                            <div key={i} className="p-3 bg-muted rounded-md">
                                                <p className="font-semibold text-sm">{c.category}</p>
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}
                                {item.self_rating && <div><h4 className="font-medium mb-2">Overall Self-Rating</h4><p>{item.self_rating}%</p></div>}
                                 {item.other_comments && <div><h4 className="font-medium mb-2">Other Comments</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.other_comments}</p></div>}
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

    