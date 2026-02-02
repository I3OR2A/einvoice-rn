import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Invoice } from "../domain/types";
import { initDb } from "../storage/migrations";
import { clearAllInvoices, getInvoiceById as repoGet, listInvoices, saveInvoice } from "../storage/invoice_repo";

type InvoiceSummary = {
  id: string;
  createdAt: number;
  total: number | null;
  itemsCount: number;
};

type InvoicesContextValue = {
  summaries: InvoiceSummary[];
  refresh: () => void;
  save: (inv: Invoice) => void;
  getById: (id: string) => Invoice | null;
  clearAll: () => void;
};

const InvoicesContext = createContext<InvoicesContextValue | null>(null);

export function InvoicesProvider({ children }: { children: React.ReactNode }) {
  const [summaries, setSummaries] = useState<InvoiceSummary[]>([]);

  const refresh = () => {
    const rows = listInvoices(200);
    setSummaries(
      rows.map((r) => ({
        id: r.id,
        createdAt: r.created_at,
        total: r.total,
        itemsCount: r.items_count,
      }))
    );
  };

  useEffect(() => {
    initDb();
    refresh();
  }, []);

  const save = (inv: Invoice) => {
    saveInvoice(inv);
    refresh();
  };

  const getById = (id: string) => repoGet(id);

  const clearAll = () => {
    clearAllInvoices();
    refresh();
  };

  const value = useMemo(() => ({ summaries, refresh, save, getById, clearAll }), [summaries]);

  return <InvoicesContext.Provider value={value}>{children}</InvoicesContext.Provider>;
}

export function useInvoices() {
  const ctx = useContext(InvoicesContext);
  if (!ctx) throw new Error("useInvoices must be used within InvoicesProvider");
  return ctx;
}
