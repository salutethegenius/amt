import { randomBytes } from "crypto";

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

  let decodedKey = apiKey;
  if (/%[0-9A-Fa-f]{2}/.test(apiKey)) {
    try {
      decodedKey = decodeURIComponent(apiKey);
    } catch {
      decodedKey = apiKey;
    }
  }

  return { merchantId, apiKey: decodedKey, baseUrl };
}

/** Public HTTPS origin Paylanes can reach after signature. Never localhost. */
export function publicOriginFromRequest(request: Request): string {
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(",")[0]
    .trim();

  if (host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) {
    return `https://${host}`;
  }

  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (envUrl && /^https:\/\//i.test(envUrl) && !/localhost|127\.0\.0\.1/i.test(envUrl)) {
    return envUrl;
  }

  throw new Error(
    "Cash N' Go needs a public HTTPS return URL. Open Pay Now from the live HTTPS site, not localhost."
  );
}

/** Unique per Pay click, like Calabash. Invoice number is the prefix before `__`. */
export function makeCngOrderNumber(invoiceNumber: string): string {
  return `${invoiceNumber}__${Date.now()}__${randomBytes(4).toString("hex")}`;
}

export function invoiceNumberFromCngOrderNumber(orderNumber: string): string {
  const idx = orderNumber.indexOf("__");
  return idx === -1 ? orderNumber : orderNumber.slice(0, idx);
}

export function buildPaymentPageUrl(input: {
  amountCents: number;
  orderNumber: string;
  siteUrl: string;
}): string {
  const { merchantId, apiKey, baseUrl } = getCngConfig();
  const origin = input.siteUrl.replace(/\/$/, "");
  const url = new URL(`${baseUrl}/merchant/web-payment/auth`);
  url.searchParams.set("API_KEY", apiKey);
  url.searchParams.set("AUTH_ID", merchantId);
  url.searchParams.set("AMOUNT", formatCngAmount(input.amountCents));
  url.searchParams.set("URL_SUCCESS", `${origin}/cng/return/success`);
  url.searchParams.set("URL_CANCEL", `${origin}/cng/return/cancel`);
  url.searchParams.set("ORDER_NUMBER", input.orderNumber);
  url.searchParams.set("PAYMENT_OPTIONS", "card");
  return url.toString();
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
