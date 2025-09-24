
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// This is a placeholder component.
// In a real app, you would have a more complex UI for widget configuration.
const DashboardWidgetCard = ({ title }: { title: string }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Widget configuration options would appear here.</p>
        </CardContent>
    </Card>
);

export default function DashboardManagementPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard Management</CardTitle>
                    <CardDescription>
                        Configure dashboard widgets for individual employees. Select a user to view and manage their dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="select-user">Select User</Label>
                            <Select>
                                <SelectTrigger id="select-user" className="w-[280px]">
                                    <SelectValue placeholder="Select an employee..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user1">John Doe</SelectItem>
                                    <SelectItem value="user2">Jane Smith</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                            <Switch id="dashboard-activation" />
                            <Label htmlFor="dashboard-activation">Activate Dashboard for this User</Label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Dashboard Widgets</h3>
                            <Button>Add New Widget</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           <DashboardWidgetCard title="Daily Attendance" />
                           <DashboardWidgetCard title="My Tasks" />
                           <DashboardWidgetCard title="Team Leave Calendar" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
