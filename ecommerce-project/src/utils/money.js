export function formatMoney(amountCents) {
  return `$${((amountCents || 0) / 100).toFixed(2)}`;
}