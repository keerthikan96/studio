
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { History, Briefcase, DollarSign, FileText, MapPin, Building2, UserCheck } from 'lucide-react';
import { MaintainSalaryHistoryDialog } from '../maintain-salary-history-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

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

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export function EmploymentHistoryTab({ memberId, memberName }: { memberId: string, memberName: string}) {
    const [selectedPeriod, setSelectedPeriod] = useState(payPeriods[0].value);
    const [userRole, setUserRole] = useState<'staff' | 'HR' | null>(null);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            setUserRole(JSON.parse(storedUser).role);
        }
    }, []);

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
            <AccordionContent className="pl-12">
                {children}
            </AccordionContent>
        </AccordionItem>
    );
    
    return (
        <>
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
                             <div className="flex justify-end mb-4">
                                {userRole === 'HR' && (
                                    <Button variant="outline" onClick={() => setIsHistoryDialogOpen(true)}>
                                        <History className="mr-2 h-4 w-4" /> Maintain Salary History
                                    </Button>
                                )}
                            </div>
                            <p className="text-muted-foreground">Detailed salary history, including base pay, allowances, and deductions over time, can be managed here by authorized personnel.</p>
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
            {userRole === 'HR' && (
                <MaintainSalaryHistoryDialog
                    isOpen={isHistoryDialogOpen}
                    onOpenChange={setIsHistoryDialogOpen}
                    memberId={memberId}
                    memberName={memberName}
                />
            )}
        </>
    );
}

  

    