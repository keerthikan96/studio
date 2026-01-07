'use client';

import { useState, useTransition, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Member = {
    id: string;
    name: string;
    email: string;
    role: string;
};

type DocumentShareDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId: string;
    documentTitle: string;
    onShareSuccess?: () => void;
};

export function DocumentShareDialog({
    open,
    onOpenChange,
    documentId,
    documentTitle,
    onShareSuccess
}: DocumentShareDialogProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [expiryDate, setExpiryDate] = useState<Date | undefined>();
    const [accessMode] = useState<'read_only'>('read_only');

    useEffect(() => {
        if (open) {
            // Fetch members
            startTransition(async () => {
                try {
                    const response = await fetch('/api/staff');
                    if (response.ok) {
                        const data = await response.json();
                        setMembers(data);
                    }
                } catch (error) {
                    console.error('Error fetching members:', error);
                }
            });
        }
    }, [open]);

    const handleAddUser = (userId: string) => {
        if (!selectedUserIds.includes(userId)) {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
    };

    const handleRemoveUser = (userId: string) => {
        setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    };

    const handleAddRole = (role: string) => {
        if (!selectedRoles.includes(role)) {
            setSelectedRoles([...selectedRoles, role]);
        }
    };

    const handleRemoveRole = (role: string) => {
        setSelectedRoles(selectedRoles.filter(r => r !== role));
    };

    const handleShare = () => {
        if (selectedUserIds.length === 0 && selectedRoles.length === 0) {
            toast({
                title: 'Error',
                description: 'Please select at least one user or role to share with',
                variant: 'destructive'
            });
            return;
        }

        startTransition(async () => {
            try {
                const storedUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
                
                const response = await fetch(`/api/documents/${documentId}/share`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
                        roleIds: selectedRoles.length > 0 ? selectedRoles : undefined,
                        accessMode,
                        expiryDate: expiryDate?.toISOString(),
                        actorId: storedUser.id
                    })
                });

                if (response.ok) {
                    toast({
                        title: 'Success',
                        description: 'Document shared successfully'
                    });
                    onOpenChange(false);
                    setSelectedUserIds([]);
                    setSelectedRoles([]);
                    setExpiryDate(undefined);
                    onShareSuccess?.();
                } else {
                    const error = await response.json();
                    toast({
                        title: 'Error',
                        description: error.error || 'Failed to share document',
                        variant: 'destructive'
                    });
                }
            } catch (error) {
                console.error('Error sharing document:', error);
                toast({
                    title: 'Error',
                    description: 'An unexpected error occurred',
                    variant: 'destructive'
                });
            }
        });
    };

    const availableRoles = ['HR', 'Manager', 'Employee', 'Developer'];
    const selectedUsers = members.filter(m => selectedUserIds.includes(m.id));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Share Document</DialogTitle>
                    <DialogDescription>
                        Share "{documentTitle}" with users or roles
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Share with Users */}
                    <div className="space-y-2">
                        <Label>Share with Users</Label>
                        <Select onValueChange={handleAddUser} value="">
                            <SelectTrigger>
                                <SelectValue placeholder="Select users to share with" />
                            </SelectTrigger>
                            <SelectContent>
                                {members
                                    .filter(m => !selectedUserIds.includes(m.id))
                                    .map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.name} ({member.email})
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedUsers.map((user) => (
                                    <Badge key={user.id} variant="secondary" className="gap-1">
                                        {user.name}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => handleRemoveUser(user.id)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Share with Roles */}
                    <div className="space-y-2">
                        <Label>Share with Roles</Label>
                        <Select onValueChange={handleAddRole} value="">
                            <SelectTrigger>
                                <SelectValue placeholder="Select roles to share with" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles
                                    .filter(role => !selectedRoles.includes(role))
                                    .map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {role}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        
                        {selectedRoles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedRoles.map((role) => (
                                    <Badge key={role} variant="secondary" className="gap-1">
                                        {role}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => handleRemoveRole(role)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Access Mode */}
                    <div className="space-y-2">
                        <Label>Access Mode</Label>
                        <Select value={accessMode} disabled>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="read_only">Read Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-2">
                        <Label>Expiry Date (Optional)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !expiryDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expiryDate ? format(expiryDate, "PPP") : "No expiry"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={expiryDate}
                                    onSelect={setExpiryDate}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {expiryDate && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpiryDate(undefined)}
                            >
                                Clear expiry date
                            </Button>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleShare} disabled={isPending}>
                        {isPending ? 'Sharing...' : 'Share Document'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
