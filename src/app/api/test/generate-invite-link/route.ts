import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// TEST ONLY - Generate invite/recovery link for E2E testing
// This endpoint should be removed or disabled in production
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const { email, type = "invite" } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Generate link based on type
    const linkType = type === "recovery" ? "recovery" : "invite";
    const redirectPath = type === "recovery" ? "/accept-invite" : "/accept-invite";

    const { data, error } = await adminClient.auth.admin.generateLink({
      type: linkType,
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${redirectPath}`,
      },
    });

    if (error) {
      console.error("Error generating link:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Extract token from the action link
    const actionLink = data.properties?.action_link;
    let token = null;

    if (actionLink) {
      const url = new URL(actionLink);
      token = url.searchParams.get("token");
    }

    return NextResponse.json({
      success: true,
      type: linkType,
      actionLink,
      token,
      email: data.user?.email,
    });
  } catch (error) {
    console.error("Error in generate-invite-link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
