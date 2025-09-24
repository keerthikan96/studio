
import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToGCS } from '@/lib/gcs';
import { addSelfEvaluationAction } from '@/app/actions/staff';
import { SelfEvaluation } from '@/lib/mock-data';

// POST /api/staff/[id]/self-evaluation
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const memberId = params.id;
    
    const evaluation_date = formData.get('evaluation_date') as string;
    const self_rating = formData.get('self_rating');
    const comments = formData.get('comments') as string;
    const tags = formData.getAll('tags') as string[];
    const files = formData.getAll('attachments') as File[];

    if (!evaluation_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const uploadedAttachments: { name: string; url: string }[] = [];
    
    for (const file of files) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const destination = `self-evaluations/${memberId}/${Date.now()}-${file.name}`;
        const publicUrl = await uploadFileToGCS(buffer, destination);
        uploadedAttachments.push({ name: file.name, url: publicUrl });
      }
    }

    const evaluationData: Omit<SelfEvaluation, 'id' | 'created_at' | 'status' | 'hr_feedback' | 'finalized_by_id' | 'finalized_by_name' | 'finalized_at'> = {
      member_id: memberId,
      evaluation_date,
      self_rating: self_rating ? parseInt(self_rating as string, 10) : undefined,
      comments,
      tags,
      attachments: uploadedAttachments,
    };

    const result = await addSelfEvaluationAction(evaluationData);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error(`Failed to add self-evaluation for member ${params.id}:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
