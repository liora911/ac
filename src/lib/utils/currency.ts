/**
 * Currency utilities for price formatting
 * Centralizes currency/price handling to ensure consistency
 */

export type SupportedCurrency = "ILS" | "USD";

/**
 * Currency symbols for supported currencies
 */
export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  ILS: "₪",
  USD: "$",
};

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: SupportedCurrency | string): string {
  return CURRENCY_SYMBOLS[currency as SupportedCurrency] || currency;
}

/**
 * Convert price from agorot (cents) to main currency unit
 */
export function agorotToShekels(priceInAgorot: number): number {
  return priceInAgorot / 100;
}

/**
 * Convert price from main currency unit to agorot (cents)
 */
export function shekelsToAgorot(priceInShekels: number): number {
  return Math.round(priceInShekels * 100);
}

/**
 * Format price from agorot to a full localized string (e.g., "₪49.00")
 * Uses Intl.NumberFormat for proper locale handling
 */
export function formatPrice(priceInAgorot: number, currency: SupportedCurrency | string = "ILS", locale = "he-IL"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(priceInAgorot / 100);
}

/**
 * Format price from agorot to a simple string with symbol (e.g., "₪49.00")
 * Simpler than formatPrice, doesn't use Intl formatting
 */
export function formatPriceSimple(priceInAgorot: number, currency: SupportedCurrency | string = "ILS"): string {
  const symbol = getCurrencySymbol(currency);
  const amount = (priceInAgorot / 100).toFixed(2);
  return `${symbol}${amount}`;
}

/**
 * Format price from agorot without decimal places for whole numbers (e.g., "₪49" or "₪49.50")
 */
export function formatPriceCompact(priceInAgorot: number, currency: SupportedCurrency | string = "ILS"): string {
  const symbol = getCurrencySymbol(currency);
  const amount = priceInAgorot / 100;
  // Show decimals only if there are any
  const formatted = amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
  return `${symbol}${formatted}`;
}

/**
 * Format a total price (quantity × unit price) from agorot
 */
export function formatTotalPrice(unitPriceInAgorot: number, quantity: number, currency: SupportedCurrency | string = "ILS"): string {
  const totalAgorot = unitPriceInAgorot * quantity;
  return formatPriceSimple(totalAgorot, currency);
}

/**
 * Check if an event/item is free (price is null, undefined, or 0)
 */
export function isFreePrice(price: number | null | undefined): boolean {
  return price === null || price === undefined || price === 0;
}

/**
 * Get display text for price (handles free events)
 */
export function getPriceDisplay(
  priceInAgorot: number | null | undefined,
  currency: SupportedCurrency | string = "ILS",
  freeText = "Free"
): string {
  if (isFreePrice(priceInAgorot)) {
    return freeText;
  }
  return formatPriceCompact(priceInAgorot!, currency);
}
