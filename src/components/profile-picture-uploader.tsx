
'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ProfilePictureUploaderProps = {
  currentImage?: string | null;
  onImageSelect: (dataUri: string) => void;
  userName: string;
};

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function ProfilePictureUploader({
  currentImage,
  onImageSelect,
  userName,
}: ProfilePictureUploaderProps) {
  const [preview, setPreview] = useState(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setPreview(dataUri);
      onImageSelect(dataUri);
    };
    reader.readAsDataURL(file);
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
        <AvatarImage src={preview || undefined} alt={`${userName}'s avatar`} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div 
        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
        onClick={handleAvatarClick}
      >
        <Camera className="text-white h-8 w-8" />
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif"
      />
    </div>
  );
}
