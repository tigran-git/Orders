/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Share2,
  Image as ImageIcon,
  RotateCcw,
  Package,
  History,
  Check,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  User,
  Hash,
  Coins,
  Copy,
  Download,
  Search,
  Smartphone,
  Cloud,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Product, OrderLine, SavedOrder } from './types';
import { formatNumber, generateOrderNumber, formatDate } from './utils/format';
import { ReceiptPreviewModal } from './components/ReceiptPreviewModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { ProductCatalogModal } from './components/ProductCatalogModal';
import { OrdersHistoryModal } from './components/OrdersHistoryModal';
import { InstallAppModal } from './components/InstallAppModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import {
  downloadReceiptImage,
  copyReceiptImageToClipboard,
  ReceiptData,
} from './utils/imageGenerator';
import { getProductTheme } from './utils/theme';

// 13 Products across 5 color categories
const INITIAL_PRODUCTS: Product[] = [
  // cvet1: Ջերկի
  { id: 'p1', name: 'Տավարի ջերկի', price: 700, color: 'cvet1', category: 'cvet1' },
  { id: 'p2', name: 'Խոզի ջերկի', price: 500, color: 'cvet1', category: 'cvet1' },
  { id: 'p3', name: 'Հավի ջերկի', price: 300, color: 'cvet1', category: 'cvet1' },

  // cvet2: Ականջ
  { id: 'p4', name: 'Ականջ կլ.', price: 380, color: 'cvet2', category: 'cvet2' },
  { id: 'p5', name: 'Ականջ կծու', price: 380, color: 'cvet2', category: 'cvet2' },

  // cvet3: Պանիր (🟢 Зеленая точка)
  { id: 'p6', name: 'Պանիր 80գ', price: 363, color: 'cvet3', category: 'cvet3' },
  { id: 'p7', name: 'Պանիր Կծիկ', price: 363, color: 'cvet3', category: 'cvet3' },
  { id: 'p8', name: 'Պանիր 40գ', price: 200, color: 'cvet3', category: 'cvet3' },
  { id: 'p13', name: 'Պանիր 100գ', price: 400, color: 'cvet3', category: 'cvet3' },

  // cvet4: Գետն. & Եգիպտացորեն
  { id: 'p9', name: 'Գետն. կլ.', price: 390, color: 'cvet4', category: 'cvet4' },
  { id: 'p10', name: 'Գետն. կծու', price: 390, color: 'cvet4', category: 'cvet4' },
  { id: 'p11', name: 'Եգիպտացորեն', price: 390, color: 'cvet4', category: 'cvet4' },

  // cvet5: Սիսեռ
  { id: 'p12', name: 'Սիսեռ', price: 150, color: 'cvet5', category: 'cvet5' },
];

export default function App() {
  // Products Catalog (versioned key ensures immediate loading of all 13 items)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('orders_products_v10');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.some((p: Product) => p.name === 'Տավարի ջերկի') &&
          parsed.some((p: Product) => p.name === 'Ականջ կլ.') &&
          parsed.some((p: Product) => p.name === 'Գետն. կլ.') &&
          parsed.some((p: Product) => p.name === 'Պանիր 100գ') &&
          parsed.some((p: Product) => p.name === 'Պանիր Կծիկ') &&
          parsed.some((p: Product) => p.name === 'Պանիր 80գ' && p.price === 363)
        ) {
          return parsed;
        }
      }
      localStorage.setItem('orders_products_v10', JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Current Order State (faithful to Android Compose variables)
  const [customerCode, setCustomerCode] = useState('');
  const [isCodeError, setIsCodeError] = useState(false);
  const customerCodeRef = useRef<HTMLInputElement>(null);
  const [customerName, setCustomerName] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [orderNumber, setOrderNumber] = useState(() => generateOrderNumber());
  const [notes, setNotes] = useState('');

  // Dropdown open state for ProductSelector
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const productMenuRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveUser, setDriveUser] = useState<FirebaseUser | null>(null);

  // Saved Orders History
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('orders_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Persist products
  useEffect(() => {
    try {
      localStorage.setItem('orders_products_v10', JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  // Persist order history
  useEffect(() => {
    try {
      localStorage.setItem('orders_history', JSON.stringify(savedOrders));
    } catch (e) {
      console.error(e);
    }
  }, [savedOrders]);

  // Click outside listener for product dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productMenuRef.current &&
        !productMenuRef.current.contains(event.target as Node)
      ) {
        setIsProductMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Total calculation: supports float numbers (e.g. 363.6 AMD)
  const total = Math.round(orderLines.reduce((acc, line) => acc + line.total, 0) * 100) / 100;

  // Validation for mandatory customer code
  const validateCustomerCode = (): boolean => {
    if (!customerCode.trim()) {
      setIsCodeError(true);
      showToast('Введите код клиента (обязательное поле)');
      customerCodeRef.current?.focus();
      return false;
    }
    return true;
  };

  // Handle adding product line
  const handleAddProduct = () => {
    if (!validateCustomerCode()) return;

    const p = parseFloat(price.replace(/\s+/g, '')) || 0;
    const q = parseInt(quantity.replace(/\s+/g, ''), 10) || 0;

    if (selectedProduct && p > 0 && q > 0) {
      const lineTotal = Math.round(p * q * 100) / 100;
      const newLine: OrderLine = {
        id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productName: selectedProduct.name,
        price: p,
        quantity: q,
        total: lineTotal,
        category: selectedProduct.category,
        color: selectedProduct.color,
      };

      setOrderLines((prev) => [...prev, newLine]);
      setSelectedProduct(null);
      setPrice('');
      setQuantity('1');
      setProductSearch('');
      showToast(`«${newLine.productName}» добавлен в заказ`);
    } else {
      showToast('Выберите товар и укажите цену и количество');
    }
  };

  // Delete line item (matches Android `it.removeAt(index)`)
  const handleDeleteLine = (index: number) => {
    const item = orderLines[index];
    setOrderLines((prev) => prev.filter((_, i) => i !== index));
    if (item) {
      showToast(`Удален «${item.productName}»`);
    }
  };

  // Modify quantity of existing line
  const handleUpdateLineQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleDeleteLine(index);
      return;
    }
    setOrderLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? {
              ...line,
              quantity: newQty,
              total: Math.round(line.price * newQty * 100) / 100,
            }
          : line
      )
    );
  };

  // Reset order: exactly matches Android "Новый заказ" button (no blocked confirm dialogs)
  const handleNewOrder = () => {
    setCustomerCode('');
    setIsCodeError(false);
    setCustomerName('');
    setSelectedProduct(null);
    setPrice('');
    setQuantity('1');
    setOrderLines([]);
    setOrderNumber(generateOrderNumber());
    setNotes('');
    setProductSearch('');
    setIsProductMenuOpen(false);
    showToast('Новый заказ открыт');
  };

  // Save current order into history
  const handleSaveToHistory = () => {
    if (!validateCustomerCode()) return;
    if (orderLines.length === 0) {
      showToast('Добавьте хотя бы один товар в заказ');
      return;
    }

    const orderToSave: SavedOrder = {
      id: `ord_${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      customerCode,
      customerName,
      lines: [...orderLines],
      total,
      notes,
    };

    setSavedOrders((prev) => [orderToSave, ...prev]);
    showToast('Заказ сохранен в историю');
  };

  // Load order from history
  const handleLoadOrder = (order: SavedOrder) => {
    setCustomerCode(order.customerCode || '');
    setIsCodeError(false);
    setCustomerName(order.customerName || '');
    setOrderLines(order.lines);
    setOrderNumber(order.orderNumber);
    setNotes(order.notes || '');
    showToast(`Заказ ${order.orderNumber} загружен`);
  };

  // Restore orders from Google Drive (merges new orders with local history)
  const handleRestoreOrdersFromDrive = (restoredOrders: SavedOrder[]) => {
    setSavedOrders((prev) => {
      const existingIds = new Set(prev.map((o) => o.id));
      const newOrders = restoredOrders.filter((o) => !existingIds.has(o.id));
      return [...newOrders, ...prev];
    });
    showToast(`Импортировано ${restoredOrders.length} заказов из Google Drive`);
  };

  // Quick download image (matches Android `shareOrderAsImage`)
  const handleQuickDownloadImage = async () => {
    if (!validateCustomerCode()) return;
    if (orderLines.length === 0) {
      showToast('Добавьте товары в заказ для формирования чека');
      return;
    }
    const receiptData: ReceiptData = {
      orderNumber,
      date: formatDate(),
      customerCode,
      customerName,
      lines: orderLines,
      total,
      notes,
    };
    try {
      const filename = await downloadReceiptImage(receiptData);
      showToast(`Чек сохранен: ${filename}`);
    } catch {
      showToast('Ошибка при формировании изображения');
    }
  };

  // Filtered products for dropdown
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const currentReceiptData: ReceiptData = {
    orderNumber,
    date: formatDate(),
    customerCode,
    customerName,
    lines: orderLines,
    total,
    notes,
  };

  return (
    <div className="h-dvh max-h-dvh w-full max-w-xl mx-auto flex flex-col bg-slate-100 overflow-hidden select-none p-2 sm:p-3">
      {/* Top Bar with Minimal Header & Tools (no bulky sticky header) */}
      <header className="flex items-center justify-between px-1 py-1 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black shadow-xs">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <h1 className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
            ORDERS
          </h1>
        </div>

        <div className="flex items-center gap-1">
          {/* Google Drive Button */}
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className={`px-2 py-1 border rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              driveUser
                ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Google Drive (Синхронизация и бэкап)"
          >
            <Cloud className={`w-3.5 h-3.5 ${driveUser ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="hidden xs:inline">Drive</span>
            {driveUser && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Quick APK / Install button */}
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
            title="Установить на телефон / APK"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">Установить</span>
          </button>

          {/* Catalog Button */}
          <button
            onClick={() => setIsCatalogModalOpen(true)}
            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Каталог товаров"
          >
            <Package className="w-4 h-4 text-emerald-600" />
          </button>

          {/* History Button */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-200/60 rounded-lg transition-colors relative"
            title="История заказов"
          >
            <History className="w-4 h-4 text-blue-600" />
            {savedOrders.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute top-1 right-1" />
            )}
          </button>
        </div>
      </header>

      {/* Input Controls Card (Compact, fitting in ~160px height) */}
      <div className="bg-white rounded-xl p-2.5 shadow-xs border border-slate-200/80 space-y-2 shrink-0 mt-1 relative z-30">
        
        {/* Customer Inputs in 1 compact line: Code (35%) & Name (65%) */}
        <div className="grid grid-cols-12 gap-1.5">
          <div className="col-span-4 sm:col-span-4 relative">
            <input
              ref={customerCodeRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={customerCode}
              onChange={(e) => {
                setIsCodeError(false);
                setCustomerCode(e.target.value.replace(/\D/g, ''));
              }}
              placeholder="Код *"
              required
              title="Код клиента (обязательное поле)"
              className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-mono outline-none transition-all ${
                isCodeError
                  ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400/30 placeholder:text-rose-400'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400'
              }`}
            />
          </div>
          <div className="col-span-8 sm:col-span-8">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Покупатель (имя клиента)"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Product Selector Dropdown */}
        <div className="relative" ref={productMenuRef}>
          {(() => {
            const selectedTheme = selectedProduct
              ? getProductTheme(selectedProduct.color || selectedProduct.category)
              : null;
            return (
              <button
                type="button"
                onClick={() => setIsProductMenuOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  selectedTheme
                    ? `${selectedTheme.bgLight} ${selectedTheme.borderColor} ${selectedTheme.textColor} shadow-xs`
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {selectedTheme && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${selectedTheme.dotColor}`}
                    />
                  )}
                  <span className="truncate">
                    {selectedProduct
                      ? `${selectedProduct.name} — ${selectedProduct.price} AMD`
                      : 'Выберите товар'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ml-1 ${
                    isProductMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            );
          })()}

          {/* Product Dropdown Menu */}
          {isProductMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-100">
              <div className="p-1.5 border-b border-slate-100 bg-slate-50">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Поиск товара..."
                  className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {filteredProducts.map((item) => {
                  const theme = getProductTheme(item.color || item.category);
                  const isSelected = selectedProduct?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(item);
                        setPrice(item.price.toString());
                        setIsProductMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs font-semibold transition-colors ${
                        isSelected
                          ? `${theme.badgeBg} ${theme.textColor}`
                          : `hover:${theme.bgLight}`
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${theme.dotColor}`}
                        />
                        <span className={`truncate ${theme.textColor}`}>
                          {item.name}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs ${theme.priceColor} shrink-0 ml-2`}
                      >
                        {item.price} AMD
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Price, Quantity, and Add Button in 1 Streamlined Row */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Цена"
              className="w-full px-2.5 py-1.5 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
            />
            <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-mono pointer-events-none">
              AMD
            </span>
          </div>

          <div className="w-16 shrink-0">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Кол."
              className="w-full px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 text-center focus:bg-white focus:border-emerald-500 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleAddProduct}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Добавить</span>
          </button>
        </div>
      </div>

      {/* Flexible Center: Order Items List (fills remaining vertical space & scrolls internally) */}
      <div className="flex-1 min-h-0 bg-white rounded-xl mt-2 shadow-xs border border-slate-200/80 flex flex-col overflow-hidden">
        
        {/* Section title: Заказ */}
        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Заказ
            </span>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-mono">
              {orderLines.length}
            </span>
          </div>

          {orderLines.length > 0 && (
            <button
              onClick={handleSaveToHistory}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
            >
              Сохранить
            </button>
          )}
        </div>

        {/* Scrollable list of lines */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {orderLines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6 text-center">
              <ShoppingBag className="w-7 h-7 text-slate-300 mb-1 stroke-[1.5]" />
              <p className="text-xs font-medium text-slate-500">Заказ пока пуст</p>
              <p className="text-[10px] text-slate-400">
                Выберите товар выше и нажмите «+ Добавить»
              </p>
            </div>
          ) : (
            orderLines.map((line, index) => {
              const theme = getProductTheme(line.color || line.category);
              return (
                <div
                  key={line.id}
                  className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-xs transition-colors bg-white ${theme.borderLeft} border-l-4 border-slate-200/80 shadow-2xs`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${theme.dotColor}`}
                      />
                      <span className="font-semibold text-slate-900 truncate">
                        {line.productName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {line.price} × {line.quantity}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Stepper +/- */}
                    <div className="flex items-center border border-slate-200 bg-white rounded-md overflow-hidden">
                      <button
                        onClick={() => handleUpdateLineQuantity(index, line.quantity - 1)}
                        className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        -
                      </button>
                      <span className="px-1.5 font-mono text-[11px] font-semibold text-slate-800">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateLineQuantity(index, line.quantity + 1)}
                        className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[55px] font-mono font-bold text-slate-900">
                      {line.total}
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteLine(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pinned Bottom Section: Total & Main Actions (always visible on screen) */}
      <div className="bg-white rounded-xl p-2.5 shadow-xs border border-slate-200/80 space-y-2 shrink-0 mt-2">
        
        {/* Total Banner */}
        <div className="p-2.5 bg-emerald-950 text-white rounded-lg flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-200 tracking-wider uppercase">
            ИТОГО:
          </span>
          <span className="text-xl font-black font-mono tracking-tight text-white">
            {formatNumber(total)} AMD
          </span>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-12 gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (!validateCustomerCode()) return;
              if (orderLines.length === 0) {
                showToast('Добавьте товары в заказ перед отправкой');
                return;
              }
              setIsWhatsAppModalOpen(true);
            }}
            className="col-span-8 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Поделиться через WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleNewOrder}
            className="col-span-4 flex items-center justify-center gap-1 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>Новый заказ</span>
          </button>
        </div>

        {/* Secondary Compact Quick Actions (Чек картинкой & Скачать) */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => {
              if (!validateCustomerCode()) return;
              if (orderLines.length === 0) {
                showToast('Добавьте товары для генерации чека');
                return;
              }
              setIsReceiptModalOpen(true);
            }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Чек (Изображение)</span>
          </button>

          <button
            type="button"
            onClick={handleQuickDownloadImage}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Скачать PNG</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-1.5 animate-in fade-in duration-150">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <ReceiptPreviewModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        data={currentReceiptData}
        onOpenGoogleDrive={() => setIsDriveModalOpen(true)}
      />

      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        orderData={currentReceiptData}
        onOpenReceiptImage={() => setIsReceiptModalOpen(true)}
      />

      <ProductCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        products={products}
        onSaveProducts={setProducts}
        onResetDefaults={() => setProducts(INITIAL_PRODUCTS)}
      />

      <OrdersHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        orders={savedOrders}
        onLoadOrder={handleLoadOrder}
        onDeleteOrder={(id) =>
          setSavedOrders((prev) => prev.filter((o) => o.id !== id))
        }
        onClearAll={() => setSavedOrders([])}
        onShareWhatsApp={(order) => {
          setIsHistoryModalOpen(false);
          setIsWhatsAppModalOpen(true);
        }}
        onOpenReceipt={(order) => {
          setIsHistoryModalOpen(false);
          setIsReceiptModalOpen(true);
        }}
        onOpenGoogleDrive={() => setIsDriveModalOpen(true)}
      />

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        appUrl={window.location.href}
      />

      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        savedOrders={savedOrders}
        products={products}
        currentReceiptData={currentReceiptData}
        onRestoreOrders={handleRestoreOrdersFromDrive}
        onToast={showToast}
        user={driveUser}
        setUser={setDriveUser}
      />
    </div>
  );
}
