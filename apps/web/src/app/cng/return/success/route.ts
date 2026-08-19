import { cngHtmlResponse, cngSuccessHtml } from "@/lib/cng-return-html";

export const dynamic = "force-dynamic";

function respond() {
  return cngHtmlResponse(cngSuccessHtml());
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
    headers: { "Cache-Control": "no-store" },
  });
}
