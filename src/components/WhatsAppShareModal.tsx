import { useState } from 'react';
import { Send, Copy, Check, X, Phone, MessageSquare, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { WhatsAppOrderData, formatWhatsAppMessage, openWhatsAppShare } from '../utils/whatsapp';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: WhatsAppOrderData;
  onOpenReceiptImage: () => void;
}

export function WhatsAppShareModal({
  isOpen,
  onClose,
  orderData,
  onOpenReceiptImage,
}: WhatsAppShareModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formattedMessage = formatWhatsAppMessage(orderData);

  const handleSend = () => {
    openWhatsAppShare(formattedMessage, phoneNumber);
    onClose();
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(formattedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-500 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Отправка в WhatsApp</h3>
              <p className="text-xs text-emerald-100">Быстрая отправка заказа</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800">
          
          {/* Phone Number Input (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Номер телефона получателя (необязательно):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+374 91 123456 или оставьте пустым"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Если номер не указан, WhatsApp предложит выбрать контакт из списка.
            </p>
          </div>

          {/* Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">
                  Текст сообщения:
                </label>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                  микро-шрифт (-70%)
                </span>
              </div>
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Скопировано!' : 'Копировать текст'}</span>
              </button>
            </div>
            <div
              style={{ fontSize: '3.68px', lineHeight: '1.15' }}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono whitespace-pre-wrap max-h-48 overflow-y-auto text-slate-700 select-all tracking-tight"
            >
              {formattedMessage}
            </div>
          </div>

          {/* Picture option hint */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Хотите отправить красивую картинку чека?</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenReceiptImage();
              }}
              className="font-bold text-emerald-700 hover:underline shrink-0 ml-2"
            >
              Открыть фото
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors border border-slate-200"
          >
            Отмена
          </button>
          
          <button
            onClick={handleSend}
            className="flex-[2] flex items-center justify-center gap-2 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-xs transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Открыть в WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
}
