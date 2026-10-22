import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CURRENCIES, type CurrencyCode } from '@/types/procurement';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with internationalization and optional currency conversion
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'INR',
  showCents: boolean = false
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }

  const config = CURRENCIES[currencyCode] || CURRENCIES.INR;
  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    }).format(amount);
  } catch (e) {
    // Fallback if Intl format fails
    return `${config.symbol}${amount.toLocaleString(locale, {
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    })}`;
  }
}

/**
 * Convert an amount from USD base to a target currency
 */
export function convertCurrency(
  amountInUSD: number,
  targetCurrency: CurrencyCode
): number {
  const targetConfig = CURRENCIES[targetCurrency] || CURRENCIES.USD;
  return amountInUSD * targetConfig.rateAgainstUSD;
}

/**
 * Format date nicely (e.g. "Oct 14, 2026")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
}

/**
 * Format percentage with positive/negative symbol
 */
export function formatPercentage(pct: number, includeSign: boolean = true): string {
  if (isNaN(pct) || pct === null || pct === undefined) return '0.0%';
  const prefix = includeSign && pct > 0 ? '+' : '';
  return `${prefix}${pct.toFixed(1)}%`;
}

/**
 * Format large numbers in compact human-readable form (e.g. $1.2M, 45.2K)
 */
export function formatCompactNumber(amount: number): string {
  if (isNaN(amount) || amount === null) return '0';
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toLocaleString('en-US');
}

/**
 * Generate a unique ID (works without uuid library)
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
