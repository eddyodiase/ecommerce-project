import { describe, expect, it } from 'vitest';
import { formatMoney, formatPriceRange, toCurrency } from './money';

describe('formatMoney', () => {
  it('formats NGN with two decimals by default', () => {
    expect(formatMoney(6671.75)).toBe('₦6,671.75');
    expect(formatMoney(0)).toBe('₦0.00');
    expect(formatMoney(1000)).toBe('₦1,000.00');
  });

  it('accepts numeric strings', () => {
    expect(formatMoney('6671.75')).toBe('₦6,671.75');
  });

  it('returns a fallback for null, undefined, NaN and non-numeric input', () => {
    [null, undefined, NaN, 'abc', '', Infinity, {}].forEach((value) => {
      expect(formatMoney(value)).toBe('₦0.00');
    });
    expect(formatMoney(null, { fallback: 'N/A' })).toBe('N/A');
  });

  it('can hide zero decimals for whole numbers only', () => {
    expect(formatMoney(5000, { hideZeroDecimals: true })).toBe('₦5,000');
    expect(formatMoney(5000.5, { hideZeroDecimals: true })).toBe('₦5,000.50');
  });

  it('supports compact notation', () => {
    expect(formatMoney(2668700, { compact: true })).toBe('₦2.67M');
  });

  it('allows overriding currency and locale', () => {
    expect(formatMoney(25, { currency: 'USD', locale: 'en-US' })).toBe('$25.00');
  });
});

describe('formatPriceRange', () => {
  it('formats a min - max range', () => {
    expect(formatPriceRange(6671.75, 2668700)).toBe('₦6,671.75 - ₦2,668,700');
  });
});

describe('toCurrency', () => {
  it('converts minor units to major units', () => {
    expect(toCurrency(667175)).toBe('₦6,671.75');
    expect(toCurrency(undefined)).toBe('₦0.00');
  });
});
