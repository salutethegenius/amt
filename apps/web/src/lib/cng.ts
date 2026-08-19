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
  const { merchantId, apiKey, baseUrl, siteUrl } = getCngConfig();
  const successUrl = `${siteUrl}/cng/return/success`;
  const cancelUrl = `${siteUrl}/cng/return/cancel`;

  const urlParams = new URLSearchParams();
  urlParams.set("AUTH_ID", merchantId);
  urlParams.set("AMOUNT", formatCngAmount(input.amountCents));
  urlParams.set("URL_SUCCESS", successUrl);
  urlParams.set("URL_CANCEL", cancelUrl);
  urlParams.set("ORDER_NUMBER", input.orderNumber);
  urlParams.set("PASSPHRASE", input.passphrase);
  urlParams.set("PAYMENT_OPTIONS", "card");

  // Calabash / KemisPay: hosted checkout GET must include API_KEY in the URL.
  // encodeURIComponent once — do not put an already-encoded key in env.
  return `${baseUrl}/merchant/web-payment/auth?API_KEY=${encodeURIComponent(apiKey)}&${urlParams.toString()}`;
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
