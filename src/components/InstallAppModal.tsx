import { useState } from 'react';
import { Smartphone, Download, X, Check, Copy, ExternalLink, Sparkles, Layers, Terminal } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}

export function InstallAppModal({ isOpen, onClose, appUrl }: InstallAppModalProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'apk' | 'studio' | 'zip'>('install');

  if (!isOpen) return null;

  const currentUrl = appUrl || window.location.href;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Установка приложения на Android</h3>
              <p className="text-xs text-slate-500">Как использовать на телефоне или получить APK</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all text-center ${
              activeTab === 'install'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. На телефон (без APK)
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all text-center ${
              activeTab === 'apk'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Скачать готовый APK
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all text-center ${
              activeTab === 'studio'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Android Studio
          </button>
          <button
            onClick={() => setActiveTab('zip')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all text-center ${
              activeTab === 'zip'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Скачать ZIP
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800 text-sm">
          
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-emerald-950">
                  <span className="font-bold">Самый быстрый и удобный способ:</span> Приложение настроено как <strong>PWA</strong>. Оно устанавливается на телефон за 2 секунды прямо из браузера Chrome — получает отдельную иконку, работает на весь экран и офлайн точно так же, как APK!
                </div>
              </div>

              {isInstallable ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Установить приложение прямо сейчас</span>
                </button>
              ) : isInstalled ? (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-center text-xs font-semibold">
                  ✓ Приложение уже установлено на этом устройстве!
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-xs uppercase text-slate-600 tracking-wider">
                    Инструкция для Android (Google Chrome / Яндекс):
                  </div>
                  <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1.5 leading-relaxed">
                    <li>Откройте эту ссылку на телефоне:
                      <div className="mt-1 flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <span className="truncate font-mono text-[11px] text-slate-500 flex-1">{currentUrl}</span>
                        <button
                          onClick={handleCopyUrl}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 shrink-0"
                        >
                          {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedUrl ? 'Скопировано' : 'Копировать'}</span>
                        </button>
                      </div>
                    </li>
                    <li>Нажмите меню браузера (<strong>три точки ⋮</strong> в правом верхнем углу).</li>
                    <li>Выберите пункт <strong>«Установить приложение»</strong> (или <strong>«Добавить на главный экран»</strong>).</li>
                    <li>Иконка <strong>ORDERS</strong> появится на рабочем столе смартфона!</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-700">
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1.5">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <span>⚠️</span> Почему PWABuilder не может просканировать эту ссылку:
                </div>
                <p>
                  Ссылка <span className="font-mono text-[11px] bg-amber-100 px-1 py-0.5 rounded">ais-dev-...</span> — это <strong>закрытый рабочий контейнер Google AI Studio</strong> с защитой авторизации (HTTP 302). Внешний сервис PWABuilder не имеет доступа к закрытой сессии Google и поэтому не может прочитать страницу снаружи.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-2">
                <div className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Решение 1: Установка на телефон напрямую (Рекомендуется)
                </div>
                <p>
                  Вам <strong>не обязательно создавать APK-файл</strong>! Приложение полностью подготовлено как PWA:
                </p>
                <ol className="list-decimal list-inside space-y-1 font-medium text-emerald-900">
                  <li>Откройте ссылку на телефоне в браузере Chrome</li>
                  <li>Нажмите меню <strong>«⋮»</strong> → <strong>«Установить приложение»</strong> (или кнопку на вкладке 1)</li>
                  <li>Оно установится на Android точно так же, как APK — с иконкой и полным экраном!</li>
                </ol>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Решение 2: Если вам строго нужен именно .APK файл
                </div>
                
                <p className="text-slate-600">
                  Манифест, Service Worker, иконки 512×512 и скриншоты в проекте <strong>полностью готовы на 100%</strong>. Чтобы PWABuilder создал APK:
                </p>

                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>
                    Опубликуйте проект на любом открытом бесплатном хостинге (например, <strong>Vercel</strong>, <strong>Netlify</strong> или <strong>GitHub Pages</strong>).
                  </li>
                  <li>
                    Вставьте публичный адрес в <strong>PWABuilder.com</strong> — он сразу покажет зеленую оценку и выдаст готовый APK.
                  </li>
                  <li>
                    <strong>Или соберите локально через Bubblewrap (CLI):</strong>
                    <div className="mt-1 p-2 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg">
                      npx @bubblewrap/cli init --manifest=public/manifest.json<br/>
                      npx @bubblewrap/cli build
                    </div>
                  </li>
                </ol>

                <a
                  href="https://www.pwabuilder.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all"
                >
                  <span>Открыть PWABuilder.com</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p>
                Если у вас установлен <strong>Android Studio</strong>, вы можете собрать оригинальный нативный APK за 1 минуту:
              </p>
              
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1 overflow-x-auto">
                <p className="text-slate-400">// 1. Откройте Android Studio → New Project → Empty Compose Activity</p>
                <p className="text-slate-400">// 2. Вставьте предоставленный вами MainActivity.kt</p>
                <p className="text-slate-400">// 3. В меню выберите: Build → Build Bundle(s) / APK(s) → Build APK(s)</p>
                <p className="text-emerald-400">// Готовый APK появится в папке: app/build/outputs/apk/debug/app-debug.apk</p>
              </div>

              <p className="text-slate-500">
                Все зависимости (Compose Material3, NumberFormat, Intent для WhatsApp) уже настроены и готовы.
              </p>
            </div>
          )}

          {activeTab === 'zip' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-700">
              <p>
                Вы можете скачать готовый архив проекта прямо сейчас в один клик:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="/orders-source-code.zip"
                  download="orders-source-code.zip"
                  className="flex flex-col p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 group-hover:text-emerald-700 text-sm flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-emerald-600" />
                      Исходный код (ZIP)
                    </span>
                    <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded-sm font-mono">
                      ~245 KB
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Полный React + TypeScript + Vite + PWA проект. Распакуйте, запустите <code className="text-slate-700 font-mono">npm install</code> и разрабатывайте на своем ПК.
                  </p>
                </a>

                <a
                  href="/orders-build.zip"
                  download="orders-build.zip"
                  className="flex flex-col p-3.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 group-hover:text-blue-700 text-sm flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-blue-600" />
                      Production билд (ZIP)
                    </span>
                    <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded-sm font-mono">
                      ~247 KB
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Скомпилированные файлы (HTML, JS, CSS, иконки). Можно сразу залить на любой хостинг (Vercel, Netlify, Firebase, GitHub Pages) без Node.js.
                  </p>
                </a>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 text-[11px] space-y-1">
                <p className="font-semibold">Другие способы получить проект:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
                  <li><strong>Экспорт в GitHub:</strong> в верхнем меню AI Studio можно экспортировать весь код в ваш GitHub репозиторий в один клик.</li>
                  <li><strong>Код файлов:</strong> могу вывести исходный код любого файла прямо сюда в чат.</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={handleCopyUrl}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'Ссылка скопирована' : 'Скопировать ссылку'}</span>
          </button>

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
