function htmlPage(title: string, heading: string, body: string, messageType?: string): string {
  const script = messageType
    ? `<script>
try {
  var msg = { type: ${JSON.stringify(messageType)} };
  if (window.opener) window.opener.postMessage(msg, window.location.origin);
} catch (e) {}
</script>`
    : "";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fafafa;font-family:system-ui,sans-serif;padding:24px;color:#3f3f46}
.card{width:100%;max-width:28rem;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;text-align:center}
.kicker{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#71717a}
h1{margin-top:12px;font-size:24px;color:#18181b}
p{margin-top:12px;font-size:14px;line-height:1.5;color:#52525b}
</style></head>
<body><div class="card">
<p class="kicker">A.M.T Imports</p>
<h1>${heading}</h1>
<p>${body}</p>
</div>${script}</body></html>`;
}

export function cngSuccessHtml(): string {
  return htmlPage(
    "Payment submitted",
    "Payment submitted",
    "You can close this window. Confirmation on your invoice may take a moment.",
    "cng-payment-success"
  );
}

export function cngCancelHtml(): string {
  return htmlPage(
    "Payment cancelled",
    "Payment cancelled",
    "No charge was made. You can close this window or try again from your invoice.",
    "cng-payment-cancel"
  );
}

export function cngErrorHtml(reason?: string): string {
  const detail =
    reason === "unknown_order"
      ? "We could not find this checkout. Return to your invoice and try Pay Now again."
      : "Something went wrong starting checkout. Return to your invoice and try again.";
  return htmlPage("Checkout error", "Checkout error", detail);
}

export function cngHtmlResponse(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
