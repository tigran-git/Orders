import { OrderLine } from '../types';
import { formatNumber, formatDate } from './format';

export interface ReceiptData {
  orderNumber: string;
  date: string;
  customerCode?: string;
  customerName?: string;
  lines: OrderLine[];
  total: number;
  notes?: string;
}

/**
 * Generates a high-resolution, beautifully formatted receipt image on a canvas.
 * Exactly corresponds to Android's `shareOrderAsImage` bitmap generation.
 */
export function generateReceiptCanvas(data: ReceiptData): HTMLCanvasElement {
  const scale = 2; // Retina 2x scale for crystal-sharp text
  const width = 640;
  
  // Calculate dynamic height based on lines count
  const headerHeight = 180;
  const customerHeight = (data.customerCode || data.customerName) ? 75 : 0;
  const linesHeight = Math.max(1, data.lines.length) * 44 + 50;
  const summaryHeight = 130;
  const footerHeight = 70;
  const totalHeight = headerHeight + customerHeight + linesHeight + summaryHeight + footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);

  // Background - Clean paper receipt look with slight modern gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, totalHeight);
  bgGrad.addColorStop(0, '#FFFFFF');
  bgGrad.addColorStop(1, '#F8FAFC');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, totalHeight);

  // Top accent bar (Emerald green)
  ctx.fillStyle = '#059669'; // Emerald 600
  ctx.fillRect(0, 0, width, 8);

  // Outer border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, totalHeight);

  let currentY = 36;

  // Header Title
  ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'left';
  ctx.fillText('ORDERS', 32, currentY);

  // Badge / Tag
  ctx.fillStyle = '#ECFDF5';
  ctx.beginPath();
  ctx.roundRect(width - 150, currentY - 20, 118, 28, [14]);
  ctx.fill();
  ctx.fillStyle = '#059669';
  ctx.font = '700 12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ЗАКАЗ КЛИЕНТА', width - 91, currentY - 2);

  currentY += 26;

  // Order Number & Date
  ctx.textAlign = 'left';
  ctx.font = '600 14px "JetBrains Mono", monospace, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(`№ ${data.orderNumber}`, 32, currentY);

  ctx.font = '400 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.textAlign = 'right';
  ctx.fillText(data.date || formatDate(), width - 32, currentY);

  currentY += 24;

  // Divider
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, currentY);
  ctx.lineTo(width - 32, currentY);
  ctx.stroke();

  currentY += 20;

  // Customer Information Box (if customer code or name exists)
  if (data.customerCode || data.customerName) {
    const boxHeight = 56;
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.roundRect(32, currentY, width - 64, boxHeight, [8]);
    ctx.fill();

    // Customer Name
    ctx.textAlign = 'left';
    ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('ПОКУПАТЕЛЬ', 48, currentY + 22);

    ctx.font = '700 15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#0F172A';
    const custName = data.customerName?.trim() || 'Без имени';
    ctx.fillText(custName, 48, currentY + 42);

    // Customer Code
    if (data.customerCode?.trim()) {
      ctx.textAlign = 'right';
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('КОД КЛИЕНТА', width - 48, currentY + 22);

      ctx.font = '700 14px "JetBrains Mono", monospace, sans-serif';
      ctx.fillStyle = '#2563EB';
      ctx.fillText(data.customerCode.trim(), width - 48, currentY + 42);
    }

    currentY += boxHeight + 20;
  }

  // Section Header: Items
  ctx.textAlign = 'left';
  ctx.font = '700 14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#0F172A';
  ctx.fillText('СОСТАВ ЗАКАЗА', 32, currentY);

  ctx.textAlign = 'right';
  ctx.font = '500 12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText(`Позиций: ${data.lines.length}`, width - 32, currentY);

  currentY += 14;

  // Table header line
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, currentY);
  ctx.lineTo(width - 32, currentY);
  ctx.stroke();

  currentY += 16;

  // Order Lines
  if (data.lines.length === 0) {
    ctx.textAlign = 'center';
    ctx.font = ' italic 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('В заказе нет товаров', width / 2, currentY + 20);
    currentY += 40;
  } else {
    data.lines.forEach((line, index) => {
      // Row alternate background subtle
      if (index % 2 === 1) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(32, currentY - 14, width - 64, 40);
      }

      // Line number & Item name
      ctx.textAlign = 'left';
      ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#1E293B';
      const itemTitle = `${index + 1}. ${line.productName}`;
      ctx.fillText(itemTitle, 40, currentY);

      // Price × Quantity subtitle
      ctx.font = '400 12px "JetBrains Mono", monospace, sans-serif';
      ctx.fillStyle = '#64748B';
      const calculation = `${line.price} × ${line.quantity}`;
      ctx.fillText(calculation, 40, currentY + 16);

      // Total for line
      ctx.textAlign = 'right';
      ctx.font = '700 14px "JetBrains Mono", monospace, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(`${line.total}`, width - 40, currentY + 8);

      currentY += 44;
    });
  }

  currentY += 10;

  // Divider before Total
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(32, currentY);
  ctx.lineTo(width - 32, currentY);
  ctx.stroke();
  ctx.setLineDash([]); // reset dash

  currentY += 24;

  // Total Card
  const totalBoxHeight = 64;
  ctx.fillStyle = '#064E3B'; // Dark rich emerald
  ctx.beginPath();
  ctx.roundRect(32, currentY, width - 64, totalBoxHeight, [10]);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.font = '700 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#A7F3D0';
  ctx.fillText('ИТОГО К ОПЛАТЕ:', 52, currentY + 38);

  ctx.textAlign = 'right';
  ctx.font = '800 22px "JetBrains Mono", monospace, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`${formatNumber(data.total)} AMD`, width - 52, currentY + 39);

  currentY += totalBoxHeight + 24;

  // Footer notes & watermark
  ctx.textAlign = 'center';
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Сформировано в приложении Orders • Расчет в AMD (Армянский драм)', width / 2, currentY + 8);

  return canvas;
}

/**
 * Returns a Blob (PNG) of the rendered receipt
 */
export async function generateReceiptBlob(data: ReceiptData): Promise<Blob> {
  const canvas = generateReceiptCanvas(data);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png', 1.0);
  });
}

/**
 * Triggers a download of the receipt image matching the Android file name format:
 * `order_${Date.now()}.png`
 */
export async function downloadReceiptImage(data: ReceiptData): Promise<string> {
  const blob = await generateReceiptBlob(data);
  const url = URL.createObjectURL(blob);
  const filename = `order_${Date.now()}.png`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return filename;
}

/**
 * Copies the receipt image to clipboard as PNG so the user can paste directly into WhatsApp
 */
export async function copyReceiptImageToClipboard(data: ReceiptData): Promise<boolean> {
  try {
    const blob = await generateReceiptBlob(data);
    if (!navigator.clipboard || !window.ClipboardItem) {
      return false;
    }
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return true;
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return false;
  }
}

/**
 * Native share if available (matches Android's Intent.ACTION_SEND with image)
 */
export async function shareReceiptViaWebShare(data: ReceiptData): Promise<boolean> {
  try {
    const blob = await generateReceiptBlob(data);
    const filename = `order_${Date.now()}.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Заказ ${data.orderNumber}`,
        text: `Заказ для ${data.customerName || 'покупателя'} на сумму ${formatNumber(data.total)} AMD`,
        files: [file],
      });
      return true;
    }
  } catch (err) {
    // User cancelled or share failed
    if ((err as Error)?.name !== 'AbortError') {
      console.warn('Web Share API error:', err);
    }
  }
  return false;
}
