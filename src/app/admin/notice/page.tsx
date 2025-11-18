
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NoticePage() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Notice Board</CardTitle>
                <CardDescription>
                    Create and manage company-wide notices.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    The notice management system will be available here.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
