import initSqlJs, { Database as SqlJsDatabase } from "sql.js/dist/sql-wasm.js";

let db: SqlJsDatabase | null = null;

const DB_STORAGE_KEY = "bakery_inventory_db";

export async function initDatabase(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });
  
  const savedData = localStorage.getItem(DB_STORAGE_KEY);
  if (savedData) {
    try {
      const binaryArray = Uint8Array.from(atob(savedData), c => c.charCodeAt(0));
      db = new SQL.Database(binaryArray);
    } catch {
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }
  
  initializeTables();
  return db;
}

function initializeTables(): void {
  if (!db) return;
  
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      expiry_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS raw_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      stock REAL NOT NULL DEFAULT 0,
      min_stock REAL NOT NULL DEFAULT 0,
      expiry_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      quantity_required REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (material_id) REFERENCES raw_materials(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      created_at TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      supplier_id INTEGER,
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (material_id) REFERENCES raw_materials(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      email TEXT,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      pin TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'product'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      synced_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const userCount = db.exec("SELECT COUNT(*) as count FROM users");
  if (userCount[0]?.values[0]?.[0] === 0) {
    db.run(`INSERT INTO users (name, role, pin) VALUES ('Admin', 'admin', '1234')`);
    db.run(`INSERT INTO users (name, role, pin) VALUES ('Manager', 'manager', '5678')`);
    db.run(`INSERT INTO users (name, role, pin) VALUES ('Staff', 'staff', '0000')`);
  }

  const categoryCount = db.exec("SELECT COUNT(*) as count FROM categories");
  if (categoryCount[0]?.values[0]?.[0] === 0) {
    const productCategories = ['Cakes', 'Breads', 'Pastries', 'Cookies', 'Beverages', 'Snacks', 'Other'];
    const materialCategories = ['Flour & Grains', 'Sugar & Sweeteners', 'Dairy', 'Fats & Oils', 'Eggs', 'Flavorings', 'Toppings', 'Packaging', 'Other'];
    
    productCategories.forEach(name => {
      db.run(`INSERT INTO categories (name, type) VALUES (?, 'product')`, [name]);
    });
    
    materialCategories.forEach(name => {
      db.run(`INSERT INTO categories (name, type) VALUES (?, 'material')`, [name]);
    });
  }
  
  saveDatabase();
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const base64 = btoa(String.fromCharCode(...data));
  localStorage.setItem(DB_STORAGE_KEY, base64);
}

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (!db) {
    await initDatabase();
  }
  return db!;
}

export function runQuery(sql: string, params: any[] = []): any[] {
  if (!db) return [];
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const results: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row);
    }
    stmt.free();
    return results;
  } catch (e) {
    console.error("SQL Error:", e);
    return [];
  }
}

export function runInsert(sql: string, params: any[] = []): number {
  if (!db) return 0;
  try {
    db.run(sql, params);
    const result = db.exec("SELECT last_insert_rowid() as id");
    saveDatabase();
    return result[0]?.values[0]?.[0] as number || 0;
  } catch (e) {
    console.error("SQL Insert Error:", e);
    return 0;
  }
}

export function runUpdate(sql: string, params: any[] = []): number {
  if (!db) return 0;
  try {
    db.run(sql, params);
    saveDatabase();
    return db.getRowsModified();
  } catch (e) {
    console.error("SQL Update Error:", e);
    return 0;
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}
