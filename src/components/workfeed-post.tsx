
'use client';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Heart, MessageSquare, Send, MoreHorizontal, Trash2, CornerUpLeft } from 'lucide-react';
import { Separator } from './ui/separator';
import { WorkfeedComment, WorkfeedPost } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { addReplyAction, toggleCommentLikeAction } from '@/app/actions/workfeed';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type WorkfeedPostProps = {
    post: WorkfeedPost;
    currentUser?: { id: string, name: string, email: string, role: string, profile_picture_url: string } | null;
    onToggleLike: (postId: string) => void;
    onAddComment: (postId: string, commentText: string) => void;
    onDeletePost: (postId: string) => void;
    onDeleteComment: (commentId: string) => void;
    onAddReply: (postId: string, parentCommentId: string, replyText: string) => void;
    onToggleCommentLike: (commentId: string) => void;
};

const ReplyForm = ({ postId, parentCommentId, currentUser, onAddReply, onCancel }) => {
    const [replyText, setReplyText] = useState('');

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim()) {
            onAddReply(postId, parentCommentId, replyText);
            setReplyText('');
            onCancel();
        }
    };

    return (
        <form onSubmit={handleReplySubmit} className="flex items-center gap-2 mt-2 ml-10">
            <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.profile_picture_url ?? undefined} />
                <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <Input 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="h-9"
                autoFocus
            />
            <Button type="submit" size="icon" className="h-9 w-9" disabled={!replyText.trim()}>
                <Send className="h-4 w-4" />
            </Button>
        </form>
    );
};

const Comment = ({ comment, post, currentUser, canDelete, onDeleteComment, onToggleCommentLike, onAddReply }) => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const hasLikedComment = currentUser ? comment.likes.includes(currentUser.id) : false;
    const replies = post.comments.filter(c => c.parent_comment_id === comment.id);

    return (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <div className={cn("flex items-start gap-2 group", comment.parent_comment_id && 'ml-10')}>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author_avatar_url ?? undefined} />
                    <AvatarFallback>{comment.author_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="bg-muted p-2 rounded-lg">
                        <p className="font-semibold text-sm">{comment.author_name}</p>
                        <p className="text-sm">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
                        <button className={cn("hover:underline", hasLikedComment && "text-primary font-bold")} onClick={() => onToggleCommentLike(comment.id)}>Like</button>
                        ·
                        <button className="hover:underline" onClick={() => setIsReplying(!isReplying)}>Reply</button>
                        ·
                        <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>

                        {comment.likes.length > 0 && (
                            <div className='flex items-center gap-1'>
                                ·
                                <Heart className="h-3 w-3 text-red-500 fill-red-500" /> 
                                {comment.likes.length}
                            </div>
                        )}
                    </div>

                    {isReplying && (
                        <ReplyForm
                            postId={post.id}
                            parentCommentId={comment.id}
                            currentUser={currentUser}
                            onAddReply={onAddReply}
                            onCancel={() => setIsReplying(false)}
                        />
                    )}

                    {replies.map(reply => (
                        <div key={reply.id} className='mt-2'>
                             <Comment
                                comment={reply}
                                post={post}
                                currentUser={currentUser}
                                canDelete={currentUser?.role === 'HR' || currentUser?.id === reply.author_id}
                                onDeleteComment={onDeleteComment}
                                onToggleCommentLike={onToggleCommentLike}
                                onAddReply={onAddReply}
                            />
                        </div>
                    ))}
                </div>

                {canDelete && (
                    <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                            <Trash2 className="h-3 w-3 text-destructive"/>
                        </Button>
                    </AlertDialogTrigger>
                )}
            </div>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete this comment?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the comment.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className='bg-destructive hover:bg-destructive/90' onClick={() => onDeleteComment(comment.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default function WorkfeedPostComponent({ post, currentUser, onToggleLike, onAddComment, onDeletePost, onDeleteComment, onAddReply, onToggleCommentLike }: WorkfeedPostProps) {
    const { toast } = useToast();
    const fallback = post.author_name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const hasLiked = currentUser ? post.likes.includes(currentUser.id) : false;
    const canDeletePost = currentUser?.role === 'HR' || currentUser?.id === post.author_id;

    const topLevelComments = useMemo(() => post.comments.filter(c => !c.parent_comment_id), [post.comments]);

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim()) {
            onAddComment(post.id, commentText);
            setCommentText('');
        }
    };
    
    const internalAddReply = async (postId, parentCommentId, replyText) => {
        if (!currentUser) { toast({ title: "Must be logged in to reply."}); return; }
        const result = await addReplyAction(postId, parentCommentId, replyText, currentUser);
        if ('error' in result) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            onAddReply(postId, parentCommentId, replyText);
        }
    };

    const internalToggleCommentLike = async (commentId) => {
        if (!currentUser) { toast({ title: "Must be logged in to like."}); return; }
        onToggleCommentLike(commentId); // Optimistic update
        await toggleCommentLikeAction(commentId, currentUser.id);
    }

    return (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <Card>
                <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar><AvatarImage src={post.author_avatar_url ?? undefined} /><AvatarFallback>{fallback}</AvatarFallback></Avatar>
                            <div><p className="font-semibold">{post.author_name}</p><p className="text-xs text-muted-foreground">{post.author_role || 'Member'} · {timeAgo}</p></div>
                        </div>
                        {canDeletePost && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className='h-8 w-8'><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Post</DropdownMenuItem></AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-2">
                    <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                    {post.image_url && <div className="relative aspect-video w-full rounded-lg overflow-hidden border"><Image src={post.image_url} alt="Post image" fill className="object-cover" /></div>}
                </CardContent>
                <CardContent className="px-4 pb-2">
                     {(post.likes.length > 0 || post.comments.length > 0) && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className='flex items-center gap-1'>{post.likes.length > 0 && <><Heart className="h-4 w-4 text-red-500 fill-red-500" /> {post.likes.length} {post.likes.length === 1 ? "Like" : "Likes"}</>}</span>
                            {post.comments.length > 0 && <button onClick={() => setShowComments(!showComments)} className="hover:underline">{post.comments.length} {post.comments.length === 1 ? "Comment" : "Comments"}</button>}
                        </div>
                    )}
                </CardContent>
                <Separator />
                <CardFooter className="p-1">
                    <div className="w-full grid grid-cols-2"><Button variant="ghost" className="flex items-center gap-2" onClick={() => onToggleLike(post.id)}><Heart className={`h-4 w-4 ${hasLiked ? 'text-red-500 fill-red-500' : ''}`} /> Like</Button><Button variant="ghost" className="flex items-center gap-2" onClick={() => setShowComments(true)}><MessageSquare className="h-4 w-4" /> Comment</Button></div>
                </CardFooter>
                {showComments && (
                     <div className="p-4 pt-0">
                        <Separator className="mb-4" />
                        <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                           {topLevelComments.map(comment => (
                                <Comment
                                    key={comment.id}
                                    comment={comment}
                                    post={post}
                                    currentUser={currentUser}
                                    canDelete={currentUser?.role === 'HR' || currentUser?.id === comment.author_id}
                                    onDeleteComment={onDeleteComment}
                                    onToggleCommentLike={internalToggleCommentLike}
                                    onAddReply={internalAddReply}
                                />
                            ))}
                        </div>
                        <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                            <Avatar className="h-8 w-8"><AvatarImage src={currentUser?.profile_picture_url ?? undefined} /><AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback></Avatar>
                            <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="h-9"/>
                            <Button type="submit" size="icon" className="h-9 w-9" disabled={!commentText.trim()}><Send className="h-4 w-4" /></Button>
                        </form>
                    </div>
                )}
            </Card>

             <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete this post.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className='bg-destructive hover:bg-destructive/90' onClick={() => onDeletePost(post.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

  