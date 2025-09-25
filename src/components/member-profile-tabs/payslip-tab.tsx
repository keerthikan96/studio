
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { History, Briefcase, DollarSign, FileText, MapPin, Building2, UserCheck, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';


const mockPayslipData = {
    '2024-07': {
        paymentInfo: {
            payDate: '2024-07-31',
            payFrequency: 'Monthly',
            basicSalary: 5000.00,
            hoursWorked: 160,
            overtimeHours: 10,
            overtimeRate: 37.50,
            bonuses: 500.00,
            allowances: { transport: 150.00, meal: 100.00 },
            otherEarnings: 50.00,
        },
        deductions: {
            incomeTax: 950.00,
            socialSecurity: 310.00,
            pensionFund: 400.00,
            healthInsurance: 150.00,
            unionDues: 25.00,
            loanRepayment: 200.00,
            otherDeductions: 15.00,
        },
    },
    '2024-06': {
         paymentInfo: {
            payDate: '2024-06-30',
            payFrequency: 'Monthly',
            basicSalary: 5000.00,
            hoursWorked: 160,
            overtimeHours: 5,
            overtimeRate: 37.50,
            bonuses: 250.00,
            allowances: { transport: 150.00, meal: 100.00 },
            otherEarnings: 0,
        },
        deductions: {
            incomeTax: 900.00,
            socialSecurity: 310.00,
            pensionFund: 400.00,
            healthInsurance: 150.00,
            unionDues: 25.00,
            loanRepayment: 200.00,
            otherDeductions: 15.00,
        },
    }
};

const payPeriods = [
    { label: 'July 2024', value: '2024-07' },
    { label: 'June 2024', value: '2024-06' },
    { label: 'May 2024', value: '2024-05' },
];

const mockJobHistory = [
    { position: 'Senior Software Engineer', department: 'Engineering', startDate: '2024-01-01', endDate: null, status: 'Active', manager: 'Jane Smith', reason: 'Promotion' },
    { position: 'Software Engineer', department: 'Engineering', startDate: '2022-01-01', endDate: '2023-12-31', status: 'Ended', manager: 'Jane Smith', reason: 'Initial Hire' },
];


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


export function EmploymentHistoryTab({ memberId, memberName }: { memberId: string, memberName: string}) {
    const [selectedPeriod, setSelectedPeriod] = useState(payPeriods[0].value);
    const [userRole, setUserRole] = useState<'staff' | 'HR' | null>(null);
    const [salaryHistory, setSalaryHistory] = useState(mockSalaryHistory);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            setUserRole(JSON.parse(storedUser).role);
        }
    }, []);

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

    const onSalarySubmit = (data: SalaryRecordFormValues) => {
        console.log("Saving new salary record:", data);
        // In a real app, you'd call a server action here to save the data.
        const newRecord = { id: `rec${Date.now()}`, ...data };
        setSalaryHistory(prev => [newRecord, ...prev.sort((a,b) => b.effectiveRange.from.getTime() - a.effectiveRange.from.getTime())]);
        form.reset();
        setIsAdding(false);
    };


    const payslipData = mockPayslipData[selectedPeriod] || mockPayslipData[payPeriods[0].value];
    const { paymentInfo, deductions } = payslipData;

    const totalEarnings =
        paymentInfo.basicSalary +
        (paymentInfo.overtimeHours * paymentInfo.overtimeRate) +
        paymentInfo.bonuses +
        paymentInfo.allowances.transport +
        paymentInfo.allowances.meal +
        paymentInfo.otherEarnings;

    const totalDeductions =
        deductions.incomeTax +
        deductions.socialSecurity +
        deductions.pensionFund +
        deductions.healthInsurance +
        deductions.unionDues +
        deductions.loanRepayment +
        deductions.otherDeductions;
    
    const netPay = totalEarnings - totalDeductions;
    
    const Section = ({ icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
        <AccordionItem value={title}>
            <AccordionTrigger>
                <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-lg">
                        {React.createElement(icon, { className: "h-5 w-5 text-primary" })}
                    </div>
                    <span className="font-semibold text-lg">{title}</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pl-12 pt-4">
                {children}
            </AccordionContent>
        </AccordionItem>
    );
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Employment History</CardTitle>
                <CardDescription>
                    A comprehensive overview of the member's employment journey.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" defaultValue={["Job / Employment History"]} className="w-full space-y-4">
                    <Section icon={Briefcase} title="Job / Employment History">
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>Position</TableHead>
                                   <TableHead>Department</TableHead>
                                   <TableHead>Duration</TableHead>
                                   <TableHead>Status</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {mockJobHistory.map(job => (
                                   <TableRow key={job.startDate}>
                                       <TableCell>{job.position}</TableCell>
                                       <TableCell>{job.department}</TableCell>
                                       <TableCell>{job.startDate} - {job.endDate || 'Present'}</TableCell>
                                       <TableCell>{job.status}</TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                    </Section>

                    <Section icon={DollarSign} title="Salary History">
                         <div className="space-y-4">
                            <div className="flex justify-end">
                                {userRole === 'HR' && (
                                    <Button onClick={() => setIsAdding(!isAdding)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> {isAdding ? 'Cancel' : 'Add New Salary Record'}
                                    </Button>
                                )}
                            </div>
                            
                            {isAdding && (
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle>New Salary Record</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(onSalarySubmit)} className="space-y-6">
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
                            <h4 className="font-semibold text-base">History</h4>
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
                    </Section>

                    <Section icon={FileText} title="Payslip">
                        <div className="flex items-center justify-end mb-4">
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {payPeriods.map(period => (
                                        <SelectItem key={period.value} value={period.value}>
                                            {period.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-primary">Earnings</h4>
                                <Table>
                                    <TableBody>
                                        <TableRow><TableCell>Basic Salary</TableCell><TableCell className="text-right">{formatCurrency(paymentInfo.basicSalary)}</TableCell></TableRow>
                                        <TableRow><TableCell>Overtime</TableCell><TableCell className="text-right">{formatCurrency(paymentInfo.overtimeHours * paymentInfo.overtimeRate)}</TableCell></TableRow>
                                        <TableRow><TableCell>Bonuses</TableCell><TableCell className="text-right">{formatCurrency(paymentInfo.bonuses)}</TableCell></TableRow>
                                        <TableRow><TableCell>Allowances</TableCell><TableCell className="text-right">{formatCurrency(paymentInfo.allowances.transport + paymentInfo.allowances.meal)}</TableCell></TableRow>
                                        <TableRow className="font-bold bg-muted"><TableCell>Total Earnings</TableCell><TableCell className="text-right">{formatCurrency(totalEarnings)}</TableCell></TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-destructive">Deductions</h4>
                                <Table>
                                    <TableBody>
                                        <TableRow><TableCell>Income Tax</TableCell><TableCell className="text-right">{formatCurrency(deductions.incomeTax)}</TableCell></TableRow>
                                        <TableRow><TableCell>Pension Fund</TableCell><TableCell className="text-right">{formatCurrency(deductions.pensionFund)}</TableCell></TableRow>
                                         <TableRow><TableCell>Health Insurance</TableCell><TableCell className="text-right">{formatCurrency(deductions.healthInsurance)}</TableCell></TableRow>
                                        <TableRow><TableCell>Loan Repayment</TableCell><TableCell className="text-right">{formatCurrency(deductions.loanRepayment)}</TableCell></TableRow>
                                        <TableRow className="font-bold bg-muted"><TableCell>Total Deductions</TableCell><TableCell className="text-right">{formatCurrency(totalDeductions)}</TableCell></TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="md:col-span-2">
                                <Separator />
                                <div className="flex justify-end p-4 bg-muted rounded-b-lg">
                                    <p className="text-lg font-bold">Net Pay: {formatCurrency(netPay)}</p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section icon={UserCheck} title="Employment Category">
                        <p><strong>Category:</strong> Full-time</p>
                        <p><strong>Contract Type:</strong> Open-ended</p>
                    </Section>

                    <Section icon={Building2} title="Office Locations">
                        <p><strong>Work Model:</strong> Hybrid</p>
                        <p><strong>Assigned Office:</strong> Colombo, Sri Lanka</p>
                        <p><strong>Days Onsite:</strong> Monday, Wednesday, Friday</p>
                        <p><strong>Effective Date:</strong> 2023-01-01</p>
                    </Section>
                </Accordion>
            </CardContent>
        </Card>
    );
}

  
