
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInBusinessDays } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Textarea } from '../ui/textarea';
import { LeaveCategory } from '@/lib/mock-data';
import { useTransition, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { createLeaveRequestAction } from '@/app/actions/leave';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
    category_id: z.string().min(1, "Leave category is required."),
    date_range: z.object({
        from: z.date({ required_error: "Start date is required."}),
        to: z.date({ required_error: "End date is required."}),
    }),
    reason: z.string().min(1, "Reason is required."),
});

type FormValues = z.infer<typeof formSchema>;

type LeaveRequestFormProps = {
    categories: LeaveCategory[];
    userId: string;
    onNewRequest: () => void;
};

export function LeaveRequestForm({ categories, userId, onNewRequest }: LeaveRequestFormProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reason: '',
        }
    });

    const onSubmit = (data: FormValues) => {
        const { from, to } = data.date_range;
        if (!from || !to) return;

        const days = differenceInBusinessDays(to, from) + 1;
        
        startTransition(async () => {
            const result = await createLeaveRequestAction({
                member_id: userId,
                category_id: data.category_id,
                start_date: format(from, 'yyyy-MM-dd'),
                end_date: format(to, 'yyyy-MM-dd'),
                days: days,
                reason: data.reason
            });

            if ('error' in result) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Success', description: 'Your leave request has been submitted.' });
                form.reset();
                onNewRequest(); // Notify parent to refetch data
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Apply for Leave</CardTitle>
                <CardDescription>Fill out the form to request time off.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="category_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Leave Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a category..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date_range"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Leave Dates</FormLabel>
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value?.from ? (
                                            field.value.to ? (
                                            <>
                                                {format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}
                                            </>
                                            ) : (
                                            format(field.value.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={field.value?.from}
                                        selected={field.value as DateRange}
                                        onSelect={field.onChange}
                                        numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason for Leave</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Please provide a brief reason for your leave request." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Request
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
