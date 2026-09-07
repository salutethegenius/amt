export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  if (next.includes("://")) return null;
  return next;
}

export function postLoginPath(role: string | undefined, next: string | null | undefined): string {
  const path = safeNextPath(next);
  if (role === "admin") {
    const invoiceMatch = path?.match(/^\/portal\/invoices\/([^/]+)$/);
    if (invoiceMatch) return `/dashboard/invoices/${invoiceMatch[1]}`;
    if (path?.startsWith("/dashboard")) return path;
    return "/dashboard";
  }
  if (path?.startsWith("/portal")) return path;
  return "/portal";
}
