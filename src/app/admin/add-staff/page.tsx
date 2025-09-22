
'use client';
import { useRouter } from "next/navigation";
import { addStaffAction } from "@/app/actions/staff";
import AddStaffForm from "@/components/add-staff-form";
import { Member } from "@/lib/mock-data";

export default function AddStaffPage() {
    const router = useRouter();

    const handleAddStaff = async (newStaff: Omit<Member, 'id' | 'status'>) => {
        const result = await addStaffAction(newStaff);

        if ('error' in result) {
            // The form will show the toast with the error
            return false;
        } else {
            // On success, the form shows a confirmation and asks about sending an invite.
            // We can optionally redirect from here if needed.
            // router.push('/admin/members');
            return true;
        }
    };
    
    return (
        <div>
            <AddStaffForm onAddStaff={handleAddStaff} />
        </div>
    );
}
