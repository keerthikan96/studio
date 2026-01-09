'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { TimeEntry, Project, TimesheetWeek } from '@/lib/mock-data';
import { 
    getProjectsAction, 
    getWeekEntriesAction, 
    deleteTimeEntryAction, 
    submitWeekAction 
} from '@/app/actions/timesheet';
import { TimeEntryDialog } from '@/components/time-entry-dialog';
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar,
    Clock,
    Trash2,
    CheckCircle,
    AlertCircle,
    Send
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';

function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

export default function TimesheetPage() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
    const [projects, setProjects] = useState<Project[]>([]);
    const [week, setWeek] = useState<TimesheetWeek | null>(null);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
        }
    }, []);
    
    useEffect(() => {
        if (!currentUser) return;
        
        fetchData();
    }, [currentUser, currentWeekStart]);
    
    const fetchData = () => {
        if (!currentUser) return;
        
        setLoading(true);
        startTransition(async () => {
            // Fetch projects
            const projectsResult = await getProjectsAction(currentUser.id);
            if (Array.isArray(projectsResult)) {
                setProjects(projectsResult);
            }
            
            // Fetch week and entries
            const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
            const weekResult = await getWeekEntriesAction(currentUser.id, weekStartStr);
            
            if ('error' in weekResult) {
                toast({
                    title: 'Error',
                    description: weekResult.error,
                    variant: 'destructive',
                });
            } else {
                setWeek(weekResult.week);
                setEntries(weekResult.entries);
            }
            
            setLoading(false);
        });
    };
    
    const handlePreviousWeek = () => {
        setCurrentWeekStart(addDays(currentWeekStart, -7));
    };
    
    const handleNextWeek = () => {
        setCurrentWeekStart(addDays(currentWeekStart, 7));
    };
    
    const handleDeleteEntry = (entryId: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        
        startTransition(async () => {
            const result = await deleteTimeEntryAction(currentUser.id, entryId);
            
            if ('error' in result) {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: 'Entry deleted successfully.',
                });
                fetchData();
            }
        });
    };
    
    const handleSubmitWeek = () => {
        if (!week) return;
        
        if (!confirm(`Submit timesheet for the week of ${format(currentWeekStart, 'MMM d, yyyy')}? You won't be able to edit entries after submission.`)) {
            return;
        }
        
        startTransition(async () => {
            const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
            const result = await submitWeekAction(currentUser.id, weekStartStr);
            
            if ('error' in result) {
                toast({
                    title: 'Submission Failed',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: 'Timesheet submitted successfully for approval.',
                });
                fetchData();
            }
        });
    };
    
    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading user information...</p>
            </div>
        );
    }
    
    const weekEndDate = addDays(currentWeekStart, 6);
    const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEndDate, 'yyyy-MM-dd');
    
    const isCurrentWeek = format(getMonday(new Date()), 'yyyy-MM-dd') === weekStartStr;
    const totalHours = parseFloat(week?.total_hours as any) || 0;
    const minimumHours = 40;
    const isUnderMinimum = totalHours < minimumHours;
    const canSubmit = week?.status === 'DRAFT' || week?.status === 'REJECTED';
    const isLocked = week?.status === 'APPROVED' || week?.status === 'LOCKED' || week?.status === 'SUBMITTED';
    
    // Group entries by date
    const entriesByDate: { [key: string]: TimeEntry[] } = {};
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(currentWeekStart, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        entriesByDate[dateStr] = entries.filter(e => e.date === dateStr);
        return { date, dateStr };
    });
    
    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Timesheet</h1>
                    <p className="text-muted-foreground">Track your weekly work hours</p>
                </div>
            </div>
            
            {/* Week Navigation */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={handlePreviousWeek} disabled={isPending}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="text-center">
                            <div className="flex items-center gap-2 justify-center">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <h2 className="text-xl font-semibold">
                                    {format(currentWeekStart, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
                                </h2>
                                {isCurrentWeek && (
                                    <Badge variant="secondary">Current Week</Badge>
                                )}
                            </div>
                            {week && (
                                <div className="mt-2">
                                    <Badge 
                                        variant={
                                            week.status === 'APPROVED' ? 'default' : 
                                            week.status === 'SUBMITTED' ? 'secondary' :
                                            week.status === 'REJECTED' ? 'destructive' :
                                            'outline'
                                        }
                                    >
                                        {week.status}
                                    </Badge>
                                </div>
                            )}
                        </div>
                        
                        <Button variant="outline" onClick={handleNextWeek} disabled={isPending}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
            
            {/* Hours Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Weekly Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-medium">Total Hours:</span>
                            <span className={`text-2xl font-bold ${isUnderMinimum ? 'text-red-500' : 'text-green-600'}`}>
                                {totalHours.toFixed(2)} / {minimumHours}h
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Progress</span>
                                <span>{((totalHours / minimumHours) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-3">
                                <div 
                                    className={`h-3 rounded-full transition-all ${
                                        isUnderMinimum ? 'bg-red-500' : 'bg-green-600'
                                    }`}
                                    style={{ width: `${Math.min((totalHours / minimumHours) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                        
                        {isUnderMinimum && canSubmit && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    You need {(minimumHours - totalHours).toFixed(2)} more hours to meet the minimum requirement.
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        {week?.status === 'REJECTED' && week.notes && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Rejected:</strong> {week.notes}
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="flex gap-2">
                            {!isLocked && (
                                <TimeEntryDialog
                                    userId={currentUser.id}
                                    projects={projects}
                                    weekStartDate={weekStartStr}
                                    weekEndDate={weekEndStr}
                                    onSuccess={fetchData}
                                />
                            )}
                            
                            {canSubmit && (
                                <Button 
                                    onClick={handleSubmitWeek} 
                                    disabled={isPending || isUnderMinimum}
                                    className="ml-auto"
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    Submit for Approval
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Entries List */}
            <Card>
                <CardHeader>
                    <CardTitle>Time Entries</CardTitle>
                    <CardDescription>
                        {entries.length} {entries.length === 1 ? 'entry' : 'entries'} this week
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center text-muted-foreground py-8">Loading...</p>
                    ) : entries.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No entries yet. Click "Add Entry" to get started.
                        </p>
                    ) : (
                        <div className="space-y-6">
                            {weekDays.map(({ date, dateStr }) => {
                                const dayEntries = entriesByDate[dateStr] || [];
                                const dayTotal = dayEntries.reduce((sum, e) => sum + (parseFloat(e.hours as any) || 0), 0);
                                
                                if (dayEntries.length === 0) return null;
                                
                                return (
                                    <div key={dateStr} className="space-y-2">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <h3 className="font-semibold">
                                                {format(date, 'EEEE, MMM d')}
                                            </h3>
                                            <span className="text-sm text-muted-foreground">
                                                {dayTotal.toFixed(2)}h
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {dayEntries.map((entry) => (
                                                <div 
                                                    key={entry.id} 
                                                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium">{entry.project_name || 'Unknown Project'}</span>
                                                            {entry.milestone_name && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {entry.milestone_name}
                                                                </Badge>
                                                            )}
                                                            <Badge variant="secondary" className="text-xs">
                                                                {entry.pay_type.replace('_', ' ')}
                                                            </Badge>
                                                            {entry.is_billable && (
                                                                <Badge variant="default" className="text-xs">
                                                                    Billable
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {entry.description && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {entry.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <span className="font-semibold text-lg">
                                                            {parseFloat(entry.hours as any).toFixed(2)}h
                                                        </span>
                                                        
                                                        {!isLocked && (
                                                            <>
                                                                <TimeEntryDialog
                                                                    userId={currentUser.id}
                                                                    projects={projects}
                                                                    weekStartDate={weekStartStr}
                                                                    weekEndDate={weekEndStr}
                                                                    entry={entry}
                                                                    onSuccess={fetchData}
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteEntry(entry.id)}
                                                                    disabled={isPending}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
