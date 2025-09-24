
'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

const mockModules = [
    { name: 'Onboarding', code: 'MOD-ONB' },
    { name: 'Performance', code: 'MOD-PERF' },
    { name: 'Time & Attendance', code: 'MOD-TA' },
    { name: 'Payroll', code: 'MOD-PAY' },
];

const mockUsers = [
    { id: 'user1', name: 'John Doe', email: 'john@example.com', avatar: 'https://i.pravatar.cc/40?u=user1', isEnabled: true },
    { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', avatar: 'https://i.pravatar.cc/40?u=user2', isEnabled: true },
    { id: 'user3', name: 'Peter Jones', email: 'peter@example.com', avatar: 'https://i.pravatar.cc/40?u=user3', isEnabled: false },
    { id: 'user4', name: 'Emily Carter', email: 'emily@example.com', avatar: 'https://i.pravatar.cc/40?u=user4', isEnabled: true },
];

export default function ModuleConfigurationPage() {
    const [selectedModule, setSelectedModule] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Module Configuration</CardTitle>
                    <CardDescription>
                        Enable or disable modules for specific users.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="select-module">Select Module to Configure</Label>
                        <Select onValueChange={setSelectedModule}>
                            <SelectTrigger id="select-module">
                                <SelectValue placeholder="Select a module..." />
                            </SelectTrigger>
                            <SelectContent>
                                {mockModules.map(mod => (
                                    <SelectItem key={mod.code} value={mod.code}>
                                        {mod.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedModule && (
                        <div>
                            <h3 className="text-lg font-medium mb-4">User Access for {mockModules.find(m => m.code === selectedModule)?.name}</h3>
                            <Card>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead className="text-right">Access</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarImage src={user.avatar} alt={user.name} />
                                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{user.name}</p>
                                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Switch
                                                        aria-label={`Toggle access for ${user.name}`}
                                                        defaultChecked={user.isEnabled}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
