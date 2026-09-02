import React, { useState } from 'react';
import { Printer, Share2, Check, X, Download, Copy } from 'lucide-react';
import { Transaction, StoreProfile } from '../types';
import { formatRupiah, formatDateTimeIndonesian } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { useLanguage } from '../i18n/LanguageContext';

interface ReceiptModalProps {
  transaction: Transaction | null;
  storeProfile: StoreProfile;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  storeProfile,
  onClose,
}) => {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState<boolean>(false);

  if (!transaction) return null;

  const handlePrint = () => {
    sounds.playBeep();
    window.print();
  };

  const generateReceiptPlainText = (): string => {
    const divider = '--------------------------------';
    const lines: string[] = [
      `*${storeProfile.name.toUpperCase()}*`,
      storeProfile.tagline,
      storeProfile.address,
      `Telp/WA: ${storeProfile.phone}`,
      divider,
      `${t.receiptNumber}: ${transaction.receiptNumber}`,
      `${t.thTxReceiptTime}: ${formatDateTimeIndonesian(transaction.timestamp, language)}`,
      `${t.cashierNameLabel}: ${transaction.cashierName}`,
      `${t.thTxCustomerTable}: ${transaction.customerName || '-'} (${transaction.tableNumber || (transaction.orderType === 'dine_in' ? t.dineIn : t.takeaway)})`,
      divider,
    ];

    transaction.items.forEach((item) => {
      const itemName = language === 'en' && item.menuItem.nameEn ? item.menuItem.nameEn : item.menuItem.name;
      const grillTag = item.isGrilled ? ` [${t.customItemGrilledTag}]` : '';
      lines.push(`${itemName}${grillTag}`);
      lines.push(`  ${item.quantity}x @${formatRupiah(item.unitPrice)} = ${formatRupiah(item.subtotal)}`);
      if (item.note) {
        lines.push(`  (${t.noteTag}: ${item.note})`);
      }
    });

    lines.push(divider);
    lines.push(`Subtotal     : ${formatRupiah(transaction.subtotal)}`);
    if (transaction.discount > 0) {
      lines.push(`${t.receiptDiscount}       : -${formatRupiah(transaction.discount)}`);
    }
    lines.push(`*${t.receiptTotal} : ${formatRupiah(transaction.totalAmount)}*`);
    lines.push(`${t.receiptPaymentMethod} : ${transaction.paymentMethod === 'cash' ? t.payCash.toUpperCase() : transaction.paymentMethod === 'qris' ? 'QRIS' : t.payTransfer.toUpperCase()}`);
    
    if (transaction.paymentMethod === 'cash' && transaction.cashReceived) {
      lines.push(`${t.receiptCashReceived} : ${formatRupiah(transaction.cashReceived)}`);
      lines.push(`${t.receiptCashChange}      : ${formatRupiah(transaction.cashChange || 0)}`);
    }
    
    lines.push(divider);
    lines.push(storeProfile.footerMessage || (language === 'en' ? 'Thank you for visiting!' : 'Matur Nuwun Sampun Mampir!'));
    lines.push(language === 'en' ? 'Keep this receipt as valid proof of payment.' : 'Simpan struk ini sebagai bukti pembayaran sah.');

    return lines.join('\n');
  };

  const handleCopyText = () => {
    sounds.playBeep();
    const text = generateReceiptPlainText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShareWhatsApp = () => {
    sounds.playBeep();
    const text = encodeURIComponent(generateReceiptPlainText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDownloadTxt = () => {
    sounds.playBeep();
    const text = generateReceiptPlainText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Struk_${transaction.receiptNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0F172A] text-white">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-white text-sm sm:text-base">{t.receiptModalTitle}</h3>
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

        {/* Scrollable Receipt Area */}
        <div className="p-4 overflow-y-auto bg-slate-100/80 flex justify-center custom-scrollbar">
          
          {/* Thermal Receipt Paper Simulation */}
          <div 
            id="printable-receipt"
            className="w-full max-w-[320px] bg-white text-slate-900 font-mono text-xs p-5 rounded-lg shadow-sm border border-slate-300"
            style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
          >
            {/* Store Header */}
            <div className="text-center mb-3">
              <h2 className="font-black text-sm tracking-tight text-slate-900 uppercase">
                {storeProfile.name}
              </h2>
              <p className="text-[11px] text-slate-600 font-sans">{storeProfile.tagline}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{storeProfile.address}</p>
              <p className="text-[10px] text-slate-500">WA: {storeProfile.phone}</p>
            </div>

            <div className="border-t border-dashed border-slate-400 my-2"></div>

            {/* Metadata */}
            <div className="space-y-0.5 text-[11px] text-slate-700">
              <div className="flex justify-between">
                <span>{t.receiptNo}:</span>
                <span className="font-bold text-slate-900">{transaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.receiptTime}:</span>
                <span>{formatDateTimeIndonesian(transaction.timestamp, language)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.receiptCashier}:</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.receiptOrder}:</span>
                <span className="font-bold text-slate-900">
                  {transaction.tableNumber || (transaction.orderType === 'dine_in' ? t.dineIn : t.takeaway)}
                  {transaction.customerName ? ` (${transaction.customerName})` : ''}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-400 my-2"></div>

            {/* Items */}
            <div className="space-y-2 my-2">
              {transaction.items.map((item, idx) => {
                const displayName = language === 'en' && item.menuItem.nameEn ? item.menuItem.nameEn : item.menuItem.name;
                return (
                  <div key={idx} className="text-[11px]">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span className="truncate pr-1">
                        {displayName}
                        {item.isGrilled && <span className="text-orange-600 font-black ml-1">[{t.customItemGrilledTag}]</span>}
                      </span>
                      <span className="shrink-0">{formatRupiah(item.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>{item.quantity} x @{formatRupiah(item.unitPrice)}</span>
                    </div>
                    {item.note && (
                      <div className="text-[10px] text-amber-900 italic bg-amber-50 px-1 py-0.5 rounded mt-0.5 border border-amber-200/50">
                        {t.noteTag}: {item.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-dashed border-slate-400 my-2"></div>

            {/* Calculation Summary */}
            <div className="space-y-1 text-[11px] text-slate-800">
              <div className="flex justify-between">
                <span>{t.receiptSubtotal} ({transaction.items.reduce((sum, i) => sum + i.quantity, 0)} item):</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>

              {transaction.discount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>{t.receiptDiscount}:</span>
                  <span>-{formatRupiah(transaction.discount)}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-sm text-slate-950 border-t border-dotted border-slate-400 pt-1 mt-1">
                <span>{t.receiptTotal}:</span>
                <span>{formatRupiah(transaction.totalAmount)}</span>
              </div>

              <div className="flex justify-between pt-1 text-slate-600">
                <span>{t.receiptPaymentMethod}:</span>
                <span className="font-bold uppercase text-slate-900">
                  {transaction.paymentMethod === 'cash' ? t.payCash.toUpperCase() : transaction.paymentMethod === 'qris' ? 'QRIS' : t.payTransfer.toUpperCase()}
                </span>
              </div>

              {transaction.paymentMethod === 'cash' && transaction.cashReceived !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span>{t.receiptCashReceived}:</span>
                    <span>{formatRupiah(transaction.cashReceived)}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-950">
                    <span>{t.receiptCashChange}:</span>
                    <span className="text-emerald-700">{formatRupiah(transaction.cashChange || 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-slate-400 my-3"></div>

            {/* Footer Note */}
            <div className="text-center text-[10px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">{storeProfile.footerMessage || (language === 'en' ? 'Thank you for visiting!' : 'Matur Nuwun Sampun Mampir!')}</p>
              <p className="text-[9px] text-slate-400">{language === 'en' ? '=== Thank You For Your Visit ===' : '=== Terima Kasih Atas Kunjungannya ==='}</p>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyText}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.copiedReceiptBtn : t.copyReceiptBtn}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 border border-emerald-300 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.sendWhatsAppBtn}</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.downloadTxtBtn}</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ml-auto"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printReceiptBtn}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
