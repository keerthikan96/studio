
'use client';

import { useState, useEffect, useTransition } from 'react';
import CreatePostForm from '@/components/create-post-form';
import WorkfeedPostComponent from '@/components/workfeed-post';
import { WorkfeedPost } from '@/lib/mock-data';
import { getPostsAction, createPostAction, toggleLikeAction, addCommentAction } from '@/app/actions/workfeed';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkfeedPage() {
    const [posts, setPosts] = useState<WorkfeedPost[]>([]);
    const [isPending, startTransition] = useTransition();
    const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }

        startTransition(() => {
            getPostsAction().then(setPosts);
        });
    }, []);

    const handleCreatePost = async (content: string, imageFile?: File) => {
        let imageUrl: string | undefined = undefined;

        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);

            try {
                const response = await fetch('/api/workfeed/upload', {
                    method: 'POST',
                    body: formData,
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                imageUrl = result.url;
            } catch (error: any) {
                toast({
                    title: 'Image Upload Failed',
                    description: error.message || 'Could not upload image.',
                    variant: 'destructive',
                });
                return;
            }
        }
        
        startTransition(async () => {
            const result = await createPostAction(content, imageUrl);
            if ('error' in result) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            } else {
                setPosts(prevPosts => [result, ...prevPosts]);
                toast({ title: 'Post Created!', description: 'Your post is now live on the feed.' });
            }
        });
    };

    const handleToggleLike = async (postId: string) => {
        if (!currentUser) return;
        
        // Optimistic update
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.id === postId) {
                    const hasLiked = post.likes.includes(currentUser.id);
                    const newLikes = hasLiked
                        ? post.likes.filter(id => id !== currentUser.id)
                        : [...post.likes, currentUser.id];
                    return { ...post, likes: newLikes };
                }
                return post;
            })
        );
        
        // Server action
        await toggleLikeAction(postId);
    };

    const handleAddComment = async (postId: string, commentText: string) => {
        if (!currentUser) return;

        const result = await addCommentAction(postId, commentText);
        if ('error' in result) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
             // Refresh posts to get new comment
            getPostsAction().then(setPosts);
        }
    };


    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Workfeed</h1>
            <CreatePostForm onCreatePost={handleCreatePost} />
            <div className="space-y-4">
                {isPending && posts.length === 0 ? (
                    <>
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-56 w-full" />
                    </>
                ) : (
                    posts.map((post) => (
                        <WorkfeedPostComponent 
                            key={post.id} 
                            post={post}
                            currentUserId={currentUser?.id}
                            onToggleLike={handleToggleLike}
                            onAddComment={handleAddComment}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
