import { settleCngReturn } from "@/lib/cng-settle";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function settleFromUrl(request: Request) {
  const url = new URL(request.url);
  const result = await settleCngReturn({
    status: url.searchParams.get("STATUS"),
    orderNumber: url.searchParams.get("ORDER_NUMBER"),
    paymentId: url.searchParams.get("PAYMENT_ID"),
  });
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  try {
    return await settleFromUrl(request);
  } catch (error) {
    console.error("CNG settle error:", error);
    return NextResponse.json({ outcome: "error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
