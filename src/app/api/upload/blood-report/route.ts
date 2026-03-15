import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const applicationId = formData.get("applicationId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type - PDF only
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = applicationId
      ? `${applicationId}/${timestamp}-${randomId}-${originalName}`
      : `general/${timestamp}-${randomId}-${originalName}`;

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use admin client to upload (public upload, no auth required for application form)
    const adminClient = createAdminClient();

    // Upload to blood-reports bucket
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient as any).storage
      .from("blood-reports")
      .upload(filename, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: urlData } = (adminClient as any).storage
      .from("blood-reports")
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      path: data.path,
      url: urlData.publicUrl,
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("Error in blood report upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
