import { cngErrorHtml, cngHtmlResponse } from "@/lib/cng-return-html";

export const dynamic = "force-dynamic";

function respond(request: Request) {
  const reason = new URL(request.url).searchParams.get("reason") ?? undefined;
  return cngHtmlResponse(cngErrorHtml(reason));
}

export function GET(request: Request) {
  return respond(request);
}

export function POST(request: Request) {
  return respond(request);
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
