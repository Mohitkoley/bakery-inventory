import { runQuery, runInsert, runUpdate } from "../sqlite";

export const categoriesRepository = {
  getAll(): { id: number; name: string; type: 'product' | 'material' }[] {
    return runQuery("SELECT * FROM categories ORDER BY type, name");
  },

  getById(id: number): { id: number; name: string; type: 'product' | 'material' } | undefined {
    const results = runQuery("SELECT * FROM categories WHERE id = ?", [id]);
    return results[0];
  },

  getByType(type: 'product' | 'material'): { id: number; name: string; type: string }[] {
    return runQuery("SELECT * FROM categories WHERE type = ? ORDER BY name", [type]);
  },

  create(category: { name: string; type: 'product' | 'material' }): { id: number; name: string; type: string } {
    const result = runInsert(`
      INSERT INTO categories (name, type) VALUES (?, ?)
    `, [category.name, category.type]);
    return this.getById(result)!;
  },

  update(id: number, name: string): { id: number; name: string; type: string } | undefined {
    runUpdate("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
    return this.getById(id);
  },

  delete(id: number): boolean {
    const changes = runUpdate("DELETE FROM categories WHERE id = ?", [id]);
    return changes > 0;
  }
};
