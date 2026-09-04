import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ImportableApiError, searchImportableItems } from "@/lib/importable/api";

export async function GET(request: Request) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ items: [] });
  }

  try {
    const items = await searchImportableItems(q);
    return NextResponse.json({ items });
  } catch (err) {
    const status = err instanceof ImportableApiError ? (err.status ?? 502) : 502;
    return NextResponse.json(
      { message: "Could not search tariff items" },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
