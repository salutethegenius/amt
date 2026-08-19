
export const CNG_MIN_AMOUNT_CENTS = 101;

export type CngTransaction = {
  amount: number;
  processed: number | boolean;
  specialId?: string | null;
  webOrderNumber?: string | null;
  webPassphrase?: string | null;
  cardType?: string | null;
  platformId?: string | null;
};

export function formatCngAmount(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

export function cngAmountToCents(amount: number | string): number {
  return Math.round(Number(amount) * 100);
}

export function isTransactionProcessed(tx: CngTransaction): boolean {
  return tx.processed === 1 || tx.processed === true;
}

export function getCngConfig() {
  const merchantId = process.env.CNG_MERCHANT_ID;
  const apiKey = process.env.CNG_API_KEY;
  const baseUrl = (process.env.CNG_BASE_URL || "https://paylanes.sprocket.solutions").replace(
    /\/$/,
    ""
  );

  if (!merchantId || !apiKey) {
    throw new Error("Missing CNG_MERCHANT_ID or CNG_API_KEY");
  }

  return { merchantId, apiKey, baseUrl };
}

/** Public HTTPS origin Paylanes can reach after signature. Never localhost. */
export function publicOriginFromRequest(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (envUrl && /^https:\/\//i.test(envUrl) && !/localhost|127\.0\.0\.1/i.test(envUrl)) {
    return envUrl;
  }

  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(",")[0]
    .trim();

  if (host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) {
    return `https://${host}`;
  }

  throw new Error(
    "Cash N' Go needs a public HTTPS return URL. Set NEXT_PUBLIC_SITE_URL to the Vercel preview URL (https://....vercel.app)."
  );
}

function encodeCngQueryValue(key: string, value: string): string {
  const encoded = encodeURIComponent(value);
  if (key === "API_KEY") {
    return encoded.replace(/%2B/gi, "+").replace(/%2F/gi, "/").replace(/%3D/gi, "=");
  }
  if (key === "URL_SUCCESS" || key === "URL_CANCEL") {
    return encoded.replace(/%3A/gi, ":").replace(/%2F/gi, "/");
  }
  return encoded;
}

export function buildPaymentPageUrl(input: {
  amountCents: number;
  orderNumber: string;
  siteUrl: string;
}): string {
  const { merchantId, apiKey, baseUrl } = getCngConfig();
  const origin = input.siteUrl.replace(/\/$/, "");
  const pairs: [string, string][] = [
    ["API_KEY", apiKey],
    ["AUTH_ID", merchantId],
    ["AMOUNT", formatCngAmount(input.amountCents)],
    ["URL_SUCCESS", `${origin}/cng/return/success`],
    ["URL_CANCEL", `${origin}/cng/return/cancel`],
    ["ORDER_NUMBER", input.orderNumber],
    ["PAYMENT_OPTIONS", "card"],
  ];
  const query = pairs.map(([key, value]) => `${key}=${encodeCngQueryValue(key, value)}`).join("&");
  return `${baseUrl}/merchant/web-payment/auth?${query}`;
}

export async function fetchTransactionInfo(lookup: {
  paymentId?: string | null;
  orderNumber?: string | null;
}): Promise<CngTransaction | null> {
  const { merchantId, apiKey, baseUrl } = getCngConfig();
  const url = new URL(`${baseUrl}/merchant/web-payment/transaction-info`);
  url.searchParams.set("AUTH_ID", merchantId);

  if (lookup.paymentId) {
    url.searchParams.set("PAYMENT_ID", lookup.paymentId);
  } else if (lookup.orderNumber) {
    url.searchParams.set("ORDER_NUMBER", lookup.orderNumber);
  } else {
    return null;
  }

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      API_KEY: apiKey,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    console.error("CNG transaction-info HTTP error:", res.status);
    return null;
  }

  const body = (await res.json()) as {
    success?: boolean;
    transaction?: CngTransaction;
  };

  if (!body.success || !body.transaction) {
    return null;
  }

  return body.transaction;
}
