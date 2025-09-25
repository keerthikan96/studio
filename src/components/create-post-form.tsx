
'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

type CreatePostFormProps = {
    onCreatePost: (content: string, imageFile?: File) => void;
};

export default function CreatePostForm({ onCreatePost }: CreatePostFormProps) {
    const [content, setContent] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if (content.trim() || imageFile) {
            onCreatePost(content, imageFile);
            setContent('');
            setImageFile(undefined);
            setImagePreview(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(undefined);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src="https://i.pravatar.cc/40?u=current-user" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="w-full">
                        <Textarea
                            placeholder="What's on your mind?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full border-0 focus-visible:ring-0 ring-offset-0 p-0 text-base min-h-[60px]"
                        />
                        {imagePreview && (
                            <div className="mt-4 relative">
                                <Image src={imagePreview} alt="Image preview" width={500} height={300} className="rounded-lg object-cover w-full h-auto" />
                                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={removeImage}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                         <div className="flex justify-between items-center mt-4">
                            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            <Button onClick={handleSubmit} disabled={!content.trim() && !imageFile}>Post</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
