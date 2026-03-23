import { create } from "zustand";
import { initDatabase } from "../database/sqlite";
import type { Product, RawMaterial, Sale, Supplier, User, DashboardStats } from "../database/types";
import { productsRepository, rawMaterialsRepository, salesRepository, suppliersRepository, usersRepository } from "../database/repositories";

let dbInitialized = false;

async function initializeAppDatabase() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  currentView: string;
  products: Product[];
  rawMaterials: RawMaterial[];
  sales: Sale[];
  suppliers: Supplier[];
  users: Omit<User, "pin">[];
  dashboardStats: DashboardStats;
  
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  setView: (view: string) => void;
  
  loadProducts: () => void;
  addProduct: (product: Omit<Product, "id" | "created_at" | "updated_at" | "sync_status">) => Product;
  updateProduct: (id: number, product: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  
  loadRawMaterials: () => void;
  addRawMaterial: (material: Omit<RawMaterial, "id" | "created_at" | "updated_at" | "sync_status">) => RawMaterial;
  updateRawMaterial: (id: number, material: Partial<RawMaterial>) => void;
  deleteRawMaterial: (id: number) => void;
  
  loadSales: () => void;
  addSale: (sale: Omit<Sale, "id" | "created_at" | "sync_status">) => Sale;
  deleteSale: (id: number) => void;
  
  loadSuppliers: () => void;
  addSupplier: (supplier: Omit<Supplier, "id" | "created_at" | "updated_at" | "sync_status">) => Supplier;
  updateSupplier: (id: number, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: number) => void;
  
  loadUsers: () => void;
  addUser: (user: Omit<User, "id" | "created_at" | "updated_at" | "sync_status">) => User;
  updateUser: (id: number, user: Partial<User>) => void;
  deleteUser: (id: number) => void;
  
  loadDashboardStats: () => void;
  refresh: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  currentView: "dashboard",
  products: [],
  rawMaterials: [],
  sales: [],
  suppliers: [],
  users: [],
  dashboardStats: {
    totalSalesToday: 0,
    totalRevenueToday: 0,
    lowStockItems: 0,
    expiringItems: 0
  },

  login: async (pin: string) => {
    await initializeAppDatabase();
    const user = usersRepository.authenticate(pin);
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false, currentView: "dashboard" });
  },

  setView: (view: string) => {
    set({ currentView: view });
  },

  loadProducts: () => {
    const products = productsRepository.getAll();
    set({ products });
  },

  addProduct: (product) => {
    const newProduct = productsRepository.create(product);
    get().loadProducts();
    get().loadDashboardStats();
    return newProduct;
  },

  updateProduct: (id, product) => {
    productsRepository.update(id, product);
    get().loadProducts();
    get().loadDashboardStats();
  },

  deleteProduct: (id) => {
    productsRepository.delete(id);
    get().loadProducts();
    get().loadDashboardStats();
  },

  loadRawMaterials: () => {
    const rawMaterials = rawMaterialsRepository.getAll();
    set({ rawMaterials });
  },

  addRawMaterial: (material) => {
    const newMaterial = rawMaterialsRepository.create(material);
    get().loadRawMaterials();
    get().loadDashboardStats();
    return newMaterial;
  },

  updateRawMaterial: (id, material) => {
    rawMaterialsRepository.update(id, material);
    get().loadRawMaterials();
    get().loadDashboardStats();
  },

  deleteRawMaterial: (id) => {
    rawMaterialsRepository.delete(id);
    get().loadRawMaterials();
    get().loadDashboardStats();
  },

  loadSales: () => {
    const sales = salesRepository.getToday();
    set({ sales });
  },

  addSale: (sale) => {
    const newSale = salesRepository.create(sale);
    get().loadSales();
    get().loadProducts();
    get().loadRawMaterials();
    get().loadDashboardStats();
    return newSale;
  },

  deleteSale: (id) => {
    salesRepository.delete(id);
    get().loadSales();
    get().loadProducts();
    get().loadRawMaterials();
    get().loadDashboardStats();
  },

  loadSuppliers: () => {
    const suppliers = suppliersRepository.getAll();
    set({ suppliers });
  },

  addSupplier: (supplier) => {
    const newSupplier = suppliersRepository.create(supplier);
    get().loadSuppliers();
    return newSupplier;
  },

  updateSupplier: (id, supplier) => {
    suppliersRepository.update(id, supplier);
    get().loadSuppliers();
  },

  deleteSupplier: (id) => {
    suppliersRepository.delete(id);
    get().loadSuppliers();
  },

  loadUsers: () => {
    const users = usersRepository.getAll();
    set({ users });
  },

  addUser: (user) => {
    const newUser = usersRepository.create(user);
    get().loadUsers();
    return newUser;
  },

  updateUser: (id, user) => {
    usersRepository.update(id, user);
    get().loadUsers();
  },

  deleteUser: (id) => {
    usersRepository.delete(id);
    get().loadUsers();
  },

  loadDashboardStats: () => {
    const salesStats = salesRepository.getDailyStats();
    const lowStockProducts = productsRepository.getLowStock(10);
    const lowStockMaterials = rawMaterialsRepository.getLowStock();
    const expiringProducts = productsRepository.getExpiring(7);
    const expiringMaterials = rawMaterialsRepository.getExpiring(7);

    set({
      dashboardStats: {
        totalSalesToday: salesStats.count,
        totalRevenueToday: salesStats.total,
        lowStockItems: lowStockProducts.length + lowStockMaterials.length,
        expiringItems: expiringProducts.length + expiringMaterials.length
      }
    });
  },

  refresh: () => {
    get().loadProducts();
    get().loadRawMaterials();
    get().loadSales();
    get().loadSuppliers();
    get().loadUsers();
    get().loadDashboardStats();
  }
}));
