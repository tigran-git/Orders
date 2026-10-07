/**
 * Matches Android Kotlin formatNumber implementation:
 * Formats integer values with space as thousand separator (e.g. 12 000).
 */
export function formatNumber(value: number): string {
  const val = Number(value || 0);
  if (Number.isInteger(val)) {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  // Decimal value (e.g. 363.6)
  const fixed = Number(val.toFixed(2)).toString();
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

export function formatAmd(value: number): string {
  return `${formatNumber(value)} AMD`;
}

export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}${month}${day}-${random}`;
}

export function formatDate(isoOrDate: string | Date = new Date()): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
