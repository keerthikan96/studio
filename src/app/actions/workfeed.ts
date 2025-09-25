
'use server';

import { db, setupDatabase } from '@/lib/db';
import { WorkfeedPost, WorkfeedComment } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';

// This is a placeholder for getting the current user.
// In a real app, this would come from your actual auth system (e.g., NextAuth.js, Clerk, etc.)
async function getCurrentUser() {
    // For now, we'll return a mock HR user.
    // Replace this with your actual session management.
    return {
        id: 'admin-user-001',
        name: 'People and Culture office',
        email: 'admin@gmail.com',
        role: 'HR',
        profile_picture_url: 'https://i.pravatar.cc/40?u=admin-user-001',
    };
}

export async function createPostAction(content: string, imageUrl?: string): Promise<WorkfeedPost | { error: string }> {
    await setupDatabase();
    const user = await getCurrentUser();

    if (!user) {
        return { error: 'You must be logged in to create a post.' };
    }

    try {
        const result = await db.query(
            `INSERT INTO workfeed_posts (author_id, author_name, author_role, author_avatar_url, content, image_url)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *;`,
            [user.id, user.name, user.role, user.profile_picture_url, content, imageUrl]
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

export async function toggleLikeAction(postId: string): Promise<{ success: boolean; error?: string }> {
    await setupDatabase();
    const user = await getCurrentUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to like a post.' };
    }

    try {
        // Check if the user already liked the post
        const likeResult = await db.query(
            'SELECT * FROM workfeed_likes WHERE post_id = $1 AND user_id = $2',
            [postId, user.id]
        );

        if (likeResult.rows.length > 0) {
            // User has liked it, so unlike it
            await db.query(
                'DELETE FROM workfeed_likes WHERE post_id = $1 AND user_id = $2',
                [postId, user.id]
            );
        } else {
            // User has not liked it, so like it
            await db.query(
                'INSERT INTO workfeed_likes (post_id, user_id) VALUES ($1, $2)',
                [postId, user.id]
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

export async function addCommentAction(postId: string, content: string): Promise<WorkfeedComment | { error: string }> {
    await setupDatabase();
    const user = await getCurrentUser();

    if (!user) {
        return { error: 'You must be logged in to comment.' };
    }

    try {
        const result = await db.query(
            `INSERT INTO workfeed_comments (post_id, author_id, author_name, author_avatar_url, content)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *;`,
            [postId, user.id, user.name, user.profile_picture_url, content]
        );

        revalidatePath('/admin/workfeed');
        revalidatePath('/dashboard/workfeed');
        return result.rows[0];

    } catch (error) {
        console.error('Error adding comment:', error);
        return { error: 'Failed to add comment.' };
    }
}

export async function deletePostAction(postId: string): Promise<{ success: boolean; error?: string }> {
    await setupDatabase();
    const user = await getCurrentUser();

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
