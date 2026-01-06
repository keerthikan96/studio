
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { getAuditLogsAction, AuditLog } from '@/app/actions/audit';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(() => {
            getAuditLogsAction().then(setLogs);
        });
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>
                    A log of all significant events and changes within the system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Resource Type</TableHead>
                            <TableHead>Actor</TableHead>
                            <TableHead className="text-right">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isPending && logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : logs.length > 0 ? (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{format(new Date(log.created_at), 'PPP p')}</TableCell>
                                    <TableCell className="font-medium">{log.action}</TableCell>
                                    <TableCell>{log.resource_type || 'N/A'}</TableCell>
                                    <TableCell>{log.actor_name || 'System'}</TableCell>
                                    <TableCell className="text-right">
                                        {log.details && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <FileText className="mr-2 h-4 w-4" /> View Details
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Log Details</DialogTitle>
                                                        <DialogDescription>
                                                            Raw JSON details for the event: <strong>{log.action}</strong>
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <pre className="mt-2 w-full overflow-auto rounded-md bg-muted p-4 text-sm">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No audit logs found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
