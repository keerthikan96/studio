
'use client';
import { useRouter } from "next/navigation";
import { addStaffAction } from "@/app/actions/staff";
import AddStaffForm from "@/components/add-staff-form";
import { Member } from "@/lib/mock-data";

export default function AddStaffPage() {
    const router = useRouter();

    const handleAddStaff = async (staffData: { staff: Omit<Member, 'id' | 'status' | 'profile_picture_url' | 'cover_photo_url' | 'role' | 'name' | 'hobbies' | 'volunteer_work'>, sendInvite: boolean, resume?: { url: string, type: string, size: number } }) => {
        const result = await addStaffAction(staffData);

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
