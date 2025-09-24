
import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToGCS } from '@/lib/gcs';
import { addNoteAction } from '@/app/actions/staff';
import { Note } from '@/lib/mock-data';

// POST /api/staff/[id]/notes
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const memberId = params.id;
    const note_name = formData.get('note_name') as string;
    const description = formData.get('description') as string;
    const is_confidential = formData.get('is_confidential') === 'true';
    const created_by_id = formData.get('created_by_id') as string;
    const created_by_name = formData.get('created_by_name') as string;
    const files = formData.getAll('attachments') as File[];

    if (!note_name || !description || !created_by_id || !created_by_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const uploadedAttachments: { name: string; url: string }[] = [];
    
    for (const file of files) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const destination = `notes/${memberId}/${Date.now()}-${file.name}`;
        const publicUrl = await uploadFileToGCS(buffer, destination);
        uploadedAttachments.push({ name: file.name, url: publicUrl });
      }
    }

    const noteData: Omit<Note, 'id' | 'created_at'> = {
      member_id: memberId,
      created_by_id,
      created_by_name,
      note_name,
      description,
      is_confidential,
      attachments: uploadedAttachments,
    };

    const result = await addNoteAction(noteData);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error(`Failed to add note for member ${params.id}:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
