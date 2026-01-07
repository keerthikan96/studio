import { NextRequest, NextResponse } from 'next/server';
import { addDocumentComment, getDocumentComments, deleteDocumentComment } from '@/app/actions/documents';

// POST /api/documents/[id]/comments - Add comment
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { userId, commentText } = body;

        if (!userId || !commentText) {
            return NextResponse.json({ error: 'User ID and comment text are required' }, { status: 400 });
        }

        const result = await addDocumentComment(params.id, userId, commentText);

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error adding comment:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// GET /api/documents/[id]/comments - Get comments
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const comments = await getDocumentComments(params.id);
        return NextResponse.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// DELETE /api/documents/[id]/comments - Delete comment
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(req.url);
        const commentId = searchParams.get('commentId');
        const userId = searchParams.get('userId');

        if (!commentId || !userId) {
            return NextResponse.json({ error: 'Comment ID and User ID are required' }, { status: 400 });
        }

        const result = await deleteDocumentComment(commentId, userId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting comment:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
