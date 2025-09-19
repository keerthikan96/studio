import { MemberList } from "@/components/member-list";
import { mockMembers } from "@/lib/mock-data";

export default function MembersPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Member List</h1>
        <p className="text-muted-foreground">
          View and manage all staff members in the system.
        </p>
      </div>
      <MemberList data={mockMembers} />
    </div>
  );
}
