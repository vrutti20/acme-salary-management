/** Fixed locale keeps output deterministic across machines (and tests). */
const LOCALE = 'en-US';

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export const formatUsd = (amount: number) => formatMoney(amount, 'USD');

export const formatNumber = (n: number) => new Intl.NumberFormat(LOCALE).format(n);

export function formatCompactUsd(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency', currency: 'USD', notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1,
  }).format(amount);
}
