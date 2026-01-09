'use client';

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    getDepartmentAction, 
    getDepartmentMembersAction, 
    assignMemberToDepartmentAction, 
    removeMemberFromDepartmentAction,
    setPrimaryDepartmentAction 
} from "@/app/actions/departments";
import { Department } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, UserPlus, Trash2, Star, StarOff } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";

type DepartmentMember = {
    id: string;
    name: string;
    email: string;
    job_title?: string;
    profile_picture_url?: string;
    is_primary: boolean;
    assigned_at: string;
};

type AvailableMember = {
    id: string;
    name: string;
    email: string;
    job_title?: string;
    profile_picture_url?: string;
};

export default function DepartmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const departmentId = params.id as string;
    
    const [department, setDepartment] = useState<Department | null>(null);
    const [members, setMembers] = useState<DepartmentMember[]>([]);
    const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
    const [isPending, startTransition] = useTransition();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const fetchDepartment = () => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
        
        getDepartmentAction(departmentId, currentUserId).then((result) => {
            if (result && !('error' in result)) {
                setDepartment(result);
            } else {
                console.error('Failed to fetch department');
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load department"
                });
            }
        });
    };

    const fetchMembers = () => {
        startTransition(() => {
            const storedUser = sessionStorage.getItem('loggedInUser');
            const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
            
            getDepartmentMembersAction(departmentId, currentUserId).then((result) => {
                if (Array.isArray(result)) {
                    setMembers(result);
                } else {
                    console.error('Failed to fetch members:', result.error);
                    setMembers([]);
                }
            });
        });
    };

    const fetchAvailableMembers = async () => {
        try {
            // Fetch all members from the database
            const storedUser = sessionStorage.getItem('loggedInUser');
            const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
            
            const response = await fetch('/api/members');
            if (!response.ok) throw new Error('Failed to fetch members');
            
            const allMembers = await response.json();
            
            // Filter out members already in this department
            const memberIds = members.map(m => m.id);
            const available = allMembers.filter((m: AvailableMember) => !memberIds.includes(m.id));
            setAvailableMembers(available);
        } catch (error) {
            console.error('Error fetching available members:', error);
            // Fallback: show empty list if API fails
            setAvailableMembers([]);
        }
    };

    useEffect(() => {
        fetchDepartment();
        fetchMembers();
    }, [departmentId]);

    useEffect(() => {
        if (isAddDialogOpen) {
            fetchAvailableMembers();
        }
    }, [isAddDialogOpen, members]);

    const handleAddMembers = async () => {
        if (selectedMembers.length === 0) return;
        
        setIsSubmitting(true);
        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';

        try {
            // Add first member as primary if no primary exists
            const hasPrimary = members.some(m => m.is_primary);
            
            for (let i = 0; i < selectedMembers.length; i++) {
                const memberId = selectedMembers[i];
                const isPrimary = !hasPrimary && i === 0;
                
                const result = await assignMemberToDepartmentAction({
                    departmentId,
                    memberId,
                    isPrimary,
                    currentUserId
                });

                if ('error' in result) {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: result.error
                    });
                    return;
                }
            }

            toast({
                title: "Success",
                description: `Added ${selectedMembers.length} member(s) to department`
            });
            setIsAddDialogOpen(false);
            setSelectedMembers([]);
            setSearchQuery('');
            fetchMembers();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveMember = async () => {
        if (!removingMemberId) return;

        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';

        try {
            const result = await removeMemberFromDepartmentAction({
                departmentId,
                memberId: removingMemberId,
                currentUserId
            });

            if ('error' in result) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error
                });
            } else {
                toast({
                    title: "Success",
                    description: "Member removed from department"
                });
                fetchMembers();
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred"
            });
        } finally {
            setIsRemoveDialogOpen(false);
            setRemovingMemberId(null);
        }
    };

    const handleSetPrimary = async (memberId: string) => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';

        try {
            const result = await setPrimaryDepartmentAction({
                departmentId,
                memberId,
                currentUserId
            });

            if ('error' in result) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error
                });
            } else {
                toast({
                    title: "Success",
                    description: "Primary department updated"
                });
                fetchMembers();
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred"
            });
        }
    };

    const filteredAvailableMembers = availableMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleMemberSelection = (memberId: string) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    if (!department) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/department">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">{department.name}</h1>
                    {department.description && (
                        <p className="text-muted-foreground mt-1">{department.description}</p>
                    )}
                    <div className="flex gap-4 mt-2">
                        {department.lead_name && (
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">Lead: {department.lead_name}</Badge>
                            </div>
                        )}
                        {department.supervisor_name && (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">Supervisor: {department.supervisor_name}</Badge>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Department Members</CardTitle>
                        <CardDescription>
                            {members.length} {members.length === 1 ? 'member' : 'members'} in this department
                        </CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" /> Add Members
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh]">
                            <DialogHeader>
                                <DialogTitle>Add Members to Department</DialogTitle>
                                <DialogDescription>
                                    Select members to add to this department
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Input
                                    placeholder="Search members by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="border rounded-md max-h-[400px] overflow-y-auto">
                                    {filteredAvailableMembers.length > 0 ? (
                                        <div className="divide-y">
                                            {filteredAvailableMembers.map((member) => (
                                                <div
                                                    key={member.id}
                                                    className={`p-3 flex items-center gap-3 hover:bg-accent cursor-pointer ${
                                                        selectedMembers.includes(member.id) ? 'bg-accent' : ''
                                                    }`}
                                                    onClick={() => toggleMemberSelection(member.id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMembers.includes(member.id)}
                                                        onChange={() => toggleMemberSelection(member.id)}
                                                        className="h-4 w-4"
                                                    />
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={member.profile_picture_url} />
                                                        <AvatarFallback>
                                                            {member.name.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="font-medium">{member.name}</p>
                                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                                        {member.job_title && (
                                                            <p className="text-xs text-muted-foreground">{member.job_title}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            {searchQuery ? 'No members found matching your search' : 'No available members to add'}
                                        </div>
                                    )}
                                </div>
                                {selectedMembers.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {selectedMembers.length} member(s) selected
                                    </p>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => {
                                    setIsAddDialogOpen(false);
                                    setSelectedMembers([]);
                                    setSearchQuery('');
                                }}>
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleAddMembers} 
                                    disabled={selectedMembers.length === 0 || isSubmitting}
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Job Title</TableHead>
                                <TableHead>Primary</TableHead>
                                <TableHead>Assigned Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isPending && members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : members.length > 0 ? (
                                members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={member.profile_picture_url} />
                                                    <AvatarFallback>
                                                        {member.name.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{member.job_title || '-'}</TableCell>
                                        <TableCell>
                                            {member.is_primary ? (
                                                <Badge variant="default" className="gap-1">
                                                    <Star className="h-3 w-3 fill-current" />
                                                    Primary
                                                </Badge>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSetPrimary(member.id)}
                                                    className="h-7 gap-1"
                                                >
                                                    <StarOff className="h-3 w-3" />
                                                    Set as Primary
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell>{format(new Date(member.assigned_at), 'PPP')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setRemovingMemberId(member.id);
                                                    setIsRemoveDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No members in this department. Click "Add Members" to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the member from this department. They will no longer be associated with this department.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRemovingMemberId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
