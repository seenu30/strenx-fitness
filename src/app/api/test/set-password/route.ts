import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// TEST ONLY - Set password for E2E testing
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
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Find the user by email
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      );
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update the user's password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password, email_confirm: true }
    );

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password set successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("Error in set-password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
