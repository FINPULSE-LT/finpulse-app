/**
 * Formateador Centralizado de Fechas
 * Soporte para fechas relativas ("Hoy", "Ayer") y fechas estructuradas en zona horaria local.
 * Blindado contra desfasajes UTC y fechas inválidas.
 */

export function getLocalDateString(d: Date | string = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(dateStringOrDate: string | Date): string {
  const date = typeof dateStringOrDate === "string" ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStringOrDate: string | Date): string {
  const date = typeof dateStringOrDate === "string" ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeDate(dateStringOrDate: string | Date): string {
  const date = typeof dateStringOrDate === "string" ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - targetDay.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays === -1) return "Mañana";
  if (diffDays > 1 && diffDays <= 7) return `Hace ${diffDays} días`;

  return formatDate(date);
}

export function getTodayISODate(): string {
  return getLocalDateString(new Date());
}
