import { NextRequest, NextResponse } from 'next/server';
import { updateDocument, deleteDocument } from '@/app/actions/documents';

// PUT /api/documents/[id] - Update document metadata
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { title, description, categoryId, isHidden, isCompanyWide, actorId } = body;

        if (!actorId) {
            return NextResponse.json({ error: 'Actor ID is required' }, { status: 400 });
        }

        const result = await updateDocument(
            params.id,
            { title, description, categoryId, isHidden, isCompanyWide },
            actorId
        );

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating document:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(req.url);
        const actorId = searchParams.get('actorId');

        if (!actorId) {
            return NextResponse.json({ error: 'Actor ID is required' }, { status: 400 });
        }

        const result = await deleteDocument(params.id, actorId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
