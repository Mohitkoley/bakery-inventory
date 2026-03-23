import { runQuery, runInsert, runUpdate, saveDatabase } from "../sqlite";
import type { User } from "../types";

export const usersRepository = {
  getAll(): Omit<User, "pin">[] {
    return runQuery("SELECT id, name, role, created_at, updated_at, sync_status FROM users ORDER BY name");
  },

  getById(id: number): Omit<User, "pin"> | undefined {
    const results = runQuery("SELECT id, name, role, created_at, updated_at, sync_status FROM users WHERE id = ?", [id]);
    return results[0];
  },

  authenticate(pin: string): User | undefined {
    const results = runQuery("SELECT * FROM users WHERE pin = ?", [pin]);
    return results[0];
  },

  create(user: Omit<User, "id" | "created_at" | "updated_at" | "sync_status">): User {
    const now = new Date().toISOString();
    const result = runInsert(`
      INSERT INTO users (name, role, pin, created_at, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [user.name, user.role, user.pin, now, now]);
    
    const results = runQuery("SELECT * FROM users WHERE id = ?", [result]);
    return results[0];
  },

  update(id: number, user: Partial<Omit<User, "id" | "created_at" | "updated_at" | "sync_status">>): Omit<User, "pin"> | undefined {
    const sets: string[] = [];
    const values: any[] = [];
    
    Object.entries(user).forEach(([key, value]) => {
      sets.push(`${key} = ?`);
      values.push(value);
    });
    
    if (sets.length === 0) return this.getById(id);
    
    sets.push("updated_at = ?");
    values.push(new Date().toISOString());
    sets.push("sync_status = 'pending'");
    values.push(id);
    
    runUpdate(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, values);
    
    return this.getById(id);
  },

  delete(id: number): boolean {
    const changes = runUpdate("DELETE FROM users WHERE id = ?", [id]);
    return changes > 0;
  }
};
