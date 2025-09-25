
'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const mockIntakes = [
    { id: 'intake1', title: 'Q3 2024 Engineering Hires' },
    { id: 'intake2', title: 'Q3 2024 Design Interns' },
    { id: 'intake3', title: 'Q4 2024 Sales Team Expansion' },
];

const onboardingSteps = [
    'Offer Letter', 'Documentation', 'Bank Details', 'Hardware', 
    'Software', 'Introduction', 'Probation', 'Confirmation',
    'Training', 'Team Allocation', 'Project Assigned', 'Done'
];

export default function IntakeConfigurationPage() {
    const [selectedIntake, setSelectedIntake] = useState<string | null>(null);
    const [date, setDate] = useState<Date | undefined>();
    const [progress, setProgress] = useState(33); // Mock progress

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>On-boarding Configuration</CardTitle>
                    <CardDescription>
                        Configure the details and onboarding steps for a specific process.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="select-intake">Select On-boarding to Configure</Label>
                        <Select onValueChange={setSelectedIntake}>
                            <SelectTrigger id="select-intake">
                                <SelectValue placeholder="Select an on-boarding..." />
                            </SelectTrigger>
                            <SelectContent>
                                {mockIntakes.map(intake => (
                                    <SelectItem key={intake.id} value={intake.id}>
                                        {intake.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedIntake && (
                        <div className="space-y-6 border-t pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" defaultValue="Q3 2024 Engineering Hires" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                     <Popover>
                                        <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" placeholder="Enter a brief description for this on-boarding process." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input id="department" defaultValue="Engineering" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="job-title">Job Title</Label>
                                    <Input id="job-title" defaultValue="Software Engineer" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hiring-manager">Hiring Manager</Label>
                                    <Input id="hiring-manager" defaultValue="John Doe" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Onboarding Status</Label>
                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-foreground bg-primary">
                                                In Progress
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold inline-block text-primary">
                                                {progress}%
                                            </span>
                                        </div>
                                    </div>
                                    <Progress value={progress} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                                     {onboardingSteps.map((step, index) => (
                                        <div key={step} className={cn(
                                            "p-2 text-center rounded-md border",
                                            (index + 1) * (100 / onboardingSteps.length) <= progress ? 'bg-green-100 text-green-800 border-green-200' : 'bg-muted'
                                        )}>
                                            {step}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                 <div className="space-y-2">
                                    <Label htmlFor="bg-color">Background Color</Label>
                                    <Input id="bg-color" type="color" defaultValue="#e0f2fe" className="p-1 h-10"/>
                                </div>
                                <div className="flex items-center space-x-2 pt-6">
                                    <Switch id="active-toggle" defaultChecked />
                                    <Label htmlFor="active-toggle">Active</Label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline">Cancel</Button>
                                <Button>Save/Update On-boarding</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
