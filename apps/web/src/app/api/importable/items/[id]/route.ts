import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getImportableItem, ImportableApiError } from "@/lib/importable/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Missing item id" }, { status: 400 });
  }

  try {
    const item = await getImportableItem(id);
    return NextResponse.json({ item });
  } catch (err) {
    const status = err instanceof ImportableApiError ? (err.status ?? 502) : 502;
    return NextResponse.json(
      { message: "Could not load tariff item" },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
