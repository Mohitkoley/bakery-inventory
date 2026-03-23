import { runQuery, runInsert, runUpdate, saveDatabase } from "../sqlite";
import type { Purchase, PurchaseWithMaterial, Supplier } from "../types";
import { rawMaterialsRepository } from "./rawMaterials";

export const purchasesRepository = {
  getAll(): PurchaseWithMaterial[] {
    return runQuery(`
      SELECT p.*, rm.name as material_name, s.name as supplier_name
      FROM purchases p
      JOIN raw_materials rm ON p.material_id = rm.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.created_at DESC
    `);
  },

  getById(id: number): PurchaseWithMaterial | undefined {
    const results = runQuery(`
      SELECT p.*, rm.name as material_name, s.name as supplier_name
      FROM purchases p
      JOIN raw_materials rm ON p.material_id = rm.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `, [id]);
    return results[0];
  },

  getByDateRange(startDate: string, endDate: string): PurchaseWithMaterial[] {
    return runQuery(`
      SELECT p.*, rm.name as material_name, s.name as supplier_name
      FROM purchases p
      JOIN raw_materials rm ON p.material_id = rm.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.created_at >= ? AND p.created_at <= ?
      ORDER BY p.created_at DESC
    `, [startDate, endDate]);
  },

  create(purchase: Omit<Purchase, "id" | "created_at" | "sync_status">): Purchase {
    const result = runInsert(`
      INSERT INTO purchases (material_id, supplier_id, quantity, unit_cost, total_cost)
      VALUES (?, ?, ?, ?, ?)
    `, [purchase.material_id, purchase.supplier_id, purchase.quantity, purchase.unit_cost, purchase.total_cost]);
    
    rawMaterialsRepository.updateStock(purchase.material_id, purchase.quantity);
    
    return this.getById(result)!;
  },

  delete(id: number): boolean {
    const purchase = this.getById(id);
    if (!purchase) return false;
    
    rawMaterialsRepository.updateStock(purchase.material_id, -purchase.quantity);
    
    const changes = runUpdate("DELETE FROM purchases WHERE id = ?", [id]);
    return changes > 0;
  },

  getDailyStats(date: string = new Date().toISOString().split("T")[0]): { count: number; total: number } {
    const results = runQuery(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_cost), 0) as total
      FROM purchases
      WHERE date(created_at) = date(?)
    `, [date]);
    return results[0] || { count: 0, total: 0 };
  }
};

export const suppliersRepository = {
  getAll(): Supplier[] {
    return runQuery("SELECT * FROM suppliers ORDER BY name");
  },

  getById(id: number): Supplier | undefined {
    const results = runQuery("SELECT * FROM suppliers WHERE id = ?", [id]);
    return results[0];
  },

  create(supplier: Omit<Supplier, "id" | "created_at" | "updated_at" | "sync_status">): Supplier {
    const now = new Date().toISOString();
    const result = runInsert(`
      INSERT INTO suppliers (name, contact, email, address, created_at, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [supplier.name, supplier.contact, supplier.email, supplier.address, now, now]);
    
    return this.getById(result)!;
  },

  update(id: number, supplier: Partial<Omit<Supplier, "id" | "created_at" | "updated_at" | "sync_status">>): Supplier | undefined {
    const sets: string[] = [];
    const values: any[] = [];
    
    Object.entries(supplier).forEach(([key, value]) => {
      sets.push(`${key} = ?`);
      values.push(value);
    });
    
    if (sets.length === 0) return this.getById(id);
    
    sets.push("updated_at = ?");
    values.push(new Date().toISOString());
    sets.push("sync_status = 'pending'");
    values.push(id);
    
    runUpdate(`UPDATE suppliers SET ${sets.join(", ")} WHERE id = ?`, values);
    
    return this.getById(id);
  },

  delete(id: number): boolean {
    const changes = runUpdate("DELETE FROM suppliers WHERE id = ?", [id]);
    return changes > 0;
  }
};
