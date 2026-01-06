
import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToAzure } from '@/lib/azure-blob-storage';
import { addCourseOrCertificateAction } from '@/app/actions/staff';
import { CourseOrCertificate } from '@/lib/mock-data';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// POST /api/staff/[id]/certificates-and-courses - Add a new course or certificate
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const memberId = params.id;
    const type = formData.get('type') as 'Course' | 'Certificate';
    const name = formData.get('name') as string;
    const file = formData.get('certificate') as File | null;
    
    if (!type || !name) {
        return NextResponse.json({ error: 'Type and name are required.' }, { status: 400 });
    }
    
    let certificate_url: string | undefined = undefined;
    let certificate_file_type: string | undefined = undefined;

    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json({ error: 'File size exceeds 15MB.' }, { status: 400 });
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, and PDF are allowed.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const destination = `certificates/${memberId}/${Date.now()}-${file.name}`;
      certificate_url = await uploadFileToAzure(buffer, destination);
      certificate_file_type = file.type;
    }
    
    const recordData: Omit<CourseOrCertificate, 'id' | 'created_at'> = {
      member_id: memberId,
      type,
      name,
      provider: formData.get('provider') as string | undefined,
      course_url: formData.get('course_url') as string | undefined,
      status: formData.get('status') as 'Completed' | 'In Progress' | undefined,
      verification_url: formData.get('verification_url') as string | undefined,
      certificate_url,
      certificate_file_type,
    };

    const result = await addCourseOrCertificateAction(recordData);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error(`Failed to add course/certificate for member ${params.id}:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
