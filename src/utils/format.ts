/**
 * Formats a coin price with a sensible number of decimals.
 * Bitcoin at 2 decimals reads fine; Shiba Inu at 2 decimals reads "$0.00".
 */
export function formatPrice(value: number): string {
  let digits = 2;
  if (value < 1) digits = 6;
  else if (value < 100) digits = 3;

  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Compact form for large figures, e.g. market cap: $1.81T. */
export function formatCompactUsd(value: number): string {
  return `$${value.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 2 })}`;
}
