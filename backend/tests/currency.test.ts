import { describe, expect, it } from 'vitest';
import { fromMinor, toMinor, toUsdMinor } from '../src/currency';

describe('currency', () => {
  it('converts to minor units without float drift', () => {
    expect(toMinor(19.99)).toBe(1999);
    expect(toMinor(0.1 + 0.2)).toBe(30);
  });
  it('converts back from minor units', () => expect(fromMinor(1999)).toBe(19.99));
  it('keeps USD unchanged', () => expect(toUsdMinor(123456, 'USD')).toBe(123456));
  it('converts INR to USD using the static rate', () => {
    expect(toUsdMinor(toMinor(1_200_000), 'INR')).toBe(toMinor(14_400));
  });
  it('throws for unsupported currency', () => expect(() => toUsdMinor(100, 'XYZ')).toThrow());
});
