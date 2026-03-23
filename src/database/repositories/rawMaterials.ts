import { runQuery, runInsert, runUpdate, saveDatabase } from "../sqlite";
import type { RawMaterial } from "../types";

export const rawMaterialsRepository = {
  getAll(): RawMaterial[] {
    return runQuery("SELECT * FROM raw_materials ORDER BY name");
  },

  getById(id: number): RawMaterial | undefined {
    const results = runQuery("SELECT * FROM raw_materials WHERE id = ?", [id]);
    return results[0];
  },

  getLowStock(): RawMaterial[] {
    return runQuery("SELECT * FROM raw_materials WHERE stock <= min_stock ORDER BY stock");
  },

  getExpiring(days: number = 7): RawMaterial[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return runQuery(`
      SELECT * FROM raw_materials 
      WHERE expiry_date IS NOT NULL AND expiry_date <= ?
      ORDER BY expiry_date
    `, [futureDate.toISOString().split("T")[0]]);
  },

  create(material: Omit<RawMaterial, "id" | "created_at" | "updated_at" | "sync_status">): RawMaterial {
    const now = new Date().toISOString();
    const result = runInsert(`
      INSERT INTO raw_materials (name, unit, stock, min_stock, expiry_date, created_at, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [material.name, material.unit, material.stock, material.min_stock, material.expiry_date, now, now]);
    
    return this.getById(result)!;
  },

  update(id: number, material: Partial<Omit<RawMaterial, "id" | "created_at" | "updated_at" | "sync_status">>): RawMaterial | undefined {
    const sets: string[] = [];
    const values: any[] = [];
    
    Object.entries(material).forEach(([key, value]) => {
      sets.push(`${key} = ?`);
      values.push(value);
    });
    
    if (sets.length === 0) return this.getById(id);
    
    sets.push("updated_at = ?");
    values.push(new Date().toISOString());
    sets.push("sync_status = 'pending'");
    values.push(id);
    
    runUpdate(`UPDATE raw_materials SET ${sets.join(", ")} WHERE id = ?`, values);
    
    return this.getById(id);
  },

  delete(id: number): boolean {
    const changes = runUpdate("DELETE FROM raw_materials WHERE id = ?", [id]);
    return changes > 0;
  },

  updateStock(id: number, quantity: number): boolean {
    const changes = runUpdate(`
      UPDATE raw_materials SET stock = stock + ?, updated_at = datetime('now'), sync_status = 'pending'
      WHERE id = ?
    `, [quantity, id]);
    return changes > 0;
  }
};
