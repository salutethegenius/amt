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

export function generatePassphrase(): string {
  return randomBytes(16).toString("hex");
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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

  if (!merchantId || !apiKey) {
    throw new Error("Missing CNG_MERCHANT_ID or CNG_API_KEY");
  }

  return { merchantId, apiKey, baseUrl, siteUrl };
}

export function buildPaymentPageUrl(input: {
  amountCents: number;
  orderNumber: string;
  passphrase: string;
}): string {
  const { merchantId, baseUrl, siteUrl } = getCngConfig();
  const returnUrl = `${siteUrl}/api/cng/return`;
  const url = new URL(`${baseUrl}/merchant/web-payment/auth`);
  url.searchParams.set("AUTH_ID", merchantId);
  url.searchParams.set("AMOUNT", formatCngAmount(input.amountCents));
  url.searchParams.set("URL_SUCCESS", returnUrl);
  url.searchParams.set("URL_CANCEL", returnUrl);
  url.searchParams.set("ORDER_NUMBER", input.orderNumber);
  url.searchParams.set("PASSPHRASE", input.passphrase);
  url.searchParams.set("PAYMENT_METHOD", "card");
  return url.toString();
}

export async function fetchTransactionInfo(lookup: {
  paymentId?: string | null;
  orderNumber?: string | null;
}): Promise<CngTransaction | null> {
  const { merchantId, apiKey, baseUrl } = getCngConfig();
  const url = new URL(`${baseUrl}/merchant/web-payment/transaction-info`);
  url.searchParams.set("AUTH_ID", merchantId);
  url.searchParams.set("API_KEY", apiKey);

  if (lookup.paymentId) {
    url.searchParams.set("PAYMENT_ID", lookup.paymentId);
  } else if (lookup.orderNumber) {
    url.searchParams.set("ORDER_NUMBER", lookup.orderNumber);
  } else {
    return null;
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
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
