
'use server';

import { db, setupDatabase } from '@/lib/db';
import { WorkfeedPost, WorkfeedComment } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';

type PostAuthor = {
    id: string;
    name: string;
    role: string;
    profile_picture_url: string;
}

export async function createPostAction(content: string, author: PostAuthor, imageUrl?: string): Promise<WorkfeedPost | { error: string }> {
    await setupDatabase();
    
    if (!author) {
        return { error: 'You must be logged in to create a post.' };
    }

    try {
        const result = await db.query(
            `INSERT INTO workfeed_posts (author_id, author_name, author_role, author_avatar_url, content, image_url)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *;`,
            [author.id, author.name, author.role, author.profile_picture_url, content, imageUrl]
        );

        const newPost = result.rows[0];
        
        // To make it immediately usable, add empty likes and comments arrays
        const fullPost: WorkfeedPost = {
            ...newPost,
            likes: [],
            comments: []
        };

        revalidatePath('/admin/workfeed');
        revalidatePath('/dashboard/workfeed');
        return fullPost;

    } catch (error) {
        console.error('Error creating post:', error);
        return { error: 'Failed to create post.' };
    }
}

// This function now needs the current user passed to it
async function getCurrentUser(userId: string, userRole: string): Promise<{ id: string, role: string } | null> {
    // In a real app, you might verify the user against the database here
    if (!userId || !userRole) return null;
    return { id: userId, role: userRole };
}


export async function getPostsAction(): Promise<WorkfeedPost[]> {
    await setupDatabase();
    try {
        const postsResult = await db.query('SELECT * FROM workfeed_posts ORDER BY created_at DESC');
        
        const likesResult = await db.query('SELECT post_id, user_id FROM workfeed_likes');
        const commentsResult = await db.query('SELECT * FROM workfeed_comments ORDER BY created_at ASC');

        const likesByPost: { [key: string]: string[] } = {};
        for (const like of likesResult.rows) {
            if (!likesByPost[like.post_id]) {
                likesByPost[like.post_id] = [];
            }
            likesByPost[like.post_id].push(like.user_id);
        }

        const commentsByPost: { [key: string]: WorkfeedComment[] } = {};
        for (const comment of commentsResult.rows) {
            if (!commentsByPost[comment.post_id]) {
                commentsByPost[comment.post_id] = [];
            }
            commentsByPost[comment.post_id].push(comment);
        }
        
        return postsResult.rows.map(post => ({
            ...post,
            likes: likesByPost[post.id] || [],
            comments: commentsByPost[post.id] || [],
        }));

    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

export async function toggleLikeAction(postId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    await setupDatabase();
    
    if (!userId) {
        return { success: false, error: 'You must be logged in to like a post.' };
    }

    try {
        // Check if the user already liked the post
        const likeResult = await db.query(
            'SELECT * FROM workfeed_likes WHERE post_id = $1 AND user_id = $2',
            [postId, userId]
        );

        if (likeResult.rows.length > 0) {
            // User has liked it, so unlike it
            await db.query(
                'DELETE FROM workfeed_likes WHERE post_id = $1 AND user_id = $2',
                [postId, userId]
            );
        } else {
            // User has not liked it, so like it
            await db.query(
                'INSERT INTO workfeed_likes (post_id, user_id) VALUES ($1, $2)',
                [postId, userId]
            );
        }
        
        revalidatePath('/admin/workfeed');
        revalidatePath('/dashboard/workfeed');
        return { success: true };

    } catch (error) {
        console.error('Error toggling like:', error);
        return { success: false, error: 'Failed to update like status.' };
    }
}

export async function addCommentAction(postId: string, content: string, author: PostAuthor): Promise<WorkfeedComment | { error: string }> {
    await setupDatabase();
    
    if (!author) {
        return { error: 'You must be logged in to comment.' };
    }

    try {
        const result = await db.query(
            `INSERT INTO workfeed_comments (post_id, author_id, author_name, author_avatar_url, content)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *;`,
            [postId, author.id, author.name, author.profile_picture_url, content]
        );

        revalidatePath('/admin/workfeed');
        revalidatePath('/dashboard/workfeed');
        return result.rows[0];

    } catch (error) {
        console.error('Error adding comment:', error);
        return { error: 'Failed to add comment.' };
    }
}

export async function deletePostAction(postId: string, userId: string, userRole: string): Promise<{ success: boolean; error?: string }> {
    await setupDatabase();
    const user = await getCurrentUser(userId, userRole);

    if (!user) {
        return { success: false, error: 'You must be logged in to delete a post.' };
    }

    try {
        const postResult = await db.query('SELECT author_id FROM workfeed_posts WHERE id = $1', [postId]);
        
        if (postResult.rows.length === 0) {
            return { success: false, error: 'Post not found.' };
        }

        const post = postResult.rows[0];

        // Check if user is the author or has HR role
        if (post.author_id !== user.id && user.role !== 'HR') {
            return { success: false, error: 'You do not have permission to delete this post.' };
        }

        // Deletion will cascade to likes and comments due to DB constraints
        await db.query('DELETE FROM workfeed_posts WHERE id = $1', [postId]);
        
        revalidatePath('/admin/workfeed');
        revalidatePath('/dashboard/workfeed');
        return { success: true };

    } catch (error) {
        console.error('Error deleting post:', error);
        return { success: false, error: 'Failed to delete post.' };
    }
}

export async function deleteCommentAction(commentId: string, userId: string, userRole: string): Promise<{ success: boolean; error?: string }> {
    await setupDatabase();
    const user = await getCurrentUser(userId, userRole);

    if (!user) {
        return { success: false, error: 'You must be logged in to delete a comment.' };
    }

    try {
        const commentResult = await db.query('SELECT author_id FROM workfeed_comments WHERE id = $1', [commentId]);
        
        if (commentResult.rows.length === 0) {
            return { success: false, error: 'Comment not found.' };
        }

        const comment = commentResult.rows[0];

        // Check if user is the author or has HR role
        if (comment.author_id !== user.id && user.role !== 'HR') {
            return { success: false, error: 'You do not have permission to delete this comment.' };
        }

        await db.query('DELETE FROM workfeed_comments WHERE id = $1', [commentId]);
        
        revalidatePath('/admin/workfeed');
        revalidatePath('/dashboard/workfeed');
        return { success: true };

    } catch (error) {
        console.error('Error deleting comment:', error);
        return { success: false, error: 'Failed to delete comment.' };
    }
}


export async function saveWorkfeedSettingsAction(settings: { birthday: any; anniversary: any; }): Promise<{ success: boolean; error?: string }> {
    await setupDatabase();
    try {
        // Using an "upsert" operation
        await db.query(
            `INSERT INTO app_settings (key, value) 
             VALUES ('workfeed_automation', $1)
             ON CONFLICT (key) 
             DO UPDATE SET value = $1;`,
             [JSON.stringify(settings)]
        );
        return { success: true };
    } catch (error) {
        console.error("Failed to save workfeed settings:", error);
        return { success: false, error: "Could not save settings to the database." };
    }
}

export async function getWorkfeedSettingsAction(): Promise<{ birthday: any; anniversary: any; } | null> {
    await setupDatabase();
    try {
        const result = await db.query("SELECT value FROM app_settings WHERE key = 'workfeed_automation'");
        if (result.rows.length > 0) {
            return result.rows[0].value;
        }
        return null;
    } catch (error) {
        console.error("Failed to get workfeed settings:", error);
        return null;
    }
}
