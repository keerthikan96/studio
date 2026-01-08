
'use client';
import { useRouter } from "next/navigation";
import { addStaffAction, getRolesAction } from "@/app/actions/staff";
import AddStaffForm from "@/components/add-staff-form";
import { Member, Role } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type StaffFormData = { 
    staff: Omit<Member, 'id' | 'status' | 'profile_picture_url' | 'cover_photo_url' | 'name' | 'hobbies' | 'volunteer_work'>; 
    sendInvite: boolean; 
    isDraft: boolean; 
    resumeFile?: { file: File, dataUri: string }; 
    role_id: string; 
};

export default function AddStaffPage() {
    const router = useRouter();
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
        getRolesAction(currentUserId).then(result => {
            const fetchedRoles = Array.isArray(result) ? result : [];
            setRoles(fetchedRoles);
            setIsLoading(false);
        });
    }, []);

    const handleAddStaff = async (staffData: StaffFormData) => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
        
        const result = await addStaffAction({ ...staffData, currentUserId });

        if ('error' in result) {
            // The form will show the toast with the error
            return { success: false, error: result.error };
        } else {
            return { success: true };
        }
    };
    
    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }

    return (
        <div>
            <AddStaffForm onAddStaff={handleAddStaff} roles={roles} />
        </div>
    );
}
