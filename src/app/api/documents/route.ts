
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToAzure } from '@/lib/azure-blob-storage';
import { uploadDocument } from '@/app/actions/documents';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'application/pdf', 
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// POST /api/documents - Upload a new company/shared document
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string | undefined;
    const isCompanyWide = formData.get('isCompanyWide') === 'true';
    const uploadedBy = formData.get('uploadedBy') as string;
    const file = formData.get('file') as File;

    if (!title || !uploadedBy || !file) {
      return NextResponse.json({ error: 'Title, uploadedBy, and file are required.' }, { status: 400 });
    }
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: 'File size exceeds 15MB.' }, { status: 400 });
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `Invalid file type. Allowed types are: ${ALLOWED_FILE_TYPES.join(', ')}` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Construct a meaningful path
    const pathPrefix = isCompanyWide ? 'documents/company' : `documents/user/${uploadedBy}`;
    const destination = `${pathPrefix}/${categoryId || 'uncategorized'}/${Date.now()}-${file.name}`;
    
    const publicUrl = await uploadFileToAzure(buffer, destination);

    const docData = {
      title,
      description,
      fileUrl: publicUrl,
      fileType: file.type,
      fileSize: file.size,
      uploadedBy,
      categoryId,
      isCompanyWide,
    };

    const result = await uploadDocument(docData);

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error(`Failed to upload document:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
