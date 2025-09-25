
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function IntakeListPage() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>On-boarding List</CardTitle>
                <CardDescription>
                    View and manage all new hire on-boarding processes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    A table of all on-boarding processes will be displayed here.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
