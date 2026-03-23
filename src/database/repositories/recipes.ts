import { runQuery, runInsert, runUpdate, saveDatabase } from "../sqlite";
import type { Recipe, RecipeWithMaterial } from "../types";

export const recipesRepository = {
  getAll(): RecipeWithMaterial[] {
    return runQuery(`
      SELECT r.*, rm.name as material_name, rm.unit as material_unit
      FROM recipes r
      JOIN raw_materials rm ON r.material_id = rm.id
      ORDER BY r.product_id
    `);
  },

  getByProductId(productId: number): RecipeWithMaterial[] {
    return runQuery(`
      SELECT r.*, rm.name as material_name, rm.unit as material_unit
      FROM recipes r
      JOIN raw_materials rm ON r.material_id = rm.id
      WHERE r.product_id = ?
    `, [productId]);
  },

  getById(id: number): Recipe | undefined {
    const results = runQuery("SELECT * FROM recipes WHERE id = ?", [id]);
    return results[0];
  },

  create(recipe: Omit<Recipe, "id" | "created_at" | "updated_at" | "sync_status">): Recipe {
    const now = new Date().toISOString();
    const result = runInsert(`
      INSERT INTO recipes (product_id, material_id, quantity_required, created_at, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [recipe.product_id, recipe.material_id, recipe.quantity_required, now, now]);
    
    return this.getById(result)!;
  },

  update(id: number, recipe: Partial<Omit<Recipe, "id" | "created_at" | "updated_at" | "sync_status">>): Recipe | undefined {
    const sets: string[] = [];
    const values: any[] = [];
    
    Object.entries(recipe).forEach(([key, value]) => {
      sets.push(`${key} = ?`);
      values.push(value);
    });
    
    if (sets.length === 0) return this.getById(id);
    
    sets.push("updated_at = ?");
    values.push(new Date().toISOString());
    sets.push("sync_status = 'pending'");
    values.push(id);
    
    runUpdate(`UPDATE recipes SET ${sets.join(", ")} WHERE id = ?`, values);
    
    return this.getById(id);
  },

  delete(id: number): boolean {
    const changes = runUpdate("DELETE FROM recipes WHERE id = ?", [id]);
    return changes > 0;
  },

  deleteByProductId(productId: number): boolean {
    const changes = runUpdate("DELETE FROM recipes WHERE product_id = ?", [productId]);
    return changes > 0;
  },

  getRequiredMaterials(productId: number): { materialId: number; quantity: number }[] {
    const results = runQuery(`
      SELECT material_id, quantity_required as quantity
      FROM recipes WHERE product_id = ?
    `, [productId]);
    return results.map(r => ({ materialId: r.material_id, quantity: r.quantity }));
  }
};
