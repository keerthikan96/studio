
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import sharp from 'sharp';

const MIME_TYPES: { [key: string]: string } = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/gif': 'image/gif',
  'image/webp': 'image/webp',
};

// GET /api/staff/[id]/profile-picture
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { rows } = await db.query(
      "SELECT profile_picture FROM members WHERE id = $1",
      [params.id]
    );

    if (!rows[0] || !rows[0].profile_picture) {
      return new NextResponse("Not found", { status: 404 });
    }

    const buffer: Buffer = rows[0].profile_picture;
    const metadata = await sharp(buffer).metadata();
    const contentType = metadata.format ? `image/${metadata.format}` : 'application/octet-stream';


    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=604800, immutable", // Cache for 7 days
      },
    });
  } catch (error) {
    console.error(`Failed to retrieve profile picture for member ${params.id}:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    
    if (!MIME_TYPES[file.type]) {
        return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    // Resize and convert image to a consistent format (e.g., PNG)
    const processedBuffer = await sharp(originalBuffer)
      .resize(256, 256, { fit: 'cover' }) // Resize to a 256x256 square
      .png() // Convert to PNG for consistency
      .toBuffer();

    await db.query(
      "UPDATE members SET profile_picture = $1, updated_at = NOW() WHERE id = $2",
      [processedBuffer, params.id]
    );

    return NextResponse.json({ message: "Profile picture saved" });

  } catch (error) {
    console.error(`Failed to upload profile picture for member ${params.id}:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
