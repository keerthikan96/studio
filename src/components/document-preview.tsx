'use client';

import { useState, useEffect } from 'react';
import { FileIcon, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DocumentPreviewProps = {
    file: File | null;
    onClear?: () => void;
};

export function DocumentPreview({ file, onClear }: DocumentPreviewProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'none'>('none');

    useEffect(() => {
        if (!file) {
            setPreview(null);
            setPreviewType('none');
            return;
        }

        // Determine preview type
        if (file.type.startsWith('image/')) {
            setPreviewType('image');
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            setPreviewType('pdf');
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewType('none');
            setPreview(null);
        }

        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [file]);

    if (!file) {
        return null;
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    {previewType === 'none' && (
                        <div className="p-2 rounded bg-muted">
                            <FileIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                        </p>
                    </div>
                </div>
                {onClear && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClear}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Preview Area */}
            {previewType === 'image' && preview && (
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-contain"
                    />
                </div>
            )}

            {previewType === 'pdf' && preview && (
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                    <iframe
                        src={`${preview}#toolbar=0&navpanes=0&scrollbar=0&page=1`}
                        className="w-full h-48"
                        title="PDF Preview"
                    />
                    <div className="p-2 bg-muted text-xs text-muted-foreground text-center">
                        PDF Preview (First page only)
                    </div>
                </div>
            )}
        </div>
    );
}
