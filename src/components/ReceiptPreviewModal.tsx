import { useEffect, useRef, useState } from 'react';
import { Download, Copy, Share2, Check, X, Printer, Image as ImageIcon, Cloud } from 'lucide-react';
import { generateReceiptCanvas, generateReceiptBlob, downloadReceiptImage, copyReceiptImageToClipboard, shareReceiptViaWebShare, ReceiptData } from '../utils/imageGenerator';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData;
  onOpenGoogleDrive?: () => void;
}

export function ReceiptPreviewModal({ isOpen, onClose, data, onOpenGoogleDrive }: ReceiptPreviewModalProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    try {
      const canvas = generateReceiptCanvas(data);
      const dataUrl = canvas.toDataURL('image/png');
      setImageSrc(dataUrl);
    } catch (err) {
      console.error('Failed to generate preview canvas:', err);
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    const success = await copyReceiptImageToClipboard(data);
    if (success) {
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2500);
    } else {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReceiptImage(data);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const handleWebShare = async () => {
    const shared = await shareReceiptViaWebShare(data);
    if (!shared) {
      // If web share unsupported or cancelled, fallback to download
      await handleDownload();
    }
  };

  const handlePrint = () => {
    if (!imageSrc) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Печать заказа ${data.orderNumber}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; padding: 20px; font-family: sans-serif; }
            img { max-width: 100%; height: auto; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <img src="${imageSrc}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Изображение заказа</h3>
              <p className="text-xs text-slate-500">Готово для отправки клиенту</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center items-center">
          {imageSrc ? (
            <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200/80 max-w-full">
              <img
                src={imageSrc}
                alt="Order Receipt"
                className="w-full h-auto max-h-[52vh] object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="py-12 text-slate-400 text-sm">Генерация изображения...</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col gap-2.5">
          {copyError && (
            <div className="p-2 text-xs text-amber-800 bg-amber-50 rounded-lg border border-amber-200 text-center">
              Не удалось скопировать в буфер. Используйте «Скачать PNG».
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Сохранение...' : 'Скачать PNG'}</span>
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-xl border transition-all ${
                copied
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 active:scale-[0.98]'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleWebShare}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Поделиться</span>
            </button>

            {onOpenGoogleDrive && (
              <button
                onClick={onOpenGoogleDrive}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                title="Сохранить в Google Drive"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Drive</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Распечатать"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Печать</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
