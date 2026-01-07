import { NextRequest, NextResponse } from 'next/server';
import { searchDocuments } from '@/app/actions/documents';

// GET /api/documents/search - Search documents with filters
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        
        const userId = searchParams.get('userId');
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const params = {
            userId,
            searchTerm: searchParams.get('searchTerm') || undefined,
            categoryId: searchParams.get('categoryId') || undefined,
            fileType: searchParams.get('fileType') || undefined,
            dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
            dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
            uploadedBy: searchParams.get('uploadedBy') || undefined,
            minSize: searchParams.get('minSize') ? parseInt(searchParams.get('minSize')!) : undefined,
            maxSize: searchParams.get('maxSize') ? parseInt(searchParams.get('maxSize')!) : undefined,
        };

        const documents = await searchDocuments(params);
        return NextResponse.json(documents);
    } catch (error) {
        console.error('Error searching documents:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
