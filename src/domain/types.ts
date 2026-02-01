export type InvoiceItem = {
  name: string;
  qty: number;
  unitPrice: number;
};

export type Invoice = {
  id: string;
  invNum?: string;
  date?: string; // YYYY-MM-DD
  randomCode?: string;
  sellerId?: string;
  total?: number;
  items: InvoiceItem[];
  rawLeft: string;
  rawRight?: string;
  createdAt: number;
};
