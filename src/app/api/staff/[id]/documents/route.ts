
import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToAzure } from '@/lib/azure-blob-storage';
import { addDocumentAction, updateDocumentAction, deleteDocumentAction } from '@/app/actions/staff';
import { Document } from '@/lib/mock-data';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'application/pdf', 
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// POST /api/staff/[id]/documents - Add a new document
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const memberId = params.id;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;

    if (!name || !description || !file) {
      return NextResponse.json({ error: 'Name, description, and file are required.' }, { status: 400 });
    }
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: 'File size exceeds 15MB.' }, { status: 400 });
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const destination = `documents/${memberId}/${Date.now()}-${file.name}`;
    const publicUrl = await uploadFileToAzure(buffer, destination);

    const docData: Omit<Document, 'id' | 'created_at'> = {
      member_id: memberId,
      name,
      description,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size,
    };

    const result = await addDocumentAction(docData);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error(`Failed to add document for member ${params.id}:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT /api/staff/[id]/documents?docId=[docId] - Update a document
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const memberId = params.id;
        const docId = req.nextUrl.searchParams.get('docId');
        if (!docId) {
            return NextResponse.json({ error: 'Document ID is required.' }, { status: 400 });
        }

        const { name, description } = await req.json();

        if (!name || !description) {
            return NextResponse.json({ error: 'Name and description are required.' }, { status: 400 });
        }
        
        const result = await updateDocumentAction(docId, { name, description });

        if ('error' in result) {
             return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        console.error(`Failed to update document:`, error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// DELETE /api/staff/[id]/documents?docId=[docId] - Delete a document
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const memberId = params.id;
        const docId = req.nextUrl.searchParams.get('docId');

        if (!docId) {
            return NextResponse.json({ error: 'Document ID is required.' }, { status: 400 });
        }

        // TODO: In a real app, you might want to delete the file from Azure Blob Storage as well.
        
        const result = await deleteDocumentAction(docId);
        
        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Failed to delete document.' }, { status: result.error === 'Document not found.' ? 404 : 500 });
        }
        
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        console.error(`Failed to delete document:`, error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
