import { cngCancelHtml, cngHtmlResponse } from "@/lib/cng-return-html";

export const dynamic = "force-dynamic";

function respond() {
  return cngHtmlResponse(cngCancelHtml());
}

export function GET() {
  return respond();
}

export function POST() {
  return respond();
}

export function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
