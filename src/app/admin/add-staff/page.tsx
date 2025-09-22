
'use client';
import AddStaffForm from "@/components/add-staff-form";
import { Member } from "@/lib/mock-data";
import { useRouter } from "next/navigation";

export default function AddStaffPage() {
    const router = useRouter();

    const handleAddStaff = (newStaff: Omit<Member, 'id' | 'status'>) => {
        const savedMembersString = localStorage.getItem('members');
        const savedMembers: Member[] = savedMembersString ? JSON.parse(savedMembersString) : [];

        const newMember: Member = {
            id: `m_${savedMembers.length + 1}`,
            status: 'pending',
            ...newStaff,
        };
        
        const updatedMembers = [...savedMembers, newMember];
        localStorage.setItem('members', JSON.stringify(updatedMembers));
        
        // No redirect here, dialog is handled in the form
    };
    
    return (
        <div>
            <AddStaffForm onAddStaff={handleAddStaff} />
        </div>
    );
}
