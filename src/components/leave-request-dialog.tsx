
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from './ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Button } from './ui/button';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInBusinessDays } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Textarea } from './ui/textarea';
import { LeaveCategory, LeaveEntitlement } from '@/lib/mock-data';
import { useTransition, useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { createLeaveRequestAction, getLeaveCategoriesAction, getMemberEntitlementsAction } from '@/app/actions/leave';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';

const formSchema = z.object({
    category_id: z.string().min(1, "Leave category is required."),
    date_range: z.object({
        from: z.date({ required_error: "Start date is required."}),
        to: z.date({ required_error: "End date is required."}),
    }),
    reason: z.string().min(1, "Reason is required."),
    project: z.string().min(1, "Project is required."),
    project_lead: z.string().min(1, "Project Lead is required."),
    direct_report: z.string().min(1, "Direct Report is required."),
});

type FormValues = z.infer<typeof formSchema>;

// Mock data for new fields
const mockProjects = ['Project Alpha', 'Project Beta', 'Project Gamma'];
const mockLeads = ['Alice', 'Bob', 'Charlie'];
const mockReports = ['David', 'Eve', 'Frank'];

type LeaveRequestDialogProps = {
    userId: string;
    onNewRequest: () => void;
};

export function LeaveRequestDialog({ userId, onNewRequest }: LeaveRequestDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [categories, setCategories] = useState<LeaveCategory[]>([]);
    const [entitlements, setEntitlements] = useState<LeaveEntitlement[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (isDialogOpen && userId) {
            const currentYear = new Date().getFullYear();
            Promise.all([
                getLeaveCategoriesAction(),
                getMemberEntitlementsAction(userId, currentYear),
            ]).then(([cats, ents]) => {
                setCategories(cats);
                setEntitlements(ents);
            });
        }
    }, [isDialogOpen, userId]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { reason: '', project: '', project_lead: '', direct_report: '' },
    });

    const onSubmit = (data: FormValues) => {
        const { from, to } = data.date_range;
        if (!from || !to) return;
        const days = differenceInBusinessDays(to, from) + 1;
        
        startTransition(async () => {
            const result = await createLeaveRequestAction({ member_id: userId, days, ...data, start_date: format(from, 'yyyy-MM-dd'), end_date: format(to, 'yyyy-MM-dd') });
            if ('error' in result) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Success', description: 'Your leave request has been submitted.' });
                form.reset();
                setIsDialogOpen(false);
                onNewRequest();
            }
        });
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Leave
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Apply for Leave</DialogTitle>
                    <DialogDescription>Fill out the form to request time off.</DialogDescription>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                    <h3 className="font-semibold">My Entitlements</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {entitlements.length > 0 ? entitlements.map(ent => (
                             <div key={ent.id}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">{ent.leave_category_name}</span>
                                    <span className="text-sm text-muted-foreground">{ent.days} days</span>
                                </div>
                                <Progress value={(ent.days / 20) * 100} />
                            </div>
                        )) : <p className="text-sm text-muted-foreground col-span-full">No entitlements found for this year.</p>}
                    </div>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="category_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Leave Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category..." /></SelectTrigger></FormControl>
                                        <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="date_range" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Leave Dates</FormLabel>
                                    <Popover><PopoverTrigger asChild>
                                        <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value?.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>) : (format(field.value.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar initialFocus mode="range" defaultMonth={field.value?.from} selected={field.value as DateRange} onSelect={field.onChange} numberOfMonths={2}/>
                                    </PopoverContent>
                                    </Popover><FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="project" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Working Project</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a project..." /></SelectTrigger></FormControl>
                                        <SelectContent>{mockProjects.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="project_lead" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Lead</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a lead..." /></SelectTrigger></FormControl>
                                        <SelectContent>{mockLeads.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="direct_report" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Direct Report</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a report..." /></SelectTrigger></FormControl>
                                        <SelectContent>{mockReports.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        
                        <FormField control={form.control} name="reason" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reason for Leave</FormLabel>
                                <FormControl><Textarea placeholder="Please provide a brief reason for your leave request." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Request
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
