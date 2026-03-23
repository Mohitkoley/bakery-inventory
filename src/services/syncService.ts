import { getDatabase } from "../database/sqlite";
import { getSupabaseClient } from "./supabaseClient";

interface SyncRecord {
  table_name: string;
  record_id: number;
  action: string;
  synced_at: string | null;
}

export const syncService = {
  async pushChanges(): Promise<{ success: boolean; pushed: number }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, pushed: 0 };
    }

    const db = getDatabase();
    const pendingRecords = db.prepare(`
      SELECT * FROM sync_log WHERE synced_at IS NULL ORDER BY created_at
    `).all() as SyncRecord[];

    if (pendingRecords.length === 0) {
      return { success: true, pushed: 0 };
    }

    let pushed = 0;
    for (const record of pendingRecords) {
      try {
        const tableData = db.prepare(`SELECT * FROM ${record.table_name} WHERE id = ?`).get(record.record_id);
        
        if (tableData && typeof tableData === 'object') {
          const dataWithDevice = { 
            ...tableData, 
            device_id: 'local-device',
            synced_at: new Date().toISOString()
          };
          
          const { error } = await supabase
            .from(record.table_name)
            .upsert(dataWithDevice);

          if (!error) {
            db.prepare(`UPDATE sync_log SET synced_at = datetime('now') WHERE id = ?`).run(record.id);
            db.prepare(`UPDATE ${record.table_name} SET sync_status = 'synced' WHERE id = ?`).run(record.record_id);
            pushed++;
          }
        }
      } catch (err) {
        console.error(`Failed to sync ${record.table_name}:${record.record_id}`, err);
      }
    }

    return { success: true, pushed };
  },

  async pullChanges(): Promise<{ success: boolean; pulled: number }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, pulled: 0 };
    }

    const db = getDatabase();
    const tables = ['products', 'raw_materials', 'recipes', 'sales', 'purchases', 'suppliers', 'users'];
    let pulled = 0;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (!error && data) {
          for (const row of data) {
            const existing = db.prepare(`SELECT id, updated_at FROM ${table} WHERE id = ?`).get(row.id) as { updated_at: string } | undefined;
            
            if (!existing || new Date(row.updated_at) > new Date(existing.updated_at)) {
              const { sync_status, created_at, updated_at, ...dataWithoutMeta } = row;
              const fields = Object.keys(dataWithoutMeta).map(k => `${k} = @${k}`).join(", ");
              
              if (existing) {
                db.prepare(`UPDATE ${table} SET ${fields}, sync_status = 'synced' WHERE id = @id`).run(dataWithoutMeta);
              } else {
                const columns = Object.keys(dataWithoutMeta).join(", ");
                const values = Object.keys(dataWithoutMeta).map(k => `@${k}`).join(", ");
                db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${values})`).run(dataWithoutMeta);
              }
              pulled++;
            }
          }
        }
      } catch (err) {
        console.error(`Failed to pull from ${table}`, err);
      }
    }

    return { success: true, pulled };
  },

  async sync(): Promise<{ success: boolean; pushed: number; pulled: number }> {
    const pushResult = await this.pushChanges();
    const pullResult = await this.pullChanges();
    
    return {
      success: pushResult.success && pullResult.success,
      pushed: pushResult.pushed,
      pulled: pullResult.pulled
    };
  },

  getSyncStatus(): { pending: number; lastSync: string | null } {
    const db = getDatabase();
    const pending = db.prepare("SELECT COUNT(*) as count FROM sync_log WHERE synced_at IS NULL").get() as { count: number };
    const lastSync = db.prepare("SELECT MAX(synced_at) as last FROM sync_log WHERE synced_at IS NOT NULL").get() as { last: string | null };
    
    return { pending: pending.count, lastSync: lastSync.last };
  }
};
