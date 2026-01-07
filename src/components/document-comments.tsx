'use client';

import { useEffect, useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type Comment = {
    id: string;
    document_id: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    comment_text: string;
    created_at: string;
};

type DocumentCommentsProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId: string;
    documentTitle: string;
};

export function DocumentComments({
    open,
    onOpenChange,
    documentId,
    documentTitle
}: DocumentCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isPending, startTransition] = useTransition();
    const [isAdding, setIsAdding] = useState(false);
    const { toast } = useToast();

    const storedUser = typeof window !== 'undefined' 
        ? JSON.parse(sessionStorage.getItem('loggedInUser') || '{}')
        : {};

    useEffect(() => {
        if (open) {
            loadComments();
        }
    }, [open, documentId]);

    const loadComments = () => {
        startTransition(async () => {
            try {
                const response = await fetch(`/api/documents/${documentId}/comments`);
                if (response.ok) {
                    const data = await response.json();
                    setComments(data);
                }
            } catch (error) {
                console.error('Error loading comments:', error);
            }
        });
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            toast({
                title: 'Error',
                description: 'Comment cannot be empty',
                variant: 'destructive'
            });
            return;
        }

        setIsAdding(true);
        try {
            const response = await fetch(`/api/documents/${documentId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: storedUser.id,
                    commentText: newComment
                })
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Comment added successfully'
                });
                setNewComment('');
                loadComments();
            } else {
                const error = await response.json();
                toast({
                    title: 'Error',
                    description: error.error || 'Failed to add comment',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive'
            });
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        startTransition(async () => {
            try {
                const response = await fetch(
                    `/api/documents/${documentId}/comments?commentId=${commentId}&userId=${storedUser.id}`,
                    { method: 'DELETE' }
                );

                if (response.ok) {
                    toast({
                        title: 'Success',
                        description: 'Comment deleted successfully'
                    });
                    loadComments();
                } else {
                    const error = await response.json();
                    toast({
                        title: 'Error',
                        description: error.error || 'Failed to delete comment',
                        variant: 'destructive'
                    });
                }
            } catch (error) {
                console.error('Error deleting comment:', error);
                toast({
                    title: 'Error',
                    description: 'An unexpected error occurred',
                    variant: 'destructive'
                });
            }
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Comments - {documentTitle}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                    {/* Comments List */}
                    <ScrollArea className="flex-1">
                        <div className="space-y-4 pr-4">
                            {comments.length === 0 && !isPending && (
                                <div className="text-center text-muted-foreground py-8">
                                    No comments yet. Be the first to comment!
                                </div>
                            )}

                            {comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="flex gap-3 p-3 rounded-lg border bg-card"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.user_avatar} />
                                        <AvatarFallback>
                                            {getInitials(comment.user_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">
                                                    {comment.user_name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(comment.created_at), 'PPp')}
                                                </span>
                                            </div>
                                            {comment.user_id === storedUser.id && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    disabled={isPending}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">
                                            {comment.comment_text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Add Comment */}
                    <div className="space-y-2 border-t pt-4">
                        <Textarea
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                            disabled={isAdding}
                        />
                        <div className="flex justify-end">
                            <Button
                                onClick={handleAddComment}
                                disabled={isAdding || !newComment.trim()}
                            >
                                {isAdding ? 'Adding...' : 'Add Comment'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
