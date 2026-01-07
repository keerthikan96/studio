
import { NextRequest, NextResponse } from 'next/server';
import { getDocumentCategories, createDocumentCategory, updateDocumentCategory, deleteDocumentCategory } from '@/app/actions/documents';

// GET /api/document-categories
export async function GET() {
    try {
        const categories = await getDocumentCategories();
        return NextResponse.json(categories);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/document-categories
export async function POST(req: NextRequest) {
    try {
        const { name, actorId } = await req.json();
        if (!name || !actorId) {
            return NextResponse.json({ error: 'Name and actorId are required.' }, { status: 400 });
        }
        const result = await createDocumentCategory(name, actorId);
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 409 }); // Conflict for existing name
        }
        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/document-categories?id=[id]
export async function PUT(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Category ID is required in query params.' }, { status: 400 });
        }
        const { name, actorId } = await req.json();
        if (!name || !actorId) {
            return NextResponse.json({ error: 'Name and actorId are required.' }, { status: 400 });
        }
        
        const result = await updateDocumentCategory(id, name, actorId);
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/document-categories?id=[id]
export async function DELETE(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get('id');
         if (!id) {
            return NextResponse.json({ error: 'Category ID is required in query params.' }, { status: 400 });
        }
        const { actorId } = await req.json();
         if (!actorId) {
            return NextResponse.json({ error: 'actorId is required.' }, { status: 400 });
        }

        const result = await deleteDocumentCategory(id, actorId);
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
