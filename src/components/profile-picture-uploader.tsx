
'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type ProfilePictureUploaderProps = {
  memberId: string;
  currentImageVersion: number;
  userName: string;
  onUploadSuccess: () => void;
};

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function ProfilePictureUploader({
  memberId,
  currentImageVersion,
  userName,
  onUploadSuccess,
}: ProfilePictureUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
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

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(`/api/staff/${memberId}/profile-picture`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
        }
        
        toast({
            title: 'Upload Successful',
            description: 'Your profile picture has been updated.',
        });
        
        onUploadSuccess();

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: error.message || 'An unknown error occurred.',
        });
    } finally {
        setIsUploading(false);
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
        <AvatarImage key={currentImageVersion} src={`/api/staff/${memberId}/profile-picture?v=${currentImageVersion}`} alt={`${userName}'s avatar`} />
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
        accept="image/png, image/jpeg, image/gif"
        disabled={isUploading}
      />
    </div>
  );
}
