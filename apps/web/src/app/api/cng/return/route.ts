import { NextResponse } from "next/server";

function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Legacy CNG callback. Settlement happens on the public return pages. */
export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const status = (incoming.searchParams.get("STATUS") || "").toUpperCase();
  const target = new URL(
    status === "CANCELLED" ? "/cng/return/cancel" : "/cng/return/success",
    `${siteOrigin()}/`
  );
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return NextResponse.redirect(target);
}
