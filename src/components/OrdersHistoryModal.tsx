import { useState } from 'react';
import { History, X, Trash2, ArrowUpRight, Share2, Image as ImageIcon, Calendar, User, Hash, Cloud } from 'lucide-react';
import { SavedOrder } from '../types';
import { formatNumber, formatDate } from '../utils/format';

interface OrdersHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: SavedOrder[];
  onLoadOrder: (order: SavedOrder) => void;
  onDeleteOrder: (id: string) => void;
  onClearAll: () => void;
  onShareWhatsApp: (order: SavedOrder) => void;
  onOpenReceipt: (order: SavedOrder) => void;
  onOpenGoogleDrive?: () => void;
}

export function OrdersHistoryModal({
  isOpen,
  onClose,
  orders,
  onLoadOrder,
  onDeleteOrder,
  onClearAll,
  onShareWhatsApp,
  onOpenReceipt,
  onOpenGoogleDrive,
}: OrdersHistoryModalProps) {
  const [selectedOrder, setSelectedOrder] = useState<SavedOrder | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">История сохраненных заказов</h3>
              <p className="text-xs text-slate-500">
                Всего заказов: {orders.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {orders.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <History className="w-12 h-12 mx-auto stroke-[1.5] mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">История заказов пуста</p>
              <p className="text-xs text-slate-400 mt-1">Оформите и сохраните заказ, чтобы он появился здесь.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Список заказов
                </span>
                <div className="flex items-center gap-3">
                  {onOpenGoogleDrive && (
                    <button
                      onClick={onOpenGoogleDrive}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      Google Drive
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onClearAll();
                    }}
                    className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Очистить всё
                  </button>
                </div>
              </div>

              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerName || 'Покупатель без имени'}</span>
                      {order.customerCode && (
                        <span className="text-xs font-mono text-slate-500">
                          ({order.customerCode})
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      Товаров: {order.lines.length} шт. •{' '}
                      <span className="font-bold text-emerald-700 font-mono">
                        {formatNumber(order.total)} AMD
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:self-center shrink-0">
                    <button
                      onClick={() => onShareWhatsApp(order)}
                      className="p-2 text-emerald-600 hover:bg-emerald-100/60 rounded-lg transition-colors border border-emerald-200"
                      title="WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onOpenReceipt(order)}
                      className="p-2 text-blue-600 hover:bg-blue-100/60 rounded-lg transition-colors border border-blue-200"
                      title="Изображение чека"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onLoadOrder(order);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                      title="Загрузить в редактор"
                    >
                      <span>Открыть</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Удалить из истории"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl transition-all"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
