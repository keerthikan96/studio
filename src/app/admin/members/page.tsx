
'use client';

import Link from "next/link";
import { MemberList } from "@/components/member-list";
import { Button } from "@/components/ui/button";
import { mockMembers, Member } from "@/lib/mock-data";
import { PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

function generateSecureToken() {
    // In a real app, use a crypto library for this.
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberToInvite, setMemberToInvite] = useState<Member | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // On mount, check if there's saved data in localStorage
    const savedMembers = localStorage.getItem('members');
    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    } else {
      // Otherwise, initialize with mock data
      setMembers(mockMembers);
    }
  }, []);

  // Persist members to localStorage whenever they change
  useEffect(() => {
    if (members.length > 0) {
      localStorage.setItem('members', JSON.stringify(members));
    }
  }, [members]);

  const onInviteConfirm = () => {
    if (!memberToInvite) return;

    const token = generateSecureToken();
    const invitationLink = `${window.location.origin}/set-password?token=${token}&email=${encodeURIComponent(memberToInvite.email)}`;
      
    console.log('--- Invitation Email ---');
    console.log(`To: ${memberToInvite.email}`);
    console.log('Subject: You have been invited to join StaffSync!');
    console.log(`Hi ${memberToInvite.name},`);
    console.log(`Please click the link below to set up your account. This link will expire in 7 days.`);
    console.log(invitationLink);
    console.log('------------------------');
      
    toast({
      title: 'Invitation Sent!',
      description: `An invitation has been sent to ${memberToInvite.name} at ${memberToInvite.email}.`,
    });

    setMemberToInvite(null); // Close the dialog
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Member List</h1>
            <p className="text-muted-foreground">
              View and manage all staff members in the system.
            </p>
          </div>
          <Link href="/admin/add-staff">
              <Button>
                  <PlusCircle className="mr-2"/>
                  Add Member
              </Button>
          </Link>
        </div>
        <MemberList data={members} setMembers={setMembers} onSendInvite={setMemberToInvite} />
      </div>

      <AlertDialog open={!!memberToInvite} onOpenChange={() => setMemberToInvite(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to send an invitation email to {memberToInvite?.name} at {memberToInvite?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onInviteConfirm}>Yes, Send Invite</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
