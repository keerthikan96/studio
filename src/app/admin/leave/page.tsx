
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeavePage() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Leave Management</CardTitle>
                <CardDescription>
                    View and manage employee leave requests.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    A comprehensive leave management system will be available here.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
