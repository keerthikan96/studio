'use client';

import { useEffect, useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, Download, RotateCcw, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DocumentVersion = {
    id: string;
    document_id: string;
    version_number: number;
    file_url: string;
    uploaded_by: string;
    uploader_name: string;
    created_at: string;
};

type VersionHistoryDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId: string;
    documentTitle: string;
    currentVersion: number;
    onVersionUpdate?: () => void;
};

export function DocumentVersionHistory({
    open,
    onOpenChange,
    documentId,
    documentTitle,
    currentVersion,
    onVersionUpdate
}: VersionHistoryDialogProps) {
    const [versions, setVersions] = useState<DocumentVersion[]>([]);
    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            loadVersions();
        }
    }, [open, documentId]);

    const loadVersions = () => {
        startTransition(async () => {
            try {
                const response = await fetch(`/api/documents/${documentId}/versions`);
                if (response.ok) {
                    const data = await response.json();
                    setVersions(data);
                }
            } catch (error) {
                console.error('Error loading versions:', error);
            }
        });
    };

    const handleUploadNewVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_FILE_SIZE = 15 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            toast({
                title: 'Error',
                description: 'File size exceeds 15MB limit',
                variant: 'destructive'
            });
            return;
        }

        setIsUploading(true);
        try {
            const storedUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('uploadedBy', storedUser.id);

            const response = await fetch(`/api/documents/${documentId}/versions`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'New version uploaded successfully'
                });
                loadVersions();
                onVersionUpdate?.();
            } else {
                const error = await response.json();
                toast({
                    title: 'Error',
                    description: error.error || 'Failed to upload version',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Error uploading version:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRestoreVersion = async (versionId: string, versionNumber: number) => {
        if (!confirm(`Are you sure you want to restore version ${versionNumber}? This will create a new version.`)) {
            return;
        }

        startTransition(async () => {
            try {
                const storedUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
                const response = await fetch(`/api/documents/${documentId}/versions`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        versionId,
                        actorId: storedUser.id
                    })
                });

                if (response.ok) {
                    toast({
                        title: 'Success',
                        description: `Version ${versionNumber} restored successfully`
                    });
                    loadVersions();
                    onVersionUpdate?.();
                } else {
                    const error = await response.json();
                    toast({
                        title: 'Error',
                        description: error.error || 'Failed to restore version',
                        variant: 'destructive'
                    });
                }
            } catch (error) {
                console.error('Error restoring version:', error);
                toast({
                    title: 'Error',
                    description: 'An unexpected error occurred',
                    variant: 'destructive'
                });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Version History</DialogTitle>
                    <DialogDescription>
                        {documentTitle} - Current Version: {currentVersion}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    {/* Upload New Version */}
                    <div className="space-y-2">
                        <Label htmlFor="new-version">Upload New Version</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="new-version"
                                type="file"
                                onChange={handleUploadNewVersion}
                                disabled={isUploading}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
                            />
                            {isUploading && (
                                <Badge variant="secondary">Uploading...</Badge>
                            )}
                        </div>
                    </div>

                    {/* Version List */}
                    <ScrollArea className="flex-1">
                        <div className="space-y-3">
                            {versions.length === 0 && !isPending && (
                                <div className="text-center text-muted-foreground py-8">
                                    No previous versions
                                </div>
                            )}

                            {versions.map((version) => (
                                <div
                                    key={version.id}
                                    className="border rounded-lg p-4 space-y-2"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={version.version_number === currentVersion ? 'default' : 'secondary'}>
                                                    Version {version.version_number}
                                                </Badge>
                                                {version.version_number === currentVersion && (
                                                    <Badge variant="outline">Current</Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(version.created_at), 'PPp')}
                                            </div>
                                            <div className="text-sm">
                                                Uploaded by: {version.uploader_name}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open(version.file_url, '_blank')}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            {version.version_number !== currentVersion && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRestoreVersion(version.id, version.version_number)}
                                                    disabled={isPending}
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-1" />
                                                    Restore
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
