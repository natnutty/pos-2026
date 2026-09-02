import React, { useState, useEffect } from 'react';
import { 
  X, 
  Banknote, 
  QrCode, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Percent,
  User,
  MapPin,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, PaymentMethod, OrderType, StoreProfile, Transaction } from '../types';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { useLanguage } from '../i18n/LanguageContext';

interface PaymentModalProps {
  cart: CartItem[];
  subtotal: number;
  storeProfile: StoreProfile;
  orderType: OrderType;
  tableNumber: string;
  customerName: string;
  onClose: () => void;
  onCompleteTransaction: (transaction: Transaction) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  cart,
  subtotal,
  storeProfile,
  orderType: initialOrderType,
  tableNumber: initialTableNumber,
  customerName: initialCustomerName,
  onClose,
  onCompleteTransaction,
}) => {
  const { t } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [orderType, setOrderType] = useState<OrderType>(initialOrderType);
  const [tableNumber, setTableNumber] = useState<string>(initialTableNumber);
  const [customerName, setCustomerName] = useState<string>(initialCustomerName);
  const [discountNominal, setDiscountNominal] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountMode, setDiscountMode] = useState<'nominal' | 'percent'>('nominal');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [cashierNotes, setCashierNotes] = useState<string>('');

  // Calculate final discount amount
  const calculatedDiscount = 
    discountMode === 'percent'
      ? Math.round((subtotal * discountPercent) / 100)
      : Math.min(subtotal, discountNominal);

  const grandTotal = Math.max(0, subtotal - calculatedDiscount);

  // Total cost amount (HPP)
  const totalCost = cart.reduce((sum, item) => sum + item.menuItem.costPrice * item.quantity, 0);
  const estimatedProfit = grandTotal - totalCost;

  // Numeric cash received
  const cashReceived = Number(cashReceivedInput.replace(/\D/g, '')) || 0;
  const cashChange = Math.max(0, cashReceived - grandTotal);
  const isCashSufficient = paymentMethod !== 'cash' || cashReceived >= grandTotal;

  // Auto-fill exact cash when opening cash mode if empty
  useEffect(() => {
    if (paymentMethod === 'cash' && !cashReceivedInput) {
      setCashReceivedInput(String(grandTotal));
    }
  }, [grandTotal, paymentMethod]);

  const handleCashPreset = (amount: number) => {
    sounds.playBeep();
    setCashReceivedInput(String(amount));
  };

  const handleApplyExactCash = () => {
    sounds.playBeep();
    setCashReceivedInput(String(grandTotal));
  };

  const handleProcessPayment = () => {
    if (!isCashSufficient) {
      sounds.playBeep();
      return;
    }

    sounds.playCashRegister();

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#ea580c', '#10b981', '#ffffff'],
      });
    } catch {
      // safe fallback
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const timestamp = now.getTime();
    const receiptNumber = `AKR-${dateStr.replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const newTransaction: Transaction = {
      id: `tx-${timestamp}`,
      receiptNumber,
      date: dateStr,
      time: timeStr,
      timestamp,
      items: cart,
      subtotal,
      discount: calculatedDiscount,
      totalAmount: grandTotal,
      costAmount: totalCost,
      profit: estimatedProfit,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
      cashChange: paymentMethod === 'cash' ? cashChange : undefined,
      customerName: customerName.trim() || undefined,
      tableNumber: tableNumber.trim() || (orderType === 'dine_in' ? t.dineIn : t.takeaway),
      orderType,
      status: 'completed',
      cashierName: storeProfile.cashierName || t.cashierNamePlaceholder,
      notes: cashierNotes.trim() || undefined,
    };

    onCompleteTransaction(newTransaction);
  };

  // Keyboard shortcut: Enter to submit payment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isCashSufficient) {
        e.preventDefault();
        handleProcessPayment();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCashSufficient, cashReceived, grandTotal]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0F172A] text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base leading-tight">{t.paymentModalTitle}</h3>
              <p className="text-[11px] text-slate-400">Total {cart.reduce((s, i) => s + i.quantity, 0)} {t.orderItemsSubtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playBeep();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 bg-slate-50/50 text-slate-800 text-xs custom-scrollbar">
          
          {/* Total Highlight Banner */}
          <div className="p-3.5 rounded-xl bg-[#0F172A] border border-slate-800 text-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.totalBill}</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight mt-0.5">
                {formatRupiah(grandTotal)}
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-300 space-y-0.5">
              <div>{t.subtotal}: <span className="font-bold text-white">{formatRupiah(subtotal)}</span></div>
              {calculatedDiscount > 0 && (
                <div className="text-red-400 font-bold">{t.discount}: -{formatRupiah(calculatedDiscount)}</div>
              )}
              <div className="text-[11px] text-emerald-400 flex items-center justify-end gap-1 font-bold">
                <Sparkles className="w-3 h-3" />
                {t.estProfit}: {formatRupiah(estimatedProfit)}
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              {t.paymentMethod}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash' as const, label: t.payCash, icon: Banknote, desc: t.payCashDesc },
                { id: 'qris' as const, label: t.payQris, icon: QrCode, desc: t.payQrisDesc },
                { id: 'transfer' as const, label: t.payTransfer, icon: CreditCard, desc: t.payTransferDesc },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      sounds.playBeep();
                      setPaymentMethod(m.id);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F172A] border-slate-900 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold leading-tight">{m.label}</span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>{m.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Input & Quick Presets */}
          {paymentMethod === 'cash' && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t.cashReceivedLabel}</span>
                </label>
                <button
                  type="button"
                  onClick={handleApplyExactCash}
                  className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
                >
                  {t.exactCash} ({formatRupiah(grandTotal)})
                </button>
              </div>

              {/* Amount Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                  Rp
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cashReceivedInput ? formatNumber(Number(cashReceivedInput.replace(/\D/g, ''))) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setCashReceivedInput(raw);
                  }}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-lg font-black font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[10000, 20000, 50000, 100000].map((nominal) => {
                  if (nominal < grandTotal && nominal !== 50000 && nominal !== 100000) return null;
                  return (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => handleCashPreset(nominal)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                    >
                      {formatRupiah(nominal)}
                    </button>
                  );
                })}
                {grandTotal % 10000 !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleCashPreset(Math.ceil(grandTotal / 10000) * 10000)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                  >
                    {formatRupiah(Math.ceil(grandTotal / 10000) * 10000)}
                  </button>
                )}
              </div>

              {/* Real-time Change Indicator */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{t.change}:</span>
                {cashReceived < grandTotal ? (
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t.insufficient} {formatRupiah(grandTotal - cashReceived)}
                  </span>
                ) : (
                  <span className="text-base font-black text-emerald-600 font-mono">
                    {formatRupiah(cashChange)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* QRIS Display Mode */}
          {paymentMethod === 'qris' && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center space-y-2.5 shadow-xs">
              <div className="flex items-center justify-center gap-1.5 text-slate-800 font-bold text-xs">
                <QrCode className="w-4 h-4 text-amber-600" />
                <span>{t.scanQrisTitle}</span>
              </div>
              
              {/* Simulated QR Code Box */}
              <div className="inline-block p-2.5 bg-slate-50 rounded-xl shadow-xs border border-slate-300">
                <div className="w-36 h-36 bg-white flex flex-col items-center justify-center rounded-lg border border-slate-200 relative overflow-hidden">
                  <QrCode className="w-28 h-28 text-slate-900" />
                  <div className="absolute inset-x-0 bottom-0 text-[9px] font-extrabold text-slate-800 bg-amber-400 py-0.5">
                    {storeProfile.name}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                {t.qrisSubtitle}
              </p>
            </div>
          )}

          {/* Transfer Bank Display Mode */}
          {paymentMethod === 'transfer' && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs shadow-xs">
              <span className="font-bold text-slate-700 block mb-1">{t.bankAccountTitle}:</span>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">BCA - Angkringan Mas Joko</div>
                  <div className="font-mono text-slate-600 text-[11px]">8020-1928-3746</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playBeep();
                    navigator.clipboard.writeText('802019283746');
                  }}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-bold"
                >
                  {t.copy}
                </button>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">Bank BRI - Joko Santoso</div>
                  <div className="font-mono text-slate-600 text-[11px]">0123-01-098765-50-8</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playBeep();
                    navigator.clipboard.writeText('012301098765508');
                  }}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-bold"
                >
                  {t.copy}
                </button>
              </div>
            </div>
          )}

          {/* Customer & Order Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
            <div>
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                <User className="w-3 h-3" />
                {t.customerNameOptional}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="cth: Mas Budi / Mbak Rina"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" />
                {t.locationTableLabel}
              </label>
              <div className="flex gap-1.5">
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="dine_in">{t.dineIn}</option>
                  <option value="takeaway">{t.takeaway}</option>
                </select>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder={orderType === 'dine_in' ? 'Meja 1' : 'Bungkus'}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Discount Section */}
          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Percent className="w-3 h-3 text-amber-600" />
                {t.discountOptional}
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setDiscountMode('nominal');
                    setDiscountPercent(0);
                  }}
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${discountMode === 'nominal' ? 'bg-[#0F172A] text-amber-400' : 'text-slate-500'}`}
                >
                  Rp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountMode('percent');
                    setDiscountNominal(0);
                  }}
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${discountMode === 'percent' ? 'bg-[#0F172A] text-amber-400' : 'text-slate-500'}`}
                >
                  %
                </button>
              </div>
            </div>

            {discountMode === 'nominal' ? (
              <input
                type="number"
                value={discountNominal || ''}
                onChange={(e) => setDiscountNominal(Math.max(0, Number(e.target.value)))}
                placeholder="cth: 2000"
                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            ) : (
              <input
                type="number"
                value={discountPercent || ''}
                onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                placeholder="cth: 10%"
                max="100"
                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              {t.cashierNotesLabel}
            </label>
            <input
              type="text"
              value={cashierNotes}
              onChange={(e) => setCashierNotes(e.target.value)}
              placeholder="cth: Dibakar agak kering, kuah jahe dipisah"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => {
              sounds.playBeep();
              onClose();
            }}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>

          <button
            type="button"
            disabled={!isCashSufficient}
            onClick={handleProcessPayment}
            className={`flex-1 py-2.5 px-3 rounded-lg font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
              isCashSufficient
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.completeAndPrint}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
