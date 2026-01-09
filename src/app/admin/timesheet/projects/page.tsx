'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Project, ProjectMilestone, Member } from '@/lib/mock-data';
import {
    getAllProjectsAction,
    createProjectAction,
    updateProjectAction,
    getMilestonesAction,
    createMilestoneAction,
    deleteMilestoneAction,
    getProjectMembersAction,
    assignProjectToMemberAction,
    removeProjectFromMemberAction,
} from '@/app/actions/timesheet';
import { getMembersAction } from '@/app/actions/staff';
import { 
    PlusCircle, 
    FolderOpen, 
    Users, 
    Milestone,
    Trash2,
    Archive,
    ChevronDown,
    ChevronRight
} from 'lucide-react';

export default function ProjectsManagementPage() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [members, setMembers] = useState<Member[]>([]);
    
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
    }, [currentUser]);
    
    const fetchData = () => {
        if (!currentUser) return;
        
        startTransition(async () => {
            const projectsResult = await getAllProjectsAction(currentUser.id);
            if (Array.isArray(projectsResult)) {
                setProjects(projectsResult);
            } else {
                toast({
                    title: 'Error',
                    description: projectsResult.error,
                    variant: 'destructive',
                });
            }
            
            const membersResult = await getMembersAction(currentUser.id);
            if (Array.isArray(membersResult)) {
                setMembers(membersResult.filter((m: Member) => m.status === 'active'));
            }
        });
    };
    
    const toggleProjectExpanded = (projectId: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedProjects(newExpanded);
    };
    
    if (!currentUser) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }
    
    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Project Management</h1>
                    <p className="text-muted-foreground">Configure projects and milestones for time tracking</p>
                </div>
                <CreateProjectDialog userId={currentUser.id} onSuccess={fetchData} />
            </div>
            
            {projects.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Create your first project to start tracking time.
                        </p>
                        <CreateProjectDialog userId={currentUser.id} onSuccess={fetchData} />
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            userId={currentUser.id}
                            members={members}
                            isExpanded={expandedProjects.has(project.id)}
                            onToggleExpand={() => toggleProjectExpanded(project.id)}
                            onSuccess={fetchData}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CreateProjectDialog({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name) {
            toast({ title: 'Error', description: 'Project name is required.', variant: 'destructive' });
            return;
        }
        
        startTransition(async () => {
            const result = await createProjectAction(userId, { name, code, description });
            
            if ('error' in result) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Success', description: 'Project created successfully.' });
                setOpen(false);
                setName('');
                setCode('');
                setDescription('');
                onSuccess();
            }
        });
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Project
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter project name"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="code">Project Code</Label>
                        <Input
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g., PROJ-001"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Project description"
                            rows={3}
                        />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Creating...' : 'Create Project'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ProjectCard({ 
    project, 
    userId, 
    members,
    isExpanded, 
    onToggleExpand, 
    onSuccess 
}: { 
    project: Project; 
    userId: string; 
    members: Member[];
    isExpanded: boolean; 
    onToggleExpand: () => void; 
    onSuccess: () => void;
}) {
    const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    useEffect(() => {
        if (isExpanded) {
            loadProjectDetails();
        }
    }, [isExpanded]);
    
    const loadProjectDetails = () => {
        startTransition(async () => {
            const milestonesResult = await getMilestonesAction(project.id);
            setMilestones(milestonesResult);
            
            const membersResult = await getProjectMembersAction(project.id);
            setProjectMembers(membersResult);
        });
    };
    
    const handleArchive = () => {
        if (!confirm('Archive this project? Time entries will remain but the project will be hidden from new entries.')) return;
        
        startTransition(async () => {
            const result = await updateProjectAction(userId, project.id, { status: 'ARCHIVED' });
            
            if ('error' in result) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Success', description: 'Project archived.' });
                onSuccess();
            }
        });
    };
    
    const handleDeleteMilestone = (milestoneId: string) => {
        if (!confirm('Delete this milestone?')) return;
        
        startTransition(async () => {
            const result = await deleteMilestoneAction(userId, milestoneId);
            
            if ('error' in result) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Success', description: 'Milestone deleted.' });
                loadProjectDetails();
            }
        });
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={onToggleExpand}
                                className="p-0 h-auto"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-5 w-5" />
                                ) : (
                                    <ChevronRight className="h-5 w-5" />
                                )}
                            </Button>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {project.name}
                                    <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                        {project.status}
                                    </Badge>
                                </CardTitle>
                                {project.code && (
                                    <p className="text-sm text-muted-foreground mt-1">{project.code}</p>
                                )}
                            </div>
                        </div>
                        {project.description && (
                            <CardDescription className="mt-2 ml-8">{project.description}</CardDescription>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {project.status === 'ACTIVE' && (
                            <Button variant="outline" size="sm" onClick={handleArchive}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            
            {isExpanded && (
                <CardContent className="space-y-6">
                    {/* Milestones Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Milestone className="h-4 w-4" />
                                Milestones
                            </h3>
                            <CreateMilestoneDialog 
                                projectId={project.id} 
                                userId={userId} 
                                onSuccess={loadProjectDetails} 
                            />
                        </div>
                        
                        {milestones.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No milestones yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {milestones.map((milestone) => (
                                    <div 
                                        key={milestone.id} 
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium">{milestone.name}</p>
                                            {milestone.due_date && (
                                                <p className="text-sm text-muted-foreground">
                                                    Due: {new Date(milestone.due_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={milestone.is_billable ? 'default' : 'secondary'}>
                                                {milestone.is_billable ? 'Billable' : 'Non-billable'}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteMilestone(milestone.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Assigned Members Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Assigned Members ({projectMembers.length})
                            </h3>
                            <AssignMemberDialog
                                projectId={project.id}
                                userId={userId}
                                members={members}
                                assignedMembers={projectMembers}
                                onSuccess={loadProjectDetails}
                            />
                        </div>
                        
                        {projectMembers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No members assigned yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {projectMembers.map((pm: any) => (
                                    <div 
                                        key={pm.id} 
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium">{pm.user_name}</p>
                                            <p className="text-sm text-muted-foreground">{pm.email}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (!confirm('Remove this member from the project?')) return;
                                                startTransition(async () => {
                                                    const result = await removeProjectFromMemberAction(
                                                        userId,
                                                        project.id,
                                                        pm.user_id
                                                    );
                                                    if ('error' in result) {
                                                        toast({ 
                                                            title: 'Error', 
                                                            description: result.error, 
                                                            variant: 'destructive' 
                                                        });
                                                    } else {
                                                        toast({ title: 'Success', description: 'Member removed.' });
                                                        loadProjectDetails();
                                                    }
                                                });
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

function CreateMilestoneDialog({ 
    projectId, 
    userId, 
    onSuccess 
}: { 
    projectId: string; 
    userId: string; 
    onSuccess: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const [name, setName] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isBillable, setIsBillable] = useState(true);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name) {
            toast({ title: 'Error', description: 'Milestone name is required.', variant: 'destructive' });
            return;
        }
        
        startTransition(async () => {
            const result = await createMilestoneAction(userId, {
                project_id: projectId,
                name,
                due_date: dueDate || undefined,
                is_billable: isBillable,
            });
            
            if ('error' in result) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Success', description: 'Milestone created successfully.' });
                setOpen(false);
                setName('');
                setDueDate('');
                setIsBillable(true);
                onSuccess();
            }
        });
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Milestone
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Milestone</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Milestone Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter milestone name"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
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
                            {isPending ? 'Creating...' : 'Create'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AssignMemberDialog({
    projectId,
    userId,
    members,
    assignedMembers,
    onSuccess,
}: {
    projectId: string;
    userId: string;
    members: Member[];
    assignedMembers: any[];
    onSuccess: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const [selectedMemberId, setSelectedMemberId] = useState('');
    
    const assignedIds = new Set(assignedMembers.map((m) => m.user_id));
    const availableMembers = members.filter((m) => !assignedIds.has(m.id));
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedMemberId) {
            toast({ title: 'Error', description: 'Please select a member.', variant: 'destructive' });
            return;
        }
        
        startTransition(async () => {
            const result = await assignProjectToMemberAction(userId, projectId, selectedMemberId);
            
            if ('error' in result) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Success', description: 'Member assigned successfully.' });
                setOpen(false);
                setSelectedMemberId('');
                onSuccess();
            }
        });
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Assign Member
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Member to Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="member">Select Member</Label>
                        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a member" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.name} ({member.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || availableMembers.length === 0}>
                            {isPending ? 'Assigning...' : 'Assign'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
