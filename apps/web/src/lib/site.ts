export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (url && /^https?:\/\//i.test(url)) {
    return url;
  }
  return "https://amtimports.com";
}
