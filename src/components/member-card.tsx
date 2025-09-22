
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Member } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CheckCircle, CircleSlash, Eye, Mail, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type MemberCardProps = {
  member: Member;
  onStatusChange: (member: Member, status: Member['status']) => void;
  onDelete: (member: Member) => void;
  onSendInvite: (member: Member) => void;
};

const statusStyles: { [key: string]: string } = {
  active: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  inactive: 'bg-red-100 text-red-800 border-red-200',
};


export function MemberCard({ member, onStatusChange, onDelete, onSendInvite }: MemberCardProps) {
  const fallback = member.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <Card className="flex flex-col">
      <CardContent className="p-6 flex flex-col items-center text-center flex-grow relative">
        <div className="absolute top-2 right-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <Link href={`/admin/members/${member.id}`}>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    {member.status === 'pending' && (
                        <DropdownMenuItem onClick={() => onSendInvite(member)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Invite
                        </DropdownMenuItem>
                    )}
                    {member.status === 'inactive' && (
                        <DropdownMenuItem onClick={() => onStatusChange(member, 'active')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                        </DropdownMenuItem>
                    )}
                    {member.status === 'active' && (
                        <DropdownMenuItem onClick={() => onStatusChange(member, 'inactive')}>
                            <CircleSlash className="mr-2 h-4 w-4" />
                            Deactivate
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(member)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <Avatar className="h-24 w-24 text-4xl mb-4">
            <AvatarImage src={member.profile_picture_url ?? undefined} alt={`${member.name}'s avatar`} />
            <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold">{member.name}</h3>
        <p className="text-sm text-muted-foreground">{member.domain}</p>
        <p className="text-xs text-muted-foreground">{member.branch}, {member.country}</p>
        <Badge variant="outline" className={cn("mt-4", statusStyles[member.status])}>
            {member.status}
        </Badge>
      </CardContent>
    </Card>
  );
}
