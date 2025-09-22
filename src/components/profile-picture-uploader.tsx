
'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ProfilePictureUploaderProps = {
  memberId: string;
  currentImageUrl?: string | null;
  userName: string;
  onUploadSuccess: (newUrl: string) => void;
};

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function ProfilePictureUploader({
  memberId,
  currentImageUrl,
  userName,
  onUploadSuccess,
}: ProfilePictureUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | undefined>(currentImageUrl ?? undefined);

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
    // Create a local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreview(localPreviewUrl);

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(`/api/staff/${memberId}/profile-picture`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
        }
        
        toast({
            title: 'Upload Successful',
            description: 'Your profile picture has been updated.',
        });
        
        // The API returns the new public URL
        onUploadSuccess(result.url);
        // The parent component will update session storage, then we notify other components.
        window.dispatchEvent(new CustomEvent('profile-picture-updated', { detail: { url: result.url } }));

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: error.message || 'An unknown error occurred.',
        });
        // Revert to the original image on failure
        setImagePreview(currentImageUrl ?? undefined);
    } finally {
        setIsUploading(false);
        // Revoke the local URL to free up memory
        if (localPreviewUrl) {
            URL.revokeObjectURL(localPreviewUrl);
        }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const fallback = userName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="relative group w-32 h-32 mx-auto">
      <Avatar
        className="w-32 h-32 text-4xl cursor-pointer"
        onClick={handleAvatarClick}
      >
        <AvatarImage src={imagePreview ?? currentImageUrl ?? undefined} alt={`${userName}'s avatar`} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div 
        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
        onClick={handleAvatarClick}
      >
        {isUploading ? (
            <Loader2 className="text-white h-8 w-8 animate-spin" />
        ) : (
            <Camera className="text-white h-8 w-8" />
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif, image/webp"
        disabled={isUploading}
      />
    </div>
  );
}
