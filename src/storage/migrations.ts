import { run, getFirst } from "./db";

export function initDb() {
  run(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);

  const row = getFirst<{ value: string }>(`SELECT value FROM meta WHERE key = ?;`, ["schema_version"]);
  const ver = row ? Number(row.value) : 0;

  if (ver < 1) {
    migrateV1();
    run(`INSERT OR REPLACE INTO meta(key, value) VALUES(?, ?);`, ["schema_version", "1"]);
  }
}

function migrateV1() {
  run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      inv_num TEXT,
      inv_date TEXT,
      random_code TEXT,
      seller_id TEXT,
      total INTEGER,
      raw_left TEXT NOT NULL,
      raw_right TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      name TEXT NOT NULL,
      qty REAL NOT NULL,
      unit_price REAL NOT NULL,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id)
    );
  `);

  run(`CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);`);
  run(`CREATE INDEX IF NOT EXISTS idx_items_invoice_id ON invoice_items(invoice_id);`);
}
