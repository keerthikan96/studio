'use client';

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Member, Role } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CheckCircle, CircleSlash, Eye, Mail, MoreHorizontal, Pencil, KeyRound, PauseCircle, ShieldQuestion, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type MemberCardProps = {
  member: Member;
  onStatusChange: (member: Member, status: Member['status']) => void;
  onSendInvite: (member: Member) => void;
  onSendPasswordReset: (member: Member) => void;
  onRoleChange: (member: Member, roleId: string, roleName: string) => void;
  roles: Role[];
};

const statusStyles: { [key: string]: string } = {
  active: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  inactive: 'bg-red-100 text-red-800 border-red-200',
  'on-hold': 'bg-orange-100 text-orange-800 border-orange-200',
};


export function MemberCard({ member, onStatusChange, onSendInvite, onSendPasswordReset, onRoleChange, roles }: MemberCardProps) {
  const fallback = member.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  const hasProfilePicture = member.profile_picture_url && member.profile_picture_url.trim() !== '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="flex flex-col h-full overflow-hidden group relative">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <CardContent className="p-6 flex flex-col items-center text-center flex-grow relative z-10">
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
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    {member.status === 'pending' && (
                        <DropdownMenuItem onClick={() => onSendInvite(member)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Invite
                        </DropdownMenuItem>
                    )}
                    {(member.status === 'inactive' || member.status === 'on-hold') && (
                        <DropdownMenuItem onClick={() => onStatusChange(member, 'active')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                        </DropdownMenuItem>
                    )}
                    {member.status === 'active' && (
                        <>
                            <DropdownMenuItem onClick={() => onStatusChange(member, 'on-hold')}>
                                <PauseCircle className="mr-2 h-4 w-4" />
                                Set On-hold
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(member, 'inactive')} className="text-destructive">
                                <CircleSlash className="mr-2 h-4 w-4" />
                                Deactivate
                            </DropdownMenuItem>
                        </>
                    )}
                     <DropdownMenuItem onClick={() => onSendPasswordReset(member)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Send Password Reset
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <DropdownMenuSub>
                        <DropdownMenuSubTrigger disabled={member.status !== 'active'}>
                            <ShieldQuestion className="mr-2 h-4 w-4" />
                            Change Role
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                {roles.map((role) => (
                                    <DropdownMenuItem 
                                        key={role.id} 
                                        onClick={() => onRoleChange(member, role.id, role.name)} 
                                        disabled={member.role === role.name}
                                    >
                                        <CheckCircle className={`mr-2 h-4 w-4 ${member.role === role.name ? 'opacity-100' : 'opacity-0'}`} />
                                        {role.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {hasProfilePicture ? (
            <Avatar className="h-24 w-24 text-4xl mb-4 border-4 border-primary/10 shadow-lg group-hover:shadow-xl transition-all">
              <AvatarImage src={member.profile_picture_url ?? undefined} alt={`${member.name}'s avatar`} />
            </Avatar>
          ) : (
            <div className="h-24 w-24 mb-4 rounded-full bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-lg group-hover:shadow-xl border-4 border-primary/10 transition-all">
              <User className="h-12 w-12 text-white" />
            </div>
          )}
        </motion.div>
        <h3 className="text-lg font-semibold">{member.name}</h3>
        <p className="text-sm text-muted-foreground">{member.job_title || member.domain}</p>
        <p className="text-xs text-muted-foreground capitalize font-medium">{member.role}</p>
        <Badge variant="outline" className={cn("mt-4 font-medium", statusStyles[member.status])}>
            {member.status}
        </Badge>
      </CardContent>
    </Card>
    </motion.div>
  );
}
