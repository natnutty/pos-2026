/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MenuItem, Transaction, StockLog, StoreProfile } from './types';
import { StorageService } from './utils/storage';
import { Header } from './components/Header';
import { POSScreen } from './components/POSScreen';
import { InventoryScreen } from './components/InventoryScreen';
import { TransactionsScreen } from './components/TransactionsScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { SettingsModal } from './components/SettingsModal';
import { ReceiptModal } from './components/ReceiptModal';
import { DEFAULT_MENU_ITEMS, DEFAULT_STORE_PROFILE } from './data/defaultMenu';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'transactions' | 'reports'>('pos');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(DEFAULT_STORE_PROFILE);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [latestReceiptTx, setLatestReceiptTx] = useState<Transaction | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Initialize data from local storage
  useEffect(() => {
    const items = StorageService.getMenuItems();
    const txs = StorageService.getTransactions();
    const logs = StorageService.getStockLogs();
    const profile = StorageService.getStoreProfile();

    setMenuItems(items);
    setTransactions(txs);
    setStockLogs(logs);
    setStoreProfile(profile);
    setIsLoaded(true);
  }, []);

  // Today's summary statistics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(
    (t) => t.date === todayStr && t.status === 'completed'
  );
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const todayTxCount = todayTransactions.length;

  // Complete a new POS Transaction
  const handleCompleteTransaction = (tx: Transaction) => {
    const { updatedItems, newStockLogs } = StorageService.recordTransaction(tx);
    setMenuItems(updatedItems);
    setStockLogs((prev) => [...newStockLogs, ...prev]);
    setTransactions((prev) => [tx, ...prev]);
    setLatestReceiptTx(tx);
  };

  // Adjust or restock an inventory item
  const handleAdjustStock = (
    itemId: string,
    changeAmount: number,
    reason: 'restock' | 'adjustment' | 'spoilage',
    notes?: string
  ) => {
    const result = StorageService.adjustStock(itemId, changeAmount, reason, notes);
    if (result) {
      setMenuItems(result.updatedItems);
      setStockLogs((prev) => [result.newLog, ...prev]);
    }
  };

  // Add new menu item
  const handleAddMenuItem = (newItem: MenuItem) => {
    const updated = [newItem, ...menuItems];
    setMenuItems(updated);
    StorageService.saveMenuItems(updated);

    const log: StockLog = {
      id: `log-${Date.now()}-${newItem.id}`,
      itemId: newItem.id,
      itemName: newItem.name,
      changeAmount: newItem.stock,
      previousStock: 0,
      newStock: newItem.stock,
      reason: 'restock',
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      notes: 'Penambahan menu baru angkringan',
    };
    const updatedLogs = [log, ...stockLogs];
    setStockLogs(updatedLogs);
    StorageService.saveStockLogs(updatedLogs);
  };

  // Update existing menu item
  const handleUpdateMenuItem = (updatedItem: MenuItem) => {
    const updated = menuItems.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    setMenuItems(updated);
    StorageService.saveMenuItems(updated);
  };

  // Delete menu item
  const handleDeleteMenuItem = (itemId: string) => {
    const updated = menuItems.filter((item) => item.id !== itemId);
    setMenuItems(updated);
    StorageService.saveMenuItems(updated);
  };

  // Cancel transaction and optionally restore inventory stock
  const handleCancelTransaction = (txId: string, restoreStock: boolean) => {
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx || targetTx.status === 'cancelled') return;

    let updatedItems = [...menuItems];
    const newLogs: StockLog[] = [];

    if (restoreStock) {
      updatedItems = updatedItems.map((item) => {
        const sold = targetTx.items.find((i) => i.menuItem.id === item.id);
        if (sold) {
          const previousStock = item.stock;
          const newStock = previousStock + sold.quantity;

          const log: StockLog = {
            id: `log-restore-${Date.now()}-${item.id}`,
            itemId: item.id,
            itemName: item.name,
            changeAmount: sold.quantity,
            previousStock,
            newStock,
            reason: 'cancellation_restore',
            referenceId: targetTx.receiptNumber,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            notes: `Pembatalan transaksi ${targetTx.receiptNumber} (+${sold.quantity} ${item.unit})`,
          };
          newLogs.push(log);

          return { ...item, stock: newStock, isAvailable: newStock > 0 };
        }
        return item;
      });

      setMenuItems(updatedItems);
      StorageService.saveMenuItems(updatedItems);

      const allLogs = [...newLogs, ...stockLogs];
      setStockLogs(allLogs);
      StorageService.saveStockLogs(allLogs);
    }

    const updatedTx = transactions.map((t) =>
      t.id === txId ? { ...t, status: 'cancelled' as const } : t
    );
    setTransactions(updatedTx);
    StorageService.saveTransactions(updatedTx);
  };

  // Update store profile
  const handleUpdateStoreProfile = (newProfile: StoreProfile) => {
    setStoreProfile(newProfile);
    StorageService.saveStoreProfile(newProfile);
  };

  // Reset to default menu
  const handleResetDefaultMenu = () => {
    StorageService.resetAllData();
    setMenuItems(DEFAULT_MENU_ITEMS);
    setTransactions([]);
    setStockLogs([]);
    setStoreProfile(DEFAULT_STORE_PROFILE);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold tracking-wide">Memuat Angkringan POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      
      {/* Top Main Navigation & Status Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setIsSettingsOpen(true)}
        storeProfile={storeProfile}
        todayRevenue={todayRevenue}
        todayTxCount={todayTxCount}
      />

      {/* Main Dynamic View Area */}
      <main className="flex-1 pb-12">
        {activeTab === 'pos' && (
          <POSScreen
            menuItems={menuItems}
            storeProfile={storeProfile}
            onCompleteTransaction={handleCompleteTransaction}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryScreen
            menuItems={menuItems}
            stockLogs={stockLogs}
            onAddMenuItem={handleAddMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
            onAdjustStock={handleAdjustStock}
            onResetDefaultMenu={handleResetDefaultMenu}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsScreen
            transactions={transactions}
            storeProfile={storeProfile}
            onCancelTransaction={handleCancelTransaction}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsScreen
            transactions={transactions}
            storeProfile={storeProfile}
          />
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          storeProfile={storeProfile}
          onUpdateStoreProfile={handleUpdateStoreProfile}
          onResetAllData={handleResetDefaultMenu}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Instant Post-Payment Thermal Receipt Modal */}
      {latestReceiptTx && (
        <ReceiptModal
          transaction={latestReceiptTx}
          storeProfile={storeProfile}
          onClose={() => setLatestReceiptTx(null)}
        />
      )}

    </div>
  );
}
