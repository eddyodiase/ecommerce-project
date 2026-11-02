const DEFAULT_CURRENCY = "NGN";
const DEFAULT_LOCALE = "en-NG";

/**
 * Converts numbers and numeric strings to a finite number, otherwise returns null.
 * @param {unknown} value
 * @returns {number | null}
 */
const toFiniteNumber = (value) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

/**
 * @typedef {Object} MoneyOptions
 * @property {string} [currency="NGN"] ISO 4217 currency code.
 * @property {string} [locale="en-NG"] BCP 47 locale tag.
 * @property {boolean} [hideZeroDecimals=false] Drop ".00" for whole numbers.
 * @property {boolean} [compact=false] Use compact notation for large values (e.g. ₦2.67M).
 * @property {string} [fallback] Returned for null, undefined, NaN or non-numeric input.
 *   Defaults to zero formatted with the same options (e.g. "₦0.00").
 */

const buildFormatter = (number, options) => {
  const {
    currency = DEFAULT_CURRENCY,
    locale = DEFAULT_LOCALE,
    hideZeroDecimals = false,
    compact = false,
  } = options;

  const formatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: compact || (hideZeroDecimals && Number.isInteger(number)) ? 0 : 2,
    maximumFractionDigits: 2,
  };

  if (compact) {
    formatOptions.notation = "compact";
    formatOptions.compactDisplay = "short";
  }

  return new Intl.NumberFormat(locale, formatOptions);
};

/**
 * Formats an amount (in major units, e.g. naira) as a currency string.
 *
 * @param {number | string | null | undefined} amount Number or numeric string such as "6671.75".
 * @param {MoneyOptions} [options]
 * @returns {string}
 *
 * @example formatMoney(6671.75);                                  // "₦6,671.75"
 * @example formatMoney("6671.75");                                // "₦6,671.75"
 * @example formatMoney(5000, { hideZeroDecimals: true });         // "₦5,000"
 * @example formatMoney(2668700, { compact: true });               // "₦2.67M"
 * @example formatMoney(null, { fallback: "N/A" });                // "N/A"
 * @example formatMoney(25, { currency: "USD", locale: "en-US" }); // "$25.00"
 */
export function formatMoney(amount, options = {}) {
  const number = toFiniteNumber(amount);

  if (number === null) {
    return options.fallback ?? buildFormatter(0, options).format(0);
  }

  return buildFormatter(number, options).format(number);
}

/**
 * Formats a price range as "min - max". Whole numbers drop ".00" unless
 * options.hideZeroDecimals is set to false.
 *
 * @param {number | string | null | undefined} min
 * @param {number | string | null | undefined} max
 * @param {MoneyOptions} [options] Same options as formatMoney.
 * @returns {string}
 *
 * @example formatPriceRange(6671.75, 2668700); // "₦6,671.75 - ₦2,668,700"
 */
export function formatPriceRange(min, max, options = {}) {
  const rangeOptions = { hideZeroDecimals: true, ...options };
  return `${formatMoney(min, rangeOptions)} - ${formatMoney(max, rangeOptions)}`;
}

/**
 * Formats an amount stored in minor units (kobo/cents), as the backend's priceCents values are.
 *
 * @param {number | string | null | undefined} amountCents
 * @param {MoneyOptions} [options]
 * @returns {string}
 */
export function toCurrency(amountCents, options = {}) {
  const number = toFiniteNumber(amountCents);
  return formatMoney(number === null ? null : number / 100, options);
}