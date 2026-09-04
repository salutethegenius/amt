export const CNG_ENDPOINTS = {
  qa: "https://paylanes-qa.sprocket.solutions/merchant/web-payment/auth",
  prod: "https://paylanes.sprocket.solutions/merchant/web-payment/auth",
} as const;

export const CNG_API_PATHS = {
  transactionInfo: "/merchant/web-payment/transaction-info",
  transactions: "/merchant/web-payment/transactions",
} as const;

/** Origin (and optional prefix) for Transaction API paths, derived from the auth endpoint. */
export function resolveCngBaseUrl(authEndpoint: string): string {
  const url = new URL(authEndpoint);
  url.pathname = url.pathname.replace(/\/merchant\/web-payment\/auth\/?$/, "");
  url.search = "";
  url.hash = "";
  const path = url.pathname.replace(/\/$/, "");
  return `${url.origin}${path === "/" ? "" : path}`;
}
