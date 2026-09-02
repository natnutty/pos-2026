export type Category = 'nasi' | 'sate' | 'gorengan' | 'minuman' | 'camilan' | 'lainnya';

export interface MenuItem {
  id: string;
  name: string;
  nameEn?: string;
  category: Category;
  price: number; // Harga jual
  costPrice: number; // Harga modal / HPP
  stock: number; // Stok saat ini
  minStockThreshold: number; // Batas minimum peringatan stok menipis
  unit: string; // 'bungkus', 'tusuk', 'pcs', 'gelas', 'porsi'
  isAvailable: boolean;
  canBeGrilled?: boolean; // Pilihan bakar khas angkringan (e.g. sate, nasi, gorengan)
  description?: string;
  descriptionEn?: string;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  isGrilled?: boolean; // Dibakar
  note?: string; // Catatan khusus (e.g., "Manis pedas", "Tanpa es")
  unitPrice: number;
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'qris' | 'transfer';
export type OrderType = 'dine_in' | 'takeaway';
export type TransactionStatus = 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  receiptNumber: string; // e.g. AKR-20260901-001
  date: string; // ISO string YYYY-MM-DD
  time: string; // HH:mm:ss
  timestamp: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  costAmount: number; // Total HPP
  profit: number; // totalAmount - costAmount
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  cashChange?: number;
  customerName?: string;
  tableNumber?: string;
  orderType: OrderType;
  status: TransactionStatus;
  cashierName: string;
  notes?: string;
}

export interface StockLog {
  id: string;
  itemId: string;
  itemName: string;
  changeAmount: number; // + or -
  previousStock: number;
  newStock: number;
  reason: 'sale' | 'restock' | 'spoilage' | 'adjustment' | 'cancellation_restore';
  referenceId?: string; // e.g. receiptNumber
  timestamp: number;
  date: string;
  notes?: string;
}

export interface StoreProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  footerMessage: string;
  cashierName: string;
}

export type ReportPeriod = 'today' | 'yesterday' | 'weekly' | 'monthly' | 'custom';
