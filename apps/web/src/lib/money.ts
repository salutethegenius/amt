export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Parse a dollar string (e.g. "12.34") into cents without floating-point drift. */
export function parseDollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;

  const dollars = parseInt(match[1], 10);
  const centsPart = match[2] ?? "0";
  const cents = parseInt(centsPart.padEnd(2, "0"), 10);

  return dollars * 100 + cents;
}

export function toDollarsString(cents: number): string {
  return (cents / 100).toFixed(2);
}
