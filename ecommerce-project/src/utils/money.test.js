

import { it, expect } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('should format money correctly', () => {
    expect(formatMoney(12345)).toBe('$123.45');
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(1000)).toBe('$10.00');
  });
});

