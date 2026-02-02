import { getAll, getFirst, run, db } from "./db";
import type { Invoice, InvoiceItem } from "../domain/types";

function itemId(invoiceId: string, idx: number, name: string) {
  // MVP：穩定即可
  return `${invoiceId}_it_${idx}_${name}`.slice(0, 80);
}

export type InvoiceSummaryRow = {
  id: string;
  created_at: number;
  total: number | null;
  items_count: number;
};

export function saveInvoice(inv: Invoice) {
  // 交易：主表 + items
  db.withTransactionSync(() => {
    // 去重：id PK，使用 INSERT OR REPLACE
    run(
      `INSERT OR REPLACE INTO invoices
        (id, inv_num, inv_date, random_code, seller_id, total, raw_left, raw_right, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        inv.id,
        inv.invNum ?? null,
        inv.date ?? null,
        inv.randomCode ?? null,
        inv.sellerId ?? null,
        inv.total ?? null,
        inv.rawLeft,
        inv.rawRight ?? null,
        inv.createdAt,
      ]
    );

    // items 先刪再寫（簡單穩定）
    run(`DELETE FROM invoice_items WHERE invoice_id = ?;`, [inv.id]);

    inv.items.forEach((it, idx) => {
      run(
        `INSERT INTO invoice_items (id, invoice_id, name, qty, unit_price)
         VALUES (?, ?, ?, ?, ?);`,
        [itemId(inv.id, idx, it.name), inv.id, it.name, it.qty, it.unitPrice]
      );
    });
  });
}

export function listInvoices(limit = 50): InvoiceSummaryRow[] {
  return getAll<InvoiceSummaryRow>(
    `
    SELECT
      i.id,
      i.created_at,
      i.total,
      (SELECT COUNT(1) FROM invoice_items it WHERE it.invoice_id = i.id) AS items_count
    FROM invoices i
    ORDER BY i.created_at DESC
    LIMIT ?;
    `,
    [limit]
  );
}

export function getInvoiceById(id: string): Invoice | null {
  const inv = getFirst<any>(
    `SELECT id, inv_num, inv_date, random_code, seller_id, total, raw_left, raw_right, created_at
     FROM invoices WHERE id = ?;`,
    [id]
  );
  if (!inv) return null;

  const items = getAll<InvoiceItem>(
    `SELECT name, qty, unit_price as unitPrice
     FROM invoice_items WHERE invoice_id = ?
     ORDER BY rowid ASC;`,
    [id]
  );

  return {
    id: inv.id,
    invNum: inv.inv_num ?? undefined,
    date: inv.inv_date ?? undefined,
    randomCode: inv.random_code ?? undefined,
    sellerId: inv.seller_id ?? undefined,
    total: inv.total ?? undefined,
    rawLeft: inv.raw_left,
    rawRight: inv.raw_right ?? undefined,
    createdAt: inv.created_at,
    items,
  };
}

export function clearAllInvoices() {
  db.withTransactionSync(() => {
    run(`DELETE FROM invoice_items;`);
    run(`DELETE FROM invoices;`);
  });
}
