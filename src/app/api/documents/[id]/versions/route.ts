import { NextRequest, NextResponse } from 'next/server';
import { uploadDocumentVersion, getDocumentVersions, restoreDocumentVersion } from '@/app/actions/documents';
import { uploadFileToAzure } from '@/lib/azure-blob-storage';

// POST /api/documents/[id]/versions - Upload new version
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const uploadedBy = formData.get('uploadedBy') as string;

        if (!file || !uploadedBy) {
            return NextResponse.json({ error: 'File and uploadedBy are required' }, { status: 400 });
        }

        // Validate file size (15MB limit)
        const MAX_FILE_SIZE = 15 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File size exceeds 15MB limit' }, { status: 400 });
        }

        // Upload to Azure
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const timestamp = Date.now();
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const destination = `documents/versions/${params.id}/${timestamp}-${sanitizedFilename}`;
        const fileUrl = await uploadFileToAzure(buffer, destination);

        // Create version record
        const result = await uploadDocumentVersion(params.id, fileUrl, uploadedBy);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, version: result.version, fileUrl });
    } catch (error) {
        console.error('Error uploading document version:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// GET /api/documents/[id]/versions - Get version history
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const versions = await getDocumentVersions(params.id);
        return NextResponse.json(versions);
    } catch (error) {
        console.error('Error fetching document versions:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// PUT /api/documents/[id]/versions - Restore a version
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { versionId, actorId } = body;

        if (!versionId || !actorId) {
            return NextResponse.json({ error: 'Version ID and Actor ID are required' }, { status: 400 });
        }

        const result = await restoreDocumentVersion(params.id, versionId, actorId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error restoring document version:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
