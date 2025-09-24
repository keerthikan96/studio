
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const mockModules = [
    { name: 'Onboarding', code: 'MOD-ONB', status: 'Active', activeUsers: 120 },
    { name: 'Performance', code: 'MOD-PERF', status: 'Active', activeUsers: 120 },
    { name: 'Recruitment', code: 'MOD-REC', status: 'Inactive', activeUsers: 0 },
    { name: 'Time & Attendance', code: 'MOD-TA', status: 'Active', activeUsers: 115 },
    { name: 'Payroll', code: 'MOD-PAY', status: 'Active', activeUsers: 120 },
    { name: 'Training', code: 'MOD-TRN', status: 'Inactive', activeUsers: 0 },
];

export default function ModuleListPage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Module List</CardTitle>
                    <CardDescription>
                        View all available modules and their current status.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Module Name</TableHead>
                                <TableHead>Module Code</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Active Users</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockModules.map((mod) => (
                                <TableRow key={mod.code}>
                                    <TableCell className="font-medium">{mod.name}</TableCell>
                                    <TableCell>{mod.code}</TableCell>
                                    <TableCell>
                                        <Badge variant={mod.status === 'Active' ? 'default' : 'secondary'}
                                            className={mod.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                        >
                                            {mod.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{mod.activeUsers}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => router.push('/admin/settings/module-management/configuration')}
                                        >
                                            Configure
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
