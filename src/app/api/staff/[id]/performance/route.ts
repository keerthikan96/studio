
import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToAzure } from '@/lib/azure-blob-storage';
import { addPerformanceRecordAction } from '@/app/actions/staff';
import { PerformanceRecord } from '@/lib/mock-data';

// POST /api/staff/[id]/performance
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const memberId = params.id;
    
    const review_date = formData.get('review_date') as string;
    const score = formData.get('score');
    const comments = formData.get('comments') as string;
    const tags = formData.getAll('tags') as string[];
    const is_confidential = formData.get('is_confidential') === 'true';
    const pinned = formData.get('pinned') === 'true';
    const reviewer_id = formData.get('reviewer_id') as string;
    const reviewer_name = formData.get('reviewer_name') as string;
    const files = formData.getAll('attachments') as File[];

    if (!review_date || !reviewer_id || !reviewer_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const uploadedAttachments: { name: string; url: string }[] = [];
    
    for (const file of files) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const destination = `performance/${memberId}/${Date.now()}-${file.name}`;
        const publicUrl = await uploadFileToAzure(buffer, destination);
        uploadedAttachments.push({ name: file.name, url: publicUrl });
      }
    }

    const recordData: Omit<PerformanceRecord, 'id' | 'created_at'> = {
      member_id: memberId,
      reviewer_id,
      reviewer_name,
      review_date,
      score: score ? parseInt(score as string, 10) : undefined,
      comments,
      tags,
      attachments: uploadedAttachments,
      is_confidential,
      pinned,
    };

    const result = await addPerformanceRecordAction(recordData);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error(`Failed to add performance record for member ${params.id}:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
