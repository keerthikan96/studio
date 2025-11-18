
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Attendance</CardTitle>
                <CardDescription>
                    View and manage employee attendance records.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Attendance tracking and reporting will be available here.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
