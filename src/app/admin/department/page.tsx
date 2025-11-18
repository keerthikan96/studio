
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DepartmentPage() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Departments</CardTitle>
                <CardDescription>
                    Manage company departments and teams.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    A list of departments and their members will be displayed here.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
