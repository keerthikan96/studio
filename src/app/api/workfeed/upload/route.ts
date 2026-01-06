
import 'dotenv/config';
import { NextRequest, NextResponse } from "next/server";
import sharp from 'sharp';
import { uploadFileToAzure } from "@/lib/azure-blob-storage";

// POST /api/workfeed/upload
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    // Resize image for better performance
    const processedBuffer = await sharp(originalBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 }) // Convert to WebP
      .toBuffer();

    const destination = `workfeed-posts/${Date.now()}-${file.name.replace(/\s/g, '_')}.webp`;
    const publicUrl = await uploadFileToAzure(processedBuffer, destination);

    return NextResponse.json({ message: "Image uploaded successfully", url: publicUrl });

  } catch (error) {
    console.error(`Failed to upload workfeed image:`, error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
