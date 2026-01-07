'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { useState } from 'react';

type DocumentViewerModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: {
        id: string;
        title: string;
        file_url: string;
        file_type?: string;
    };
};

export function DocumentViewerModal({ open, onOpenChange, document }: DocumentViewerModalProps) {
    const [isLoading, setIsLoading] = useState(true);

    const handleDownload = () => {
        window.open(document.file_url, '_blank');
    };

    const isImage = document.file_type?.startsWith('image/');
    const isPDF = document.file_type === 'application/pdf';
    const canPreview = isImage || isPDF;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span className="truncate">{document.title}</span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleDownload}
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(document.file_url, '_blank')}
                            >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Open
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    {canPreview ? (
                        <div className="h-full w-full relative">
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                                    <div className="text-sm text-muted-foreground">Loading preview...</div>
                                </div>
                            )}
                            
                            {isImage && (
                                <img
                                    src={document.file_url}
                                    alt={document.title}
                                    className="w-full h-full object-contain"
                                    onLoad={() => setIsLoading(false)}
                                    onError={() => setIsLoading(false)}
                                />
                            )}
                            
                            {isPDF && (
                                <iframe
                                    src={`${document.file_url}#toolbar=1`}
                                    className="w-full h-full border-0"
                                    onLoad={() => setIsLoading(false)}
                                    title={document.title}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 text-center p-8">
                            <div className="text-muted-foreground">
                                Preview not available for this file type
                            </div>
                            <div className="space-y-2">
                                <Button onClick={handleDownload}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download File
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    {document.file_type || 'Unknown file type'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
