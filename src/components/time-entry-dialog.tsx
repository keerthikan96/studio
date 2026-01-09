'use client';

import { useState, useEffect, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Project, ProjectMilestone, PayType, TimeEntry } from '@/lib/mock-data';
import { createTimeEntryAction, updateTimeEntryAction, getMilestonesAction } from '@/app/actions/timesheet';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeEntryDialogProps {
    userId: string;
    projects: Project[];
    weekStartDate: string;
    weekEndDate: string;
    entry?: TimeEntry; // For editing
    onSuccess: () => void;
}

const PAY_TYPES: { value: PayType; label: string }[] = [
    { value: 'REGULAR', label: 'Regular' },
    { value: 'OVERTIME', label: 'Overtime' },
    { value: 'DOUBLE_TIME', label: 'Double Time' },
    { value: 'PTO', label: 'PTO' },
    { value: 'HOLIDAY', label: 'Holiday' },
    { value: 'UNPAID', label: 'Unpaid' },
];

export function TimeEntryDialog({ userId, projects, weekStartDate, weekEndDate, entry, onSuccess }: TimeEntryDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const [date, setDate] = useState<Date | undefined>(entry ? new Date(entry.date) : undefined);
    const [projectId, setProjectId] = useState(entry?.project_id || '');
    const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
    const [milestoneId, setMilestoneId] = useState(entry?.milestone_id || '');
    const [hours, setHours] = useState(entry?.hours?.toString() || '');
    const [payType, setPayType] = useState<PayType>(entry?.pay_type || 'REGULAR');
    const [description, setDescription] = useState(entry?.description || '');
    const [isBillable, setIsBillable] = useState(entry?.is_billable ?? true);
    
    useEffect(() => {
        if (projectId) {
            startTransition(async () => {
                const fetchedMilestones = await getMilestonesAction(projectId);
                setMilestones(fetchedMilestones);
                // Reset milestone if project changed
                if (!entry || entry.project_id !== projectId) {
                    setMilestoneId('');
                }
            });
        } else {
            setMilestones([]);
            setMilestoneId('');
        }
    }, [projectId, entry]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!date || !projectId || !hours) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all required fields.',
                variant: 'destructive',
            });
            return;
        }
        
        const hoursNum = parseFloat(hours);
        if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
            toast({
                title: 'Invalid Hours',
                description: 'Hours must be between 0.01 and 24.',
                variant: 'destructive',
            });
            return;
        }
        
        // Check if date is within week range
        const entryDate = format(date, 'yyyy-MM-dd');
        if (entryDate < weekStartDate || entryDate > weekEndDate) {
            toast({
                title: 'Invalid Date',
                description: 'Date must be within the current week.',
                variant: 'destructive',
            });
            return;
        }
        
        startTransition(async () => {
            const data = {
                date: entryDate,
                project_id: projectId,
                milestone_id: milestoneId || undefined,
                hours: hoursNum,
                pay_type: payType,
                description,
                is_billable: isBillable,
            };
            
            const result = entry 
                ? await updateTimeEntryAction(userId, entry.id, data)
                : await createTimeEntryAction(userId, data);
            
            if ('error' in result) {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: entry ? 'Time entry updated successfully.' : 'Time entry added successfully.',
                });
                setOpen(false);
                resetForm();
                onSuccess();
            }
        });
    };
    
    const resetForm = () => {
        if (!entry) {
            setDate(undefined);
            setProjectId('');
            setMilestoneId('');
            setHours('');
            setPayType('REGULAR');
            setDescription('');
            setIsBillable(true);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {entry ? (
                    <Button variant="ghost" size="sm">Edit</Button>
                ) : (
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Entry
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{entry ? 'Edit Time Entry' : 'Add Time Entry'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !date && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    disabled={(date) => {
                                        const dateStr = format(date, 'yyyy-MM-dd');
                                        return dateStr < weekStartDate || dateStr > weekEndDate;
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="project">Project *</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {projectId && milestones.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="milestone">Milestone</Label>
                            <Select value={milestoneId} onValueChange={setMilestoneId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select milestone (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {milestones.map((milestone) => (
                                        <SelectItem key={milestone.id} value={milestone.id}>
                                            {milestone.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="hours">Hours *</Label>
                            <Input
                                id="hours"
                                type="number"
                                step="0.25"
                                min="0.01"
                                max="24"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                placeholder="8.00"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="payType">Pay Type *</Label>
                            <Select value={payType} onValueChange={(value) => setPayType(value as PayType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAY_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What did you work on?"
                            rows={3}
                        />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isBillable"
                            checked={isBillable}
                            onChange={(e) => setIsBillable(e.target.checked)}
                            className="h-4 w-4"
                        />
                        <Label htmlFor="isBillable" className="cursor-pointer">
                            Billable
                        </Label>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Saving...' : entry ? 'Update' : 'Add Entry'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
