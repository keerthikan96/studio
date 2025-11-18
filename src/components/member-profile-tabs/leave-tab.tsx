
'use client';

import { useState } from 'react';
import { LeaveRequestDialog } from '../leave-request-dialog';
import { MemberLeaveInfo } from '../leave/member-leave-info';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';

type LeaveTabProps = {
    memberId: string;
}

export function LeaveTab({ memberId }: LeaveTabProps) {
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    const handleNewRequest = () => {
        setRefetchTrigger(prev => prev + 1);
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                 <Card>
                    <CardHeader className='flex-row items-center justify-between'>
                        <div>
                            <CardTitle>Leave Information</CardTitle>
                            <CardDescription>View entitlements and history.</CardDescription>
                        </div>
                        <LeaveRequestDialog userId={memberId} onNewRequest={handleNewRequest} />
                    </CardHeader>
                    <CardContent>
                        <MemberLeaveInfo memberId={memberId} refetchTrigger={refetchTrigger} />
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
