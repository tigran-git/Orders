/**
 * Google Drive Integration Modal
 * Includes official "Sign in with Google" button, Drive sync, backup, restore, and file management
 * with mandatory confirmation dialogs for destructive operations.
 */
import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Download,
  Trash2,
  ExternalLink,
  RefreshCw,
  LogOut,
  FileText,
  Database,
  Calendar,
  FolderArchive,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  getAccessToken,
  initAuth,
} from '../services/googleDriveAuth';
import {
  listDriveFiles,
  uploadFileToDrive,
  downloadDriveFile,
  deleteDriveFile,
  DriveFileItem,
} from '../services/googleDriveApi';
import { SavedOrder, Product } from '../types';
import { ReceiptData } from '../utils/imageGenerator';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedOrders: SavedOrder[];
  products: Product[];
  currentReceiptData?: ReceiptData;
  onRestoreOrders?: (orders: SavedOrder[]) => void;
  onToast: (msg: string) => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  savedOrders,
  products,
  currentReceiptData,
  onRestoreOrders,
  onToast,
  user,
  setUser,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Destructive Action Confirmation State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => Promise<void>;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '',
    onConfirm: async () => {},
  });

  // Track auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, cachedToken) => {
        setUser(currentUser);
        if (cachedToken) {
          setToken(cachedToken);
        }
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, [setUser]);

  // Load files when modal opens and token is available
  useEffect(() => {
    if (isOpen && token) {
      loadFiles(token);
    }
  }, [isOpen, token]);

  const loadFiles = async (currentToken: string) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const driveFiles = await listDriveFiles(currentToken);
      setFiles(driveFiles);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Не удалось загрузить список файлов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        onToast(`Вход выполнен: ${res.user.email}`);
        await loadFiles(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ошибка входа в Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setFiles([]);
      onToast('Вы вышли из Google Drive');
    } catch (err: any) {
      console.error(err);
    }
  };

  // 1. Backup all orders and product catalog
  const handleBackupAll = async () => {
    const currentToken = token || (await getAccessToken());
    if (!currentToken) {
      setErrorMsg('Пожалуйста, войдите в Google Drive');
      return;
    }

    try {
      setIsSyncing(true);
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 16);
      const fileName = `orders_backup_${timestamp}.json`;

      const backupPayload = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        totalOrdersCount: savedOrders.length,
        totalProductsCount: products.length,
        savedOrders,
        products,
      };

      await uploadFileToDrive(
        currentToken,
        fileName,
        JSON.stringify(backupPayload, null, 2),
        'application/json'
      );

      onToast(`Резервная копия «${fileName}» сохранена в Google Drive!`);
      await loadFiles(currentToken);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ошибка при сохранении копии');
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Save current order receipt as readable text
  const handleSaveCurrentReceipt = async () => {
    const currentToken = token || (await getAccessToken());
    if (!currentToken) {
      setErrorMsg('Пожалуйста, войдите в Google Drive');
      return;
    }

    if (!currentReceiptData || currentReceiptData.lines.length === 0) {
      onToast('Нет активного заказа для сохранения');
      return;
    }

    try {
      setIsSyncing(true);
      const safeOrderNum = currentReceiptData.orderNumber.replace(/[^a-zA-Z0-9-]/g, '_');
      const fileName = `Order_${safeOrderNum}_${currentReceiptData.customerCode || 'Client'}.txt`;

      const receiptText = [
        `========================================`,
        `           ЧЕК ЗАКАЗА: ${currentReceiptData.orderNumber}`,
        `========================================`,
        `Дата: ${currentReceiptData.date}`,
        `Код клиента: ${currentReceiptData.customerCode || '—'}`,
        `Клиент: ${currentReceiptData.customerName || '—'}`,
        `----------------------------------------`,
        `ТОВАРЫ:`,
        ...currentReceiptData.lines.map(
          (line, i) =>
            `${i + 1}. ${line.productName} x ${line.quantity} = ${line.total} ֏`
        ),
        `----------------------------------------`,
        `ИТОГО: ${currentReceiptData.total} ֏`,
        currentReceiptData.notes ? `Примечание: ${currentReceiptData.notes}` : '',
        `========================================`,
        `Создано через приложение Orders`,
      ]
        .filter(Boolean)
        .join('\n');

      await uploadFileToDrive(currentToken, fileName, receiptText, 'text/plain');
      onToast(`Чек заказа сохранен в Google Drive: ${fileName}`);
      await loadFiles(currentToken);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ошибка сохранения чека в Drive');
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Restore orders from file with MANDATORY confirmation
  const handleRequestRestore = (file: DriveFileItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Восстановить данные из Google Drive?',
      description: `Вы собираетесь загрузить файл «${file.name}». Текущие заказы будут объединены с резервной копией из вашего Google Drive. Это действие обновит локальную историю заказов.`,
      confirmText: 'Да, восстановить',
      isDestructive: false,
      onConfirm: async () => {
        const currentToken = token || (await getAccessToken());
        if (!currentToken) return;
        try {
          setIsSyncing(true);
          const content = await downloadDriveFile(currentToken, file.id);
          const parsed = JSON.parse(content);

          if (parsed && Array.isArray(parsed.savedOrders)) {
            if (onRestoreOrders) {
              onRestoreOrders(parsed.savedOrders);
            }
            onToast(`Успешно восстановлено ${parsed.savedOrders.length} заказов!`);
          } else if (Array.isArray(parsed)) {
            if (onRestoreOrders) {
              onRestoreOrders(parsed);
            }
            onToast(`Успешно восстановлено ${parsed.length} заказов!`);
          } else {
            throw new Error('Файл не содержит корректных данных заказов');
          }
        } catch (err: any) {
          console.error(err);
          setErrorMsg(err.message || 'Ошибка восстановления файла');
        } finally {
          setIsSyncing(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // 4. Delete file from Google Drive with MANDATORY confirmation
  const handleRequestDelete = (file: DriveFileItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Удалить файл из Google Drive?',
      description: `Вы уверены, что хотите безвозвратно удалить файл «${file.name}» из вашего хранилища Google Drive? Это действие невозможно отменить.`,
      confirmText: 'Да, удалить файл',
      isDestructive: true,
      onConfirm: async () => {
        const currentToken = token || (await getAccessToken());
        if (!currentToken) return;
        try {
          setIsSyncing(true);
          await deleteDriveFile(currentToken, file.id);
          setFiles((prev) => prev.filter((f) => f.id !== file.id));
          onToast(`Файл «${file.name}» удален из Google Drive`);
        } catch (err: any) {
          console.error(err);
          setErrorMsg(err.message || 'Ошибка при удалении файла');
        } finally {
          setIsSyncing(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight flex items-center gap-1.5">
                Google Drive
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-medium uppercase tracking-wider">
                  Sync & Cloud
                </span>
              </h2>
              <p className="text-xs text-white/80">
                Синхронизация заказов, чеков и резервных копий
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Ошибка: </span>
                {errorMsg}
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Account Status Card */}
          {!user ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Подключите Google Drive
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Сохраняйте заказы в облаке, выгружайте чеки и делайте резервные копии для безопасности ваших данных.
                </p>
              </div>

              {/* Official Google Sign-In Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="relative inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 rounded-xl shadow-xs bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium text-sm transition-all focus:outline-hidden disabled:opacity-60 cursor-pointer active:scale-98"
                >
                  <svg
                    className="w-4 h-4 mr-2.5"
                    viewBox="0 0 48 48"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>
                    {isLoading ? 'Авторизация...' : 'Sign in with Google'}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Безопасный доступ с разрешения пользователя</span>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-emerald-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">
                      {user.displayName || 'Google Пользователь'}
                    </span>
                    <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-medium">
                      Подключено
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate max-w-[200px] sm:max-w-xs">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => token && loadFiles(token)}
                  disabled={isLoading}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                  title="Обновить список файлов"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                  title="Выйти из аккаунта"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons (when connected) */}
          {user && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Backup All Orders */}
              <button
                onClick={handleBackupAll}
                disabled={isSyncing}
                className="p-3 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {savedOrders.length} заказов
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    Создать бэкап в Drive
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Сохранить все заказы и товары в облачный JSON
                  </p>
                </div>
              </button>

              {/* Save Active Order */}
              <button
                onClick={handleSaveCurrentReceipt}
                disabled={isSyncing || !currentReceiptData || currentReceiptData.lines.length === 0}
                className={`p-3 border rounded-xl text-left transition-all shadow-2xs group flex flex-col justify-between ${
                  currentReceiptData && currentReceiptData.lines.length > 0
                    ? 'bg-white hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-300'
                    : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {currentReceiptData?.orderNumber || '—'}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                    Сохранить текущий чек
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Выгрузить чек открытого заказа как текстовый документ
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Cloud Files List */}
          {user && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FolderArchive className="w-4 h-4 text-blue-600" />
                  Файлы в Google Drive ({files.length})
                </h4>
                {isLoading && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Загрузка...
                  </span>
                )}
              </div>

              {files.length === 0 && !isLoading ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 text-center text-slate-400 text-xs">
                  В Google Drive пока нет сохраненных резервных копий или чеков.
                  <div className="mt-2 text-slate-500 font-medium">
                    Нажмите «Создать бэкап в Drive» выше, чтобы создать первую копию.
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                  {files.map((file) => {
                    const isJson = file.mimeType.includes('json') || file.name.endsWith('.json');
                    return (
                      <div
                        key={file.id}
                        className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between gap-2 text-xs transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isJson
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            {isJson ? (
                              <Database className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              {file.createdTime && (
                                <span>{new Date(file.createdTime).toLocaleString()}</span>
                              )}
                              {file.size && (
                                <span>• {(Number(file.size) / 1024).toFixed(1)} KB</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Открыть в Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {isJson && onRestoreOrders && (
                            <button
                              onClick={() => handleRequestRestore(file)}
                              disabled={isSyncing}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-[11px] transition-colors flex items-center gap-1"
                              title="Восстановить заказы из этого файла"
                            >
                              <Download className="w-3 h-3" />
                              <span className="hidden xs:inline">Импорт</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleRequestDelete(file)}
                            disabled={isSyncing}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Удалить файл из Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Google Drive API v3</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Destructive / Mutating Operations */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmDialog.isDestructive
                    ? 'bg-red-100 text-red-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-3 py-2 text-white text-xs font-bold rounded-xl transition-colors shadow-xs ${
                  confirmDialog.isDestructive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
