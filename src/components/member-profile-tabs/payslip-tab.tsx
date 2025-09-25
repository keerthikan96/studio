'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export function PayslipTab() {
    const [selectedPeriod, setSelectedPeriod] = useState(payPeriods[0].value);
    const [userRole, setUserRole] = useState<'staff' | 'HR' | null>(null);
    const { toast } = useToast();

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
    
    const handleMaintainHistory = () => {
        toast({
            title: "Feature Coming Soon",
            description: "The interface for maintaining salary history is under development.",
        });
    }

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                    <CardTitle>Payslip Details</CardTitle>
                    <CardDescription>
                        Showing payslip for the selected period.
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
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
                     {userRole === 'HR' && (
                        <Button variant="outline" onClick={handleMaintainHistory} className="w-full sm:w-auto">
                            <History className="mr-2 h-4 w-4" /> Maintain Salary History
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                {/* Earnings Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary">Payment Information</h3>
                    <Card>
                        <Table>
                            <TableBody>
                                <TableRow><TableCell>Pay Date</TableCell><TableCell className="text-right">{paymentInfo.payDate}</TableCell></TableRow>
                                <TableRow><TableCell>Pay Frequency</TableCell><TableCell className="text-right">{paymentInfo.payFrequency}</TableCell></TableRow>
                                <TableRow><TableCell>Basic Salary</TableCell><TableCell className="text-right">{formatCurrency(paymentInfo.basicSalary)}</TableCell></TableRow>
                                <TableRow><TableCell>Hours Worked</TableCell><TableCell className="text-right">{paymentInfo.hoursWorked}</TableCell></TableRow>
                                <TableRow><TableCell>Overtime ({paymentInfo.overtimeHours} hrs @ {formatCurrency(paymentInfo.overtimeRate)})</TableCell><TableCell className="text-right">{formatCurrency(paymentInfo.overtimeHours * paymentInfo.overtimeRate)}</TableCell></TableRow>
                                <TableRow><TableCell>Bonuses / Commissions</TableCell><TableCell className="text-right">{formatCurrency(paymentInfo.bonuses)}</TableCell></TableRow>
                                <TableRow><TableCell>Transport Allowance</TableCell><TableCell className="text-right">{formatCurrency(paymentInfo.allowances.transport)}</TableCell></TableRow>
                                <TableRow><TableCell>Meal Allowance</TableCell><TableCell className="text-right">{formatCurrency(paymentInfo.allowances.meal)}</TableCell></TableRow>
                                <TableRow><TableCell>Other Earnings</TableCell><TableCell className="text-right">{formatCurrency(paymentInfo.otherEarnings)}</TableCell></TableRow>
                                <TableRow className="bg-muted font-semibold"><TableCell>Total Earnings</TableCell><TableCell className="text-right">{formatCurrency(totalEarnings)}</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* Deductions Section */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-destructive">Deductions</h3>
                    <Card>
                        <Table>
                            <TableBody>
                                <TableRow><TableCell>Income Tax (PAYE)</TableCell><TableCell className="text-right">{formatCurrency(deductions.incomeTax)}</TableCell></TableRow>
                                <TableRow><TableCell>Social Security</TableCell><TableCell className="text-right">{formatCurrency(deductions.socialSecurity)}</TableCell></TableRow>
                                <TableRow><TableCell>Pension / Retirement Fund</TableCell><TableCell className="text-right">{formatCurrency(deductions.pensionFund)}</TableCell></TableRow>
                                <TableRow><TableCell>Health Insurance</TableCell><TableCell className="text-right">{formatCurrency(deductions.healthInsurance)}</TableCell></TableRow>
                                <TableRow><TableCell>Union Dues</TableCell><TableCell className="text-right">{formatCurrency(deductions.unionDues)}</TableCell></TableRow>
                                <TableRow><TableCell>Loan Repayments</TableCell><TableCell className="text-right">{formatCurrency(deductions.loanRepayment)}</TableCell></TableRow>
                                <TableRow><TableCell>Other Deductions</TableCell><TableCell className="text-right">{formatCurrency(deductions.otherDeductions)}</TableCell></TableRow>
                                 <TableRow className="bg-muted font-semibold"><TableCell>Total Deductions</TableCell><TableCell className="text-right">{formatCurrency(totalDeductions)}</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* Summary Section */}
                <div className="md:col-span-2 space-y-4">
                    <Separator />
                    <div className="flex justify-end">
                        <Table className="w-full max-w-sm">
                            <TableBody>
                                <TableRow><TableCell className="font-semibold">Total Earnings</TableCell><TableCell className="text-right font-semibold">{formatCurrency(totalEarnings)}</TableCell></TableRow>
                                <TableRow><TableCell className="font-semibold">Total Deductions</TableCell><TableCell className="text-right font-semibold">{formatCurrency(totalDeductions)}</TableCell></TableRow>
                                <TableRow className="text-lg bg-primary/10 text-primary-foreground"><TableCell className="font-bold text-primary">Net Pay</TableCell><TableCell className="text-right font-bold text-primary">{formatCurrency(netPay)}</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
