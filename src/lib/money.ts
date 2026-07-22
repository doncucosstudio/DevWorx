export function formatCents(cents: number, currencySymbol = "$"): string {
  return `${currencySymbol}${(cents / 100).toFixed(2)}`;
}

export function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}
