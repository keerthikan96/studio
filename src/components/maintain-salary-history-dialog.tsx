
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { Button } from './ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { DateRange } from 'react-day-picker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

// Mock data for salary history
const mockSalaryHistory = [
    {
        id: 'rec1',
        effectiveRange: { from: new Date('2023-01-01'), to: new Date('2023-12-31') },
        basicSalary: 4800,
        overtimeRate: 35,
        allowances: { transport: 150, meal: 100 },
        deductions: { incomeTax: 850, pensionFund: 400 },
    },
    {
        id: 'rec2',
        effectiveRange: { from: new Date('2024-01-01'), to: undefined },
        basicSalary: 5000,
        overtimeRate: 37.50,
        allowances: { transport: 150, meal: 100 },
        deductions: { incomeTax: 900, pensionFund: 400, healthInsurance: 150 },
    },
];

const salaryRecordSchema = z.object({
    effectiveRange: z.object({
        from: z.date({ required_error: "Start date is required."}),
        to: z.date().optional(),
    }),
    basicSalary: z.number().min(0, "Salary must be positive."),
    overtimeRate: z.number().min(0, "Rate must be positive.").optional(),
    allowances: z.object({
        transport: z.number().optional(),
        meal: z.number().optional(),
    }).optional(),
    deductions: z.object({
        incomeTax: z.number().optional(),
        pensionFund: z.number().optional(),
        healthInsurance: z.number().optional(),
        loanRepayment: z.number().optional(),
    }).optional(),
});

type SalaryRecordFormValues = z.infer<typeof salaryRecordSchema>;

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const getTotal = (obj: Record<string, number | undefined> | undefined) => {
    if (!obj) return 0;
    return Object.values(obj).reduce((sum, value) => sum + (value || 0), 0);
}

export function MaintainSalaryHistoryDialog({ isOpen, onOpenChange, memberId, memberName }: { isOpen: boolean, onOpenChange: (open: boolean) => void, memberId: string, memberName: string }) {
    const [salaryHistory, setSalaryHistory] = useState(mockSalaryHistory);
    const [isAdding, setIsAdding] = useState(false);

    const form = useForm<SalaryRecordFormValues>({
        resolver: zodResolver(salaryRecordSchema),
        defaultValues: {
            effectiveRange: { from: new Date() },
            basicSalary: 0,
            overtimeRate: 0,
            allowances: { transport: 0, meal: 0 },
            deductions: { incomeTax: 0, pensionFund: 0, healthInsurance: 0, loanRepayment: 0 },
        },
    });

    const onSubmit = (data: SalaryRecordFormValues) => {
        console.log("Saving new salary record:", data);
        // In a real app, you'd call a server action here to save the data.
        const newRecord = { id: `rec${Date.now()}`, ...data };
        setSalaryHistory(prev => [newRecord, ...prev.sort((a,b) => b.effectiveRange.from.getTime() - a.effectiveRange.from.getTime())]);
        form.reset();
        setIsAdding(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Salary History for {memberName}</DialogTitle>
                    <DialogDescription>
                        View, add, or edit salary records. Changes are tracked chronologically.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={() => setIsAdding(!isAdding)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> {isAdding ? 'Cancel' : 'Add New Salary Record'}
                            </Button>
                        </div>
                        
                        {isAdding && (
                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle>New Salary Record</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="effectiveRange"
                                                render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Effective Date Range</FormLabel>
                                                    <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                        variant={"outline"}
                                                        className={cn("w-[300px] justify-start text-left font-normal", !field.value.from && "text-muted-foreground")}
                                                        >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value.from ? (
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
                                                        defaultMonth={field.value.from}
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                 <FormField control={form.control} name="basicSalary" render={({ field }) => (<FormItem><FormLabel>Basic Salary</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="overtimeRate" render={({ field }) => (<FormItem><FormLabel>Overtime Rate (per hour)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                            
                                            <p className="font-semibold">Allowances</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="allowances.transport" render={({ field }) => (<FormItem><FormLabel>Transport</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="allowances.meal" render={({ field }) => (<FormItem><FormLabel>Meal</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem>)} />
                                            </div>

                                            <p className="font-semibold">Deductions</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="deductions.incomeTax" render={({ field }) => (<FormItem><FormLabel>Income Tax</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="deductions.pensionFund" render={({ field }) => (<FormItem><FormLabel>Pension Fund</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="deductions.healthInsurance" render={({ field }) => (<FormItem><FormLabel>Health Insurance</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="deductions.loanRepayment" render={({ field }) => (<FormItem><FormLabel>Loan Repayment</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                                                <Button type="submit">Save Record</Button>
                                            </div>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        )}

                        <Separator />
                        <h4 className="font-semibold text-lg">History</h4>
                         <Accordion type="single" collapsible className="w-full">
                            {salaryHistory.map(record => (
                                <AccordionItem value={record.id} key={record.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4">
                                            <span>
                                                {format(record.effectiveRange.from, 'LLL dd, yyyy')} - {record.effectiveRange.to ? format(record.effectiveRange.to, 'LLL dd, yyyy') : 'Present'}
                                            </span>
                                            <span className="text-primary font-bold">{formatCurrency(record.basicSalary)}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 bg-white rounded-b-md">
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-semibold mb-2">Earnings</p>
                                                <p><strong>Basic Salary:</strong> {formatCurrency(record.basicSalary)}</p>
                                                <p><strong>Overtime Rate:</strong> {formatCurrency(record.overtimeRate)}/hr</p>
                                                <p><strong>Transport:</strong> {formatCurrency(record.allowances?.transport)}</p>
                                                <p><strong>Meal:</strong> {formatCurrency(record.allowances?.meal)}</p>
                                                <p className="font-bold mt-2">Total Allowances: {formatCurrency(getTotal(record.allowances))}</p>
                                            </div>
                                             <div>
                                                <p className="font-semibold mb-2">Deductions</p>
                                                <p><strong>Income Tax:</strong> {formatCurrency(record.deductions?.incomeTax)}</p>
                                                <p><strong>Pension Fund:</strong> {formatCurrency(record.deductions?.pensionFund)}</p>
                                                <p><strong>Health Insurance:</strong> {formatCurrency(record.deductions?.healthInsurance)}</p>
                                                <p className="font-bold mt-2">Total Deductions: {formatCurrency(getTotal(record.deductions))}</p>
                                            </div>
                                        </div>
                                         <div className="flex justify-end mt-4">
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete Record
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
                <DialogFooter className="mt-6">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
