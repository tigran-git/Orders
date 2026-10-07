import { OrderLine } from '../types';
import { formatNumber, formatDate } from './format';

export interface WhatsAppOrderData {
  orderNumber: string;
  customerCode?: string;
  customerName?: string;
  lines: OrderLine[];
  total: number;
  notes?: string;
}

/**
 * Generates an elegant, structured WhatsApp message matching Russian business standards
 */
export function formatWhatsAppMessage(data: WhatsAppOrderData): string {
  const lines: string[] = [];

  if (data.customerCode) {
    lines.push(`Код: ${data.customerCode.trim()}`);
  }
  if (data.customerName) {
    lines.push(`Покупатель: ${data.customerName.trim()}`);
  }
  if (data.customerCode || data.customerName) {
    lines.push('------------------------');
  }

  if (data.lines.length === 0) {
    lines.push('(Товары не добавлены)');
  } else {
    data.lines.forEach((line, index) => {
      // Prices without spaces in numbers and without AMD (e.g. 5000x2=10000)
      lines.push(
        `${index + 1}. ${line.productName} ${line.price}x${line.quantity}=${line.total}`
      );
    });
  }

  lines.push('------------------------');
  // Spaces only in total (e.g. 15 000 AMD)
  lines.push(`ИТОГО: ${formatNumber(data.total)} AMD`);

  if (data.notes && data.notes.trim()) {
    lines.push('------------------------');
    lines.push(`Примечание: ${data.notes.trim()}`);
  }

  // Wrapping in WhatsApp triple backticks renders the smaller monospace font in WhatsApp
  const content = lines.join('\n');
  return `\`\`\`\n${content}\n\`\`\``;
}

/**
 * Builds direct WhatsApp URL.
 * If phone is provided, opens chat with that number, else opens WhatsApp contact chooser.
 */
export function getWhatsAppShareUrl(message: string, phoneNumber?: string): string {
  const cleanedPhone = phoneNumber?.replace(/[^\d+]/g, '').replace(/^\+/, '');
  const encodedText = encodeURIComponent(message);

  if (cleanedPhone) {
    return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Direct open WhatsApp
 */
export function openWhatsAppShare(message: string, phoneNumber?: string): void {
  const url = getWhatsAppShareUrl(message, phoneNumber);
  window.open(url, '_blank', 'noopener,noreferrer');
}
