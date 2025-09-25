
'use client';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Heart, MessageSquare, Send, MoreHorizontal, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { WorkfeedPost } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { useState } from 'react';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';


type WorkfeedPostProps = {
    post: WorkfeedPost;
    currentUser?: { id: string, name: string, email: string, role: string, profile_picture_url: string } | null;
    onToggleLike: (postId: string) => void;
    onAddComment: (postId: string, commentText: string) => void;
    onDeletePost: (postId: string) => void;
};

export default function WorkfeedPostComponent({ post, currentUser, onToggleLike, onAddComment, onDeletePost }: WorkfeedPostProps) {
    const fallback = post.author_name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const hasLiked = currentUser ? post.likes.includes(currentUser.id) : false;
    const canDelete = currentUser?.role === 'HR' || currentUser?.id === post.author_id;

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim()) {
            onAddComment(post.id, commentText);
            setCommentText('');
        }
    };

    return (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <Card>
                <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={post.author_avatar_url ?? undefined} />
                                <AvatarFallback>{fallback}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{post.author_name}</p>
                                <p className="text-xs text-muted-foreground">{post.author_role || 'Member'} · {timeAgo}</p>
                            </div>
                        </div>
                        {canDelete && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className='h-8 w-8'>
                                        <MoreHorizontal className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <AlertDialogTrigger asChild>
                                         <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-2">
                    <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                    {post.image_url && (
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                             <Image src={post.image_url} alt="Post image" fill className="object-cover" />
                        </div>
                    )}
                </CardContent>
                <CardContent className="px-4 pb-2">
                     {(post.likes.length > 0 || post.comments.length > 0) && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className='flex items-center gap-1'>{post.likes.length > 0 && <><Heart className="h-4 w-4 text-red-500 fill-red-500" /> {post.likes.length} Likes</>}</span>
                            {post.comments.length > 0 && 
                                <button onClick={() => setShowComments(!showComments)} className="hover:underline">
                                    {post.comments.length} Comments
                                </button>
                            }
                        </div>
                    )}
                </CardContent>
                <Separator />
                <CardFooter className="p-1">
                    <div className="w-full grid grid-cols-2">
                        <Button variant="ghost" className="flex items-center gap-2" onClick={() => onToggleLike(post.id)}>
                            <Heart className={`h-4 w-4 ${hasLiked ? 'text-red-500 fill-red-500' : ''}`} /> Like
                        </Button>
                        <Button variant="ghost" className="flex items-center gap-2" onClick={() => setShowComments(true)}>
                            <MessageSquare className="h-4 w-4" /> Comment
                        </Button>
                    </div>
                </CardFooter>
                {showComments && (
                     <div className="p-4 pt-0">
                        <Separator className="mb-4" />
                        <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                            {post.comments.map(comment => (
                                <div key={comment.id} className="flex items-start gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.author_avatar_url ?? undefined} />
                                        <AvatarFallback>{comment.author_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted p-2 rounded-lg flex-1">
                                        <p className="font-semibold text-sm">{comment.author_name}</p>
                                        <p className="text-sm">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={currentUser?.profile_picture_url ?? undefined} />
                                <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Input 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Write a comment..."
                                className="h-9"
                            />
                            <Button type="submit" size="icon" className="h-9 w-9" disabled={!commentText.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                )}
            </Card>

             <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this post.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className='bg-destructive hover:bg-destructive/90'
                        onClick={() => onDeletePost(post.id)}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
