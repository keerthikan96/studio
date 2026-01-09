import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToAzure } from '@/lib/azure-blob-storage';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const memberId = formData.get('memberId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.match(/^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, DOC, and DOCX are allowed.' }, { status: 400 });
    }

    // Max file size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const destination = `resumes/${memberId}/${Date.now()}-${file.name}`;
    const publicUrl = await uploadFileToAzure(buffer, destination);

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
  } catch (error: any) {
    console.error('Error uploading resume:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
