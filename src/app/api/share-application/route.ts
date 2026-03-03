import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { generateApplicationInviteEmail } from "@/lib/email/templates/application-invite";
import { z } from "zod";

const shareApplicationSchema = z.object({
  recipient_email: z.string().email("Invalid email address"),
  recipient_name: z.string().optional(),
  custom_message: z.string().max(500, "Message must be 500 characters or less").optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = shareApplicationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { recipient_email, recipient_name, custom_message } = validation.data;

    // Get the current authenticated user (coach)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get coach's name from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("first_name, last_name, role")
      .eq("id", user.id)
      .single() as { data: { first_name: string; last_name: string; role: string } | null; error: unknown };

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Verify user is a coach or super_admin
    if (userData.role !== "coach" && userData.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only coaches can share application links" },
        { status: 403 }
      );
    }

    const coachName = `${userData.first_name} ${userData.last_name}`;
    const applicationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/apply`;

    // Generate email content
    const { html, text, subject } = generateApplicationInviteEmail({
      recipientName: recipient_name,
      coachName,
      customMessage: custom_message,
      applicationUrl,
    });

    // Send email
    const result = await sendEmail({
      to: recipient_email,
      subject,
      html,
      text,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application link sent successfully",
    });
  } catch (error) {
    console.error("Error sharing application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
