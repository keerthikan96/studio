
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';

type CreatePostFormProps = {
    onCreatePost: (content: string) => void;
};

export default function CreatePostForm({ onCreatePost }: CreatePostFormProps) {
    const [content, setContent] = useState('');
    const { toast } = useToast();

    const handleSubmit = () => {
        if (content.trim()) {
            onCreatePost(content);
            setContent('');
            toast({
                title: "Post Created!",
                description: "Your post has been successfully added to the feed.",
            });
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
                            className="w-full border-0 focus-visible:ring-0 ring-offset-0 p-0 text-base"
                        />
                         <div className="flex justify-end mt-4">
                            <Button onClick={handleSubmit} disabled={!content.trim()}>Post</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
