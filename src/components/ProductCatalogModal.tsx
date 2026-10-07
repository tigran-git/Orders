import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, RotateCcw, Package, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { formatNumber } from '../utils/format';
import { getProductTheme } from '../utils/theme';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
  onResetDefaults: () => void;
}

export function ProductCatalogModal({
  isOpen,
  onClose,
  products,
  onSaveProducts,
  onResetDefaults,
}: ProductCatalogModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // New product inputs
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    const priceNum = parseInt(newPrice.replace(/\s+/g, ''), 10);

    if (!trimmedName) {
      setError('Введите название товара');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Укажите корректную цену (больше 0)');
      return;
    }

    const newProd: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      price: priceNum,
    };

    onSaveProducts([...products, newProd]);
    setNewName('');
    setNewPrice('');
    setError('');
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(p.price.toString());
  };

  const saveEdit = (id: string) => {
    const trimmedName = editName.trim();
    const priceNum = parseInt(editPrice.replace(/\s+/g, ''), 10);

    if (!trimmedName || isNaN(priceNum) || priceNum <= 0) return;

    const updated = products.map((p) =>
      p.id === id ? { ...p, name: trimmedName, price: priceNum } : p
    );
    onSaveProducts(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (products.length <= 1) {
      setError('В каталоге должен оставаться хотя бы один товар');
      return;
    }
    onSaveProducts(products.filter((p) => p.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Каталог товаров</h3>
              <p className="text-xs text-slate-500">Управление справочником товаров и ценами</p>
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Add Product Form */}
          <form onSubmit={handleAddProduct} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              Добавить новый товар
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                type="text"
                placeholder="Название (например: Товар 4)"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (error) setError('');
                }}
                className="sm:col-span-7 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
              <div className="relative sm:col-span-5">
                <input
                  type="number"
                  placeholder="Цена (AMD)"
                  value={newPrice}
                  onChange={(e) => {
                    setNewPrice(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3.5 py-2.5 pr-14 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400 pointer-events-none">
                  AMD
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-medium text-sm rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Сохранить в каталог
            </button>
          </form>

          {/* List of Products */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Текущие товары ({products.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  onResetDefaults();
                }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Сброс по умолчанию
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {products.map((p) => {
                const isEditing = editingId === p.id;

                if (isEditing) {
                  return (
                    <div key={p.id} className="p-3 bg-emerald-50/50 flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-mono outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => saveEdit(p.id)}
                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          title="Сохранить"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                          title="Отмена"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                }

                const theme = getProductTheme(p.color || p.category);
                return (
                  <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${theme.dotColor}`}
                        />
                        <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                      </div>
                      <div className={`text-xs font-mono font-bold mt-0.5 ${theme.priceColor}`}>
                        {p.price} AMD
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl transition-all"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
