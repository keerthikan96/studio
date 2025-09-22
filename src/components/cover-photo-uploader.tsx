
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

type CoverPhotoUploaderProps = {
  memberId: string;
  currentImageUrl?: string | null;
  onUploadSuccess: (newUrl: string) => void;
  isEditable?: boolean;
};

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function CoverPhotoUploader({
  memberId,
  currentImageUrl,
  onUploadSuccess,
  isEditable = false,
}: CoverPhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl ?? null);
  
  useEffect(() => {
    setImagePreview(currentImageUrl ?? null);
  }, [currentImageUrl]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
            variant: 'destructive',
            title: 'File Too Large',
            description: `The selected image must be smaller than ${MAX_FILE_SIZE_MB}MB.`,
        });
        return;
    }

    if (!file.type.startsWith('image/')) {
         toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please select a valid image file (e.g., PNG, JPG).',
        });
        return;
    }

    setIsUploading(true);
    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreview(localPreviewUrl);

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(`/api/staff/${memberId}/cover-photo`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
        }
        
        toast({
            title: 'Upload Successful',
            description: 'Your cover photo has been updated.',
        });
        
        onUploadSuccess(result.url);
        window.dispatchEvent(new CustomEvent('cover-photo-updated', { detail: { url: result.url } }));

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: error.message || 'An unknown error occurred.',
        });
        setImagePreview(currentImageUrl ?? null);
    } finally {
        setIsUploading(false);
        if (localPreviewUrl) {
            URL.revokeObjectURL(localPreviewUrl);
        }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const src = imagePreview || 'https://picsum.photos/seed/header/1200/400';
  
  return (
    <div className="relative w-full h-48 bg-muted rounded-t-lg group overflow-hidden">
        <Image
            src={src}
            alt="Cover image"
            fill
            className="object-cover"
            data-ai-hint="landscape abstract"
        />

      {isEditable && (
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity",
            isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {isUploading ? (
              <Loader2 className="text-white h-8 w-8 animate-spin" />
          ) : (
              <Button variant="outline" size="sm" onClick={handleButtonClick}>
                  <Camera className="mr-2 h-4 w-4" />
                  Change Cover
              </Button>
          )}
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif, image/webp"
        disabled={isUploading || !isEditable}
      />
    </div>
  );
}
