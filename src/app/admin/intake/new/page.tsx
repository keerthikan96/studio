
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewIntakePage() {
  return (
    <div className="space-y-6">
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create New On-boarding</CardTitle>
                <CardDescription>
                    Start a new on-boarding process by filling out the details below.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="intake-title">On-boarding Title</Label>
                    <Input id="intake-title" placeholder="e.g., Q3 2024 Engineering Hires" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" placeholder="e.g., Engineering" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="job-title">Job Title</Label>
                    <Input id="job-title" placeholder="e.g., Software Engineer" />
                </div>
                <Button className="w-full">Create On-boarding</Button>
            </CardContent>
        </Card>
    </div>
  );
}
