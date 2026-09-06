/**
 * Formateador Centralizado de Monedas
 * Mantiene consistencia visual y soporte para pesos argentinos, dólares, euros, etc.
 * Blindado contra NaN, null y valores indefinidos.
 */
import { BRANDING } from "@/constants/branding";

export function formatCurrency(
  amount: number,
  currency: string = BRANDING.defaultCurrency,
  locale: string = BRANDING.defaultLocale
): string {
  const safeAmount = typeof amount === "number" && !isNaN(amount) && Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    // Fallback simple si la moneda no es estándar
    return `$ ${safeAmount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
}

export function formatPercentage(value: number): string {
  const safeValue = typeof value === "number" && !isNaN(value) && Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(1)}%`;
}
