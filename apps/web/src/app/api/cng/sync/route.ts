import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CngApiError } from "@/lib/cashango/api";
import { parseSyncDates, syncCngTransactions } from "@/lib/cashango/sync";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  let fromDate: string | undefined;
  let toDate: string | undefined;
  try {
    const body = (await request.json()) as {
      fromDate?: string;
      toDate?: string;
    };
    fromDate = body.fromDate;
    toDate = body.toDate;
  } catch {
    // empty body is fine — defaults to last 30 days
  }

  try {
    const range = parseSyncDates(fromDate, toDate, 30);
    const summary = await syncCngTransactions({ ...range, fallbackDays: 30 });
    return NextResponse.json(summary);
  } catch (err) {
    const status = err instanceof CngApiError ? (err.status ?? 502) : 400;
    return NextResponse.json(
      {
        message: err instanceof Error ? err.message : "Sync failed",
      },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
