/**
 * Formateador Centralizado de Monedas
 * Mantiene consistencia visual y soporte para pesos argentinos, dólares, euros, etc.
 */
import { BRANDING } from "@/constants/branding";

export function formatCurrency(
  amount: number,
  currency: string = BRANDING.defaultCurrency,
  locale: string = BRANDING.defaultLocale
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback simple si la moneda no es estándar
    return `$ ${amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
