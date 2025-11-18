
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AwardPage() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Awards</CardTitle>
                <CardDescription>
                    Manage and view employee awards and recognitions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    A system for managing employee awards will be available here.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
