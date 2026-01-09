'use client';

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

interface ExistingAssignmentWarningDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    employeeName: string;
    isLead: boolean;
    isSupervisor: boolean;
    leadDepartments: string[];
    supervisorDepartments: string[];
}

export function ExistingAssignmentWarningDialog({
    open,
    onOpenChange,
    onConfirm,
    employeeName,
    isLead,
    isSupervisor,
    leadDepartments,
    supervisorDepartments,
}: ExistingAssignmentWarningDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Existing Assignment Warning</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p className="font-medium text-foreground">
                                {employeeName} is already assigned as:
                            </p>
                            
                            {isLead && leadDepartments.length > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
                                    <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                                        Lead in the following department(s):
                                    </p>
                                    <ul className="list-disc list-inside text-amber-800 dark:text-amber-200">
                                        {leadDepartments.map((dept, idx) => (
                                            <li key={idx}>{dept}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {isSupervisor && supervisorDepartments.length > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                        Supervisor in the following department(s):
                                    </p>
                                    <ul className="list-disc list-inside text-blue-800 dark:text-blue-200">
                                        {supervisorDepartments.map((dept, idx) => (
                                            <li key={idx}>{dept}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            <p className="text-muted-foreground">
                                Do you want to proceed with this assignment?
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>
                        Proceed Anyway
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
