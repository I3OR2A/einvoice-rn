import type { Invoice, InvoiceItem } from "../domain/types";

function isNumberLike(s: string) {
  if (!s) return false;
  return /^-?\d+(\.\d+)?$/.test(s.trim());
}

function safeParseNumber(s: string) {
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function isLikelyItemName(s: string) {
  const t = (s ?? "").trim();
  if (!t) return false;

  // ✅ 關鍵：商品名稱通常不是「純數字」
  // 例如 "1"、"01" 這種不要當品名
  if (/^\d+$/.test(t)) return false;

  // 也避免一些只有符號的情況
  if (/^[\*\-_=]+$/.test(t)) return false;

  return true;
}

function simpleId(raw: string) {
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) | 0;
  return `inv_${Math.abs(h)}`;
}

function normalizeRight(raw: string) {
  const s = (raw ?? "").trim();
  return s.startsWith("**") ? s.slice(2) : s;
}

function findItemsStartIndex(parts: string[]) {
  // 找第一個：name(非純數字) + qty(數字) + price(數字)
  for (let i = 0; i + 2 < parts.length; i++) {
    const name = parts[i];
    const qty = parts[i + 1];
    const price = parts[i + 2];
    if (isLikelyItemName(name) && isNumberLike(qty) && isNumberLike(price)) {
      return i;
    }
  }
  return -1;
}

export function parseEInvoiceQRCodes(rawLeft: string, rawRight?: string): Invoice {
  const left = (rawLeft ?? "").trim();
  const right = normalizeRight(rawRight ?? "");
  const payload = left + right;

  // 重要：保留空欄位可能有用，但 MVP 先把空欄位濾掉
  const parts = payload
    .split(":")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  const start = findItemsStartIndex(parts);

  const items: InvoiceItem[] = [];
  if (start >= 0) {
    // 從 start 起每 3 個為一組：name, qty, price
    for (let i = start; i + 2 < parts.length; i += 3) {
      const name = parts[i];
      const qty = safeParseNumber(parts[i + 1]);
      const unitPrice = safeParseNumber(parts[i + 2]);

      // 若這組不像商品就停止（避免吃到尾端其它欄位）
      if (!isLikelyItemName(name) || !Number.isFinite(qty) || !Number.isFinite(unitPrice)) break;

      items.push({ name, qty, unitPrice });
    }
  }

  // 可選：若你希望 total 自動算（目前發票 QR 前段也可能含 total，但 MVP 先算 items）
  const total = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);

  const invoice: Invoice = {
    id: simpleId(payload),
    items,
    total: Number.isFinite(total) ? total : undefined,
    rawLeft,
    rawRight,
    createdAt: Date.now(),
  };

  return invoice;
}
