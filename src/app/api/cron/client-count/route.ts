import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { count: totalClients, error: totalError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      return NextResponse.json({ error: totalError.message }, { status: 500 });
    }

    const { count: activeClients, error: activeError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    if (activeError) {
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
    console.error("[CRON] Client count error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
