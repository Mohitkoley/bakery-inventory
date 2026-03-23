import { runQuery, runInsert, runUpdate } from "../sqlite";
import type { Sale, SaleWithProduct } from "../types";
import { productsRepository } from "./products";
import { rawMaterialsRepository } from "./rawMaterials";
import { recipesRepository } from "./recipes";

export const salesRepository = {
  getAll(): SaleWithProduct[] {
    return runQuery(`
      SELECT s.*, p.name as product_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ORDER BY s.created_at DESC
    `);
  },

  getById(id: number): SaleWithProduct | undefined {
    const results = runQuery(`
      SELECT s.*, p.name as product_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.id = ?
    `, [id]);
    return results[0];
  },

  getByDateRange(startDate: string, endDate: string): SaleWithProduct[] {
    return runQuery(`
      SELECT s.*, p.name as product_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE date(s.created_at) >= date(?) AND date(s.created_at) <= date(?)
      ORDER BY s.created_at DESC
    `, [startDate, endDate]);
  },

  getToday(): SaleWithProduct[] {
    const today = new Date().toISOString().split("T")[0];
    return runQuery(`
      SELECT s.*, p.name as product_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE date(s.created_at) = date(?)
      ORDER BY s.created_at DESC
    `, [today]);
  },

  create(sale: Omit<Sale, "id" | "created_at" | "sync_status">): Sale {
    const result = runInsert(`
      INSERT INTO sales (product_id, quantity, unit_price, total_price, payment_method)
      VALUES (?, ?, ?, ?, ?)
    `, [sale.product_id, sale.quantity, sale.unit_price, sale.total_price, sale.payment_method]);
    
    productsRepository.updateStock(sale.product_id, -sale.quantity);
    
    const requiredMaterials = recipesRepository.getRequiredMaterials(sale.product_id);
    for (const mat of requiredMaterials) {
      rawMaterialsRepository.updateStock(mat.materialId, -(mat.quantity * sale.quantity));
    }
    
    return this.getById(result)!;
  },

  delete(id: number): boolean {
    const sale = this.getById(id);
    if (!sale) return false;
    
    productsRepository.updateStock(sale.product_id, sale.quantity);
    
    const requiredMaterials = recipesRepository.getRequiredMaterials(sale.product_id);
    for (const mat of requiredMaterials) {
      rawMaterialsRepository.updateStock(mat.materialId, mat.quantity * sale.quantity);
    }
    
    const changes = runUpdate("DELETE FROM sales WHERE id = ?", [id]);
    return changes > 0;
  },

  getDailyStats(date: string = new Date().toISOString().split("T")[0]): { count: number; total: number } {
    const results = runQuery(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total
      FROM sales
      WHERE date(created_at) = date(?)
    `, [date]);
    return results[0] || { count: 0, total: 0 };
  },

  getMonthlyStats(year: number, month: number): { count: number; total: number } {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
    const results = runQuery(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total
      FROM sales
      WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
    `, [startDate, endDate]);
    return results[0] || { count: 0, total: 0 };
  }
};
