import { MenuItem, Transaction, StockLog, StoreProfile } from '../types';
import { DEFAULT_MENU_ITEMS, DEFAULT_STORE_PROFILE } from '../data/defaultMenu';

const STORAGE_KEYS = {
  MENU_ITEMS: 'angkringan_menu_items_v1',
  TRANSACTIONS: 'angkringan_transactions_v1',
  STOCK_LOGS: 'angkringan_stock_logs_v1',
  STORE_PROFILE: 'angkringan_store_profile_v1',
  SOUND_ENABLED: 'angkringan_sound_enabled_v1',
};

// Generate realistic initial transactions across the past 30 days for rich reporting demonstration
function generateSeedTransactions(menuItems: MenuItem[]): { transactions: Transaction[]; stockLogs: StockLog[] } {
  const transactions: Transaction[] = [];
  const stockLogs: StockLog[] = [];
  const now = new Date();

  // Create transactions for the past 30 days
  let count = 1;
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const targetDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    // Angkringan is busier on weekends (Fri, Sat, Sun) and evenings (17:00 - 23:00)
    const isWeekend = targetDate.getDay() === 5 || targetDate.getDay() === 6 || targetDate.getDay() === 0;
    const txCountForDay = (isWeekend ? Math.floor(Math.random() * 8) + 12 : Math.floor(Math.random() * 6) + 8);

    for (let i = 0; i < txCountForDay; i++) {
      // Pick random evening hour between 17:00 and 23:59
      const hour = Math.floor(Math.random() * 7) + 17;
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      const txTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      
      const txTimestamp = new Date(`${dateStr}T${txTime}`).getTime();

      // Pick 2-6 random items from menu
      const numItems = Math.floor(Math.random() * 4) + 2;
      const selectedItems = [...menuItems].sort(() => 0.5 - Math.random()).slice(0, numItems);
      
      let subtotal = 0;
      let costAmount = 0;
      const cartItems = selectedItems.map((item, idx) => {
        const qty = item.category === 'sate' || item.category === 'gorengan' ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1;
        const itemSubtotal = item.price * qty;
        const itemCost = item.costPrice * qty;
        subtotal += itemSubtotal;
        costAmount += itemCost;

        return {
          id: `item-${txTimestamp}-${idx}`,
          menuItem: item,
          quantity: qty,
          isGrilled: item.canBeGrilled ? Math.random() > 0.4 : false,
          note: item.canBeGrilled && Math.random() > 0.5 ? 'Dibakar manis pedas' : undefined,
          unitPrice: item.price,
          subtotal: itemSubtotal,
        };
      });

      const paymentMethods: Array<'cash' | 'qris' | 'transfer'> = ['cash', 'cash', 'cash', 'qris', 'qris', 'transfer'];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const totalAmount = subtotal;
      const profit = totalAmount - costAmount;

      const receiptNumber = `AKR-${dateStr.replace(/-/g, '')}-${String(count).padStart(4, '0')}`;
      count++;

      let cashReceived: number | undefined = undefined;
      let cashChange: number | undefined = undefined;

      if (paymentMethod === 'cash') {
        const possibleCash = [totalAmount, Math.ceil(totalAmount / 10000) * 10000, Math.ceil(totalAmount / 50000) * 50000, 50000, 100000];
        cashReceived = possibleCash.find(c => c >= totalAmount) || totalAmount;
        cashChange = cashReceived - totalAmount;
      }

      transactions.push({
        id: `tx-${txTimestamp}-${i}`,
        receiptNumber,
        date: dateStr,
        time: txTime,
        timestamp: txTimestamp,
        items: cartItems,
        subtotal,
        discount: 0,
        totalAmount,
        costAmount,
        profit,
        paymentMethod,
        cashReceived,
        cashChange,
        customerName: Math.random() > 0.6 ? ['Mas Budi', 'Mbak Rina', 'Pak Agus', 'Mas Dimas', 'Mbak Ayu', 'Pak Bambang', 'Mas Reza'][Math.floor(Math.random() * 7)] : undefined,
        tableNumber: Math.random() > 0.3 ? `Meja ${Math.floor(Math.random() * 8) + 1}` : 'Lesehan',
        orderType: Math.random() > 0.25 ? 'dine_in' : 'takeaway',
        status: 'completed',
        cashierName: 'Mas Joko',
        notes: '',
      });
    }
  }

  // Sort latest first
  transactions.sort((a, b) => b.timestamp - a.timestamp);

  // Generate initial stock restock logs
  menuItems.forEach((item, index) => {
    stockLogs.push({
      id: `seed-log-${index}`,
      itemId: item.id,
      itemName: item.name,
      changeAmount: item.stock,
      previousStock: 0,
      newStock: item.stock,
      reason: 'restock',
      timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Stok awal kedai angkringan',
    });
  });

  return { transactions, stockLogs };
}

export const StorageService = {
  getMenuItems(): MenuItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    // Initialize default
    const defaults = DEFAULT_MENU_ITEMS;
    this.saveMenuItems(defaults);
    return defaults;
  },

  saveMenuItems(items: MenuItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save menu items', e);
    }
  },

  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }

    // Seed realistic 30-day demo transactions so report analytics are instantly useful
    const menuItems = this.getMenuItems();
    const seed = generateSeedTransactions(menuItems);
    this.saveTransactions(seed.transactions);
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_LOGS)) {
      this.saveStockLogs(seed.stockLogs);
    }
    return seed.transactions;
  },

  saveTransactions(transactions: Transaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions', e);
    }
  },

  getStockLogs(): StockLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STOCK_LOGS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return [];
  },

  saveStockLogs(logs: StockLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save stock logs', e);
    }
  },

  getStoreProfile(): StoreProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STORE_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    const profile = DEFAULT_STORE_PROFILE;
    this.saveStoreProfile(profile);
    return profile;
  },

  saveStoreProfile(profile: StoreProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STORE_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save store profile', e);
    }
  },

  // Record a new transaction and update inventory in real-time
  recordTransaction(transaction: Transaction): { updatedItems: MenuItem[]; newStockLogs: StockLog[] } {
    const currentItems = this.getMenuItems();
    const currentLogs = this.getStockLogs();
    const currentTransactions = this.getTransactions();

    const newLogs: StockLog[] = [];

    // Deduct stock for each cart item
    const updatedItems = currentItems.map((item) => {
      const soldItem = transaction.items.find((ci) => ci.menuItem.id === item.id);
      if (soldItem) {
        const previousStock = item.stock;
        const newStock = Math.max(0, previousStock - soldItem.quantity);

        const log: StockLog = {
          id: `log-${Date.now()}-${item.id}`,
          itemId: item.id,
          itemName: item.name,
          changeAmount: -soldItem.quantity,
          previousStock,
          newStock,
          reason: 'sale',
          referenceId: transaction.receiptNumber,
          timestamp: transaction.timestamp,
          date: transaction.date,
          notes: `Penjualan no. ${transaction.receiptNumber} (${soldItem.quantity} ${item.unit})`,
        };
        newLogs.push(log);

        return {
          ...item,
          stock: newStock,
          isAvailable: newStock > 0,
        };
      }
      return item;
    });

    // Save updated items, logs, and transactions
    this.saveMenuItems(updatedItems);
    this.saveStockLogs([...newLogs, ...currentLogs]);
    this.saveTransactions([transaction, ...currentTransactions]);

    return { updatedItems, newStockLogs: newLogs };
  },

  // Restock or adjust inventory item
  adjustStock(
    itemId: string,
    changeAmount: number,
    reason: 'restock' | 'adjustment' | 'spoilage',
    notes?: string
  ): { updatedItems: MenuItem[]; newLog: StockLog } | null {
    const currentItems = this.getMenuItems();
    const currentLogs = this.getStockLogs();
    const itemIndex = currentItems.findIndex((i) => i.id === itemId);

    if (itemIndex === -1) return null;

    const item = currentItems[itemIndex];
    const previousStock = item.stock;
    const newStock = Math.max(0, previousStock + changeAmount);

    const log: StockLog = {
      id: `log-${Date.now()}-${item.id}`,
      itemId: item.id,
      itemName: item.name,
      changeAmount,
      previousStock,
      newStock,
      reason,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      notes: notes || (changeAmount > 0 ? `Tambah stok +${changeAmount} ${item.unit}` : `Koreksi stok ${changeAmount} ${item.unit}`),
    };

    const updatedItem = {
      ...item,
      stock: newStock,
      isAvailable: newStock > 0,
    };

    const updatedItems = [...currentItems];
    updatedItems[itemIndex] = updatedItem;

    this.saveMenuItems(updatedItems);
    this.saveStockLogs([log, ...currentLogs]);

    return { updatedItems, newLog: log };
  },

  // Export full application state as JSON file
  exportBackupJSON(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      storeProfile: this.getStoreProfile(),
      menuItems: this.getMenuItems(),
      transactions: this.getTransactions(),
      stockLogs: this.getStockLogs(),
      version: '1.0',
    };
    return JSON.stringify(data, null, 2);
  },

  // Import application state from JSON
  importBackupJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.menuItems && Array.isArray(data.menuItems)) {
        this.saveMenuItems(data.menuItems);
      }
      if (data.transactions && Array.isArray(data.transactions)) {
        this.saveTransactions(data.transactions);
      }
      if (data.stockLogs && Array.isArray(data.stockLogs)) {
        this.saveStockLogs(data.stockLogs);
      }
      if (data.storeProfile) {
        this.saveStoreProfile(data.storeProfile);
      }
      return true;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  },

  // Reset data to defaults
  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.MENU_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.STOCK_LOGS);
    localStorage.removeItem(STORAGE_KEYS.STORE_PROFILE);
  },
};
