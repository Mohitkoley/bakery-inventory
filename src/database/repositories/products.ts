import { runQuery, runInsert, runUpdate, saveDatabase } from "../sqlite";
import type { Product } from "../types";

export const productsRepository = {
  getAll(): Product[] {
    return runQuery("SELECT * FROM products ORDER BY name");
  },

  getById(id: number): Product | undefined {
    const results = runQuery("SELECT * FROM products WHERE id = ?", [id]);
    return results[0];
  },

  getByCategory(category: string): Product[] {
    return runQuery("SELECT * FROM products WHERE category = ? ORDER BY name", [category]);
  },

  create(product: Omit<Product, "id" | "created_at" | "updated_at" | "sync_status">): Product {
    const now = new Date().toISOString();
    const result = runInsert(`
      INSERT INTO products (name, category, price, stock, expiry_date, created_at, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [product.name, product.category, product.price, product.stock, product.expiry_date, now, now]);
    
    return this.getById(result)!;
  },

  update(id: number, product: Partial<Omit<Product, "id" | "created_at" | "updated_at" | "sync_status">>): Product | undefined {
    const sets: string[] = [];
    const values: any[] = [];
    
    Object.entries(product).forEach(([key, value]) => {
      sets.push(`${key} = ?`);
      values.push(value);
    });
    
    if (sets.length === 0) return this.getById(id);
    
    sets.push("updated_at = ?");
    values.push(new Date().toISOString());
    sets.push("sync_status = 'pending'");
    values.push(id);
    
    runUpdate(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`, values);
    
    return this.getById(id);
  },

  delete(id: number): boolean {
    const changes = runUpdate("DELETE FROM products WHERE id = ?", [id]);
    return changes > 0;
  },

  getLowStock(threshold: number = 10): Product[] {
    return runQuery("SELECT * FROM products WHERE stock <= ? ORDER BY stock", [threshold]);
  },

  getExpiring(days: number = 7): Product[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return runQuery(`
      SELECT * FROM products 
      WHERE expiry_date IS NOT NULL AND expiry_date <= ?
      ORDER BY expiry_date
    `, [futureDate.toISOString().split("T")[0]]);
  },

  updateStock(id: number, quantity: number): boolean {
    const changes = runUpdate(`
      UPDATE products SET stock = stock + ?, updated_at = datetime('now'), sync_status = 'pending'
      WHERE id = ?
    `, [quantity, id]);
    return changes > 0;
  }
};
