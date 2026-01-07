import { NextRequest, NextResponse } from 'next/server';
import { shareDocumentWithMultiple, getDocumentShares, unshareDocument } from '@/app/actions/documents';

// POST /api/documents/[id]/share - Share document with users/roles
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { userIds, roleIds, accessMode, expiryDate, actorId } = body;

        if (!actorId) {
            return NextResponse.json({ error: 'Actor ID is required' }, { status: 400 });
        }

        const result = await shareDocumentWithMultiple({
            documentId: params.id,
            userIds,
            roleIds,
            accessMode,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            actorId
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sharing document:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// GET /api/documents/[id]/share - Get document shares
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const shares = await getDocumentShares(params.id);
        return NextResponse.json(shares);
    } catch (error) {
        console.error('Error fetching document shares:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// DELETE /api/documents/[id]/share - Unshare document
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(req.url);
        const shareId = searchParams.get('shareId');
        const actorId = searchParams.get('actorId');

        if (!shareId || !actorId) {
            return NextResponse.json({ error: 'Share ID and Actor ID are required' }, { status: 400 });
        }

        const result = await unshareDocument(shareId, actorId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unsharing document:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
