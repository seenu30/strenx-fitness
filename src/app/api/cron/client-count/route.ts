import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel cron sends Authorization header on Pro, or check custom header
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON] CRON_SECRET env variable is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("[CRON] Unauthorized - received:", authHeader?.substring(0, 20));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[CRON] Missing Supabase env vars", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    });
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { count: totalClients, error: totalError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      console.error("[CRON] Total clients query error:", totalError);
      return NextResponse.json({ error: totalError.message }, { status: 500 });
    }

    const { count: activeClients, error: activeError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    if (activeError) {
      console.error("[CRON] Active clients query error:", activeError);
      return NextResponse.json({ error: activeError.message }, { status: 500 });
    }

    const result = {
      timestamp: new Date().toISOString(),
      totalClients: totalClients ?? 0,
      activeClients: activeClients ?? 0,
    };

    console.log("[CRON] Daily client count:", JSON.stringify(result));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CRON] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
