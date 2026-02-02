import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("einvoice.db");

export function run(sql: string, params: any[] = []) {
  return db.runSync(sql, params);
}

export function getAll<T = any>(sql: string, params: any[] = []): T[] {
  return db.getAllSync<T>(sql, params);
}

export function getFirst<T = any>(sql: string, params: any[] = []): T | null {
  return db.getFirstSync<T>(sql, params);
}
