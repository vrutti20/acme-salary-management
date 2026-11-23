import { FX_TO_USD } from './config';

/** Money is stored as integer minor units (cents/paise) to avoid float rounding errors. */
export const toMinor = (amount: number): number => Math.round(amount * 100);
export const fromMinor = (minor: number): number => minor / 100;

export function toUsdMinor(minor: number, currency: string): number {
  const rate = FX_TO_USD[currency];
  if (rate === undefined) throw new Error(`Unsupported currency: ${currency}`);
  return Math.round(minor * rate);
}
