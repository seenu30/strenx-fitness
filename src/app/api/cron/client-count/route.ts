import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }

  try {
    // Direct REST API call - total clients
    const totalRes = await fetch(
      `${supabaseUrl}/rest/v1/clients?select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "count=exact,head=true",
        },
      }
    );

    if (!totalRes.ok) {
      const body = await totalRes.text();
      console.error("[CRON] Total query failed:", totalRes.status, body);
      return NextResponse.json({ error: body }, { status: 500 });
    }

    const totalClients = parseInt(totalRes.headers.get("content-range")?.split("/")[1] || "0");

    // Direct REST API call - active clients
    const activeRes = await fetch(
      `${supabaseUrl}/rest/v1/clients?select=id&status=eq.active`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "count=exact,head=true",
        },
      }
    );

    if (!activeRes.ok) {
      const body = await activeRes.text();
      console.error("[CRON] Active query failed:", activeRes.status, body);
      return NextResponse.json({ error: body }, { status: 500 });
    }

    const activeClients = parseInt(activeRes.headers.get("content-range")?.split("/")[1] || "0");

    const result = {
      timestamp: new Date().toISOString(),
      totalClients,
      activeClients,
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
