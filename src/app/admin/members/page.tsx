
import Link from "next/link";
import { MemberList } from "@/components/member-list";
import { Button } from "@/components/ui/button";
import { mockMembers } from "@/lib/mock-data";
import { PlusCircle } from "lucide-react";

export default function MembersPage() {
  return (
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
      <MemberList data={mockMembers} />
    </div>
  );
}
