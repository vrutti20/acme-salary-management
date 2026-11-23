import { describe, expect, it } from 'vitest';
import { formatCompactUsd, formatMoney, formatNumber, formatUsd } from '../src/utils/format';

describe('format', () => {
  it('formats USD without decimals', () => expect(formatUsd(105000)).toBe('$105,000'));
  it('formats other currencies with their symbol', () => {
    expect(formatMoney(1200000, 'INR')).toBe('₹1,200,000');
    expect(formatMoney(50000, 'EUR')).toBe('€50,000');
  });
  it('formats compact USD for chart axes', () => expect(formatCompactUsd(20000)).toBe('$20K'));
  it('formats plain numbers with separators', () => expect(formatNumber(10000)).toBe('10,000'));
});
