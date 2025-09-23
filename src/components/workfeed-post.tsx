
'use client';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Heart, MessageSquare, Share2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { Member } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';

type PostAuthor = Partial<Member> & {
    name: string;
    profile_picture_url?: string | null;
    role?: string;
};

type Post = {
    id: string;
    author: PostAuthor;
    content: string;
    timestamp: Date;
    likes: number;
    comments: { authorName: string; text: string }[];
};

type WorkfeedPostProps = {
    post: Post;
};

export default function WorkfeedPost({ post }: WorkfeedPostProps) {
    const fallback = post.author.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

    const timeAgo = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });

    return (
        <Card>
            <CardHeader className="p-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={post.author.profile_picture_url ?? undefined} />
                        <AvatarFallback>{fallback}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{post.author.name}</p>
                        <p className="text-xs text-muted-foreground">{post.author.role || 'Member'} · {timeAgo}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-2">
                <p className="whitespace-pre-wrap">{post.content}</p>
            </CardContent>
            <CardContent className="px-4 pb-2">
                 {(post.likes > 0 || post.comments.length > 0) && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{post.likes > 0 && `❤️ ${post.likes} Likes`}</span>
                        <span>{post.comments.length > 0 && `${post.comments.length} Comments`}</span>
                    </div>
                )}
            </CardContent>
            <Separator />
            <CardFooter className="p-1">
                <div className="w-full grid grid-cols-3">
                    <Button variant="ghost" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" /> Like
                    </Button>
                    <Button variant="ghost" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Comment
                    </Button>
                    <Button variant="ghost" className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" /> Share
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
