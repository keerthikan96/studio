'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Briefcase, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeDashboard() {
  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Profile</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        View and edit your personal information.
                    </p>
                    <Button asChild size="sm" className="mt-4">
                        <Link href="/dashboard/profile">Go to Profile <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Employee Directory</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                       Search for and view your colleagues.
                    </p>
                    <Button asChild size="sm" className="mt-4">
                        <Link href="/dashboard/members">View Directory <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Company Calendar</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                       View company events and holidays.
                    </p>
                    <Button asChild size="sm" className="mt-4" variant="outline">
                        <Link href="#">Coming Soon</Link>
                    </Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                       Manage your assigned tasks and projects.
                    </p>
                     <Button asChild size="sm" className="mt-4" variant="outline">
                        <Link href="#">Coming Soon</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Workfeed</CardTitle>
                <CardDescription>Latest updates and announcements from the company.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">The workfeed will be displayed here.</p>
                 <Button asChild size="sm" className="mt-4">
                    <Link href="/dashboard/workfeed">View Workfeed <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
            </CardContent>
        </Card>

    </div>
  );
}
