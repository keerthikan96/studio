
'use client';
import { useRouter } from "next/navigation";
import { addStaffAction } from "@/app/actions/staff";
import AddStaffForm from "@/components/add-staff-form";
import { Member } from "@/lib/mock-data";

export default function AddStaffPage() {
    const router = useRouter();

    const handleAddStaff = async (staff: Omit<Member, 'id' | 'status'>, sendInvite: boolean) => {
        const result = await addStaffAction({ staff, sendInvite });

        if ('error' in result) {
            // The form will show the toast with the error
            return { success: false, error: result.error };
        } else {
            return { success: true };
        }
    };
    
    return (
        <div>
            <AddStaffForm onAddStaff={handleAddStaff} />
        </div>
    );
}

    

  