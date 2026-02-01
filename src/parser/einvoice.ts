import type { Invoice, InvoiceItem } from "../domain/types";

function isNumberLike(s: string) {
  if (!s) return false;
  return /^-?\d+(\.\d+)?$/.test(s);
}

function safeParseNumber(s: string) {
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function simpleId(raw: string) {
  // MVP 用：簡單 hash（不追求加密安全）
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) | 0;
  return `inv_${Math.abs(h)}`;
}

export function parseEInvoiceQRCodes(rawLeft: string, rawRight?: string): Invoice {
  const left = rawLeft.trim();
  const right = (rawRight || "").trim().replace(/^\*\*/, "");
  const payload = left + right;

  const parts = payload.split(":").map((x) => x.trim()).filter(Boolean);

  // 找第一個符合 name, qty, price 的起點
  let start = -1;
  for (let i = 0; i + 2 < parts.length; i++) {
    const name = parts[i];
    const qty = parts[i + 1];
    const price = parts[i + 2];
    if (name && isNumberLike(qty) && isNumberLike(price)) {
      start = i;
      break;
    }
  }

  const items: InvoiceItem[] = [];
  if (start >= 0) {
    for (let i = start; i + 2 < parts.length; i += 3) {
      const name = parts[i];
      const qty = safeParseNumber(parts[i + 1]);
      const unitPrice = safeParseNumber(parts[i + 2]);
      if (!name || !Number.isFinite(qty) || !Number.isFinite(unitPrice)) break;
      items.push({ name, qty, unitPrice });
    }
  }

  const invoice: Invoice = {
    id: simpleId(payload),
    items,
    rawLeft: rawLeft,
    rawRight: rawRight,
    createdAt: Date.now(),
  };

  return invoice;
}
