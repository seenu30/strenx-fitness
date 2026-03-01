import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle errors from Supabase
  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(errorDescription || error)}`,
        requestUrl.origin
      )
    );
  }

  // Exchange code for session
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(exchangeError.message)}`,
          requestUrl.origin
        )
      );
    }

    // Check if this is a password recovery flow
    const type = requestUrl.searchParams.get("type");
    if (type === "recovery") {
      return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
    }

    // Check if this is an invite flow
    if (type === "invite" || next === "/accept-invite") {
      return NextResponse.redirect(new URL("/accept-invite", requestUrl.origin));
    }
  }

  // Redirect to intended destination
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
