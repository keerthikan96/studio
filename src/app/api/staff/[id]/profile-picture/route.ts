
import 'dotenv/config';
import { NextRequest, NextResponse } from "next/server";
import sharp from 'sharp';
import { uploadFileToAzure } from "@/lib/azure-blob-storage";
import { updateMemberAction } from "@/app/actions/staff";

// POST /api/staff/[id]/profile-picture
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    // Resize and convert image to a consistent format (e.g., WebP for efficiency)
    const processedBuffer = await sharp(originalBuffer)
      .resize(256, 256, { fit: 'cover' }) // Resize to a 256x256 square
      .webp({ quality: 80 }) // Convert to WebP with 80% quality
      .toBuffer();

    const destination = `profile-pictures/${params.id}-${Date.now()}.webp`;
    const publicUrl = await uploadFileToAzure(processedBuffer, destination);

    // If it's the admin user, skip database update
    if (params.id !== 'admin-user-001') {
        const result = await updateMemberAction(params.id, { profile_picture_url: publicUrl });
        if ('error' in result) {
            throw new Error(result.error);
        }
    }

    return NextResponse.json({ message: "Profile picture saved", url: publicUrl });

  } catch (error) {
    console.error(`Failed to upload profile picture for member ${params.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
