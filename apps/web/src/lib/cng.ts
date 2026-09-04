import { randomBytes } from "crypto";
import { resolveCngBaseUrl } from "@/lib/cashango/endpoints";
import { toDollarsString } from "@/lib/money";

export const CNG_MIN_AMOUNT_CENTS = 101;

export const CNG_AUTH_ENDPOINT =
  "https://paylanes.sprocket.solutions/merchant/web-payment/auth";

export function getCngConfig() {
  const merchantId = process.env.CNG_MERCHANT_ID;
  const apiKey = process.env.CNG_API_KEY;
  const raw = (process.env.CNG_BASE_URL || CNG_AUTH_ENDPOINT).replace(/\/$/, "");
  const authEndpoint = raw.includes("/merchant/web-payment/auth")
    ? raw
    : `${raw}/merchant/web-payment/auth`;
  const baseUrl = resolveCngBaseUrl(authEndpoint);

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

  return { merchantId, apiKey: decodedKey, baseUrl, authEndpoint };
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

/** Unique per Pay click. Invoice number is the prefix before `__`. */
export function makeCngOrderNumber(invoiceNumber: string): string {
  return `${invoiceNumber}__${Date.now()}__${randomBytes(4).toString("hex")}`;
}

export function buildPaymentPageUrl(input: {
  amountCents: number;
  orderNumber: string;
  siteUrl: string;
}): string {
  const { merchantId, apiKey, authEndpoint } = getCngConfig();
  const origin = input.siteUrl.replace(/\/$/, "");
  const url = new URL(authEndpoint);
  url.searchParams.set("API_KEY", apiKey);
  url.searchParams.set("AUTH_ID", merchantId);
  url.searchParams.set("AMOUNT", toDollarsString(input.amountCents));
  url.searchParams.set("URL_SUCCESS", `${origin}/cng/return/success`);
  url.searchParams.set("URL_CANCEL", `${origin}/cng/return/cancel`);
  url.searchParams.set("ORDER_NUMBER", input.orderNumber);
  url.searchParams.set("PAYMENT_OPTIONS", "card");
  return url.toString();
}
