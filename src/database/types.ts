// Database types for Bakery Inventory System

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced';
}

export interface RawMaterial {
  id: number;
  name: string;
  unit: string;
  stock: number;
  min_stock: number;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced';
}

export interface Recipe {
  id: number;
  product_id: number;
  material_id: number;
  quantity_required: number;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced';
}

export interface RecipeWithMaterial extends Recipe {
  material_name: string;
  material_unit: string;
}

export interface Sale {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_method: 'cash' | 'upi' | 'card';
  created_at: string;
  sync_status: 'pending' | 'synced';
}

export interface SaleWithProduct extends Sale {
  product_name: string;
}

export interface Purchase {
  id: number;
  material_id: number;
  supplier_id: number | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
  sync_status: 'pending' | 'synced';
}

export interface PurchaseWithMaterial extends Purchase {
  material_name: string;
  supplier_name: string | null;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  email: string;
  address: string;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced';
}

export interface User {
  id: number;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  pin: string;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced';
}

export interface DashboardStats {
  totalSalesToday: number;
  totalRevenueToday: number;
  lowStockItems: number;
  expiringItems: number;
}

export interface InventoryReport {
  name: string;
  category: string;
  stock: number;
  unit: string;
  expiry_date: string | null;
}

export interface SalesReport {
  product: string;
  quantity: number;
  total_price: number;
  date: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'product' | 'material';
}
