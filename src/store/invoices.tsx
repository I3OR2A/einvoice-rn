import React, { createContext, useContext, useMemo, useState } from "react";
import type { Invoice } from "../domain/types";

type InvoicesContextValue = {
  invoices: Invoice[];
  upsertInvoice: (inv: Invoice) => void;
  getInvoiceById: (id: string) => Invoice | undefined;
  clearAll: () => void;
};

const InvoicesContext = createContext<InvoicesContextValue | null>(null);

export function InvoicesProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const upsertInvoice = (inv: Invoice) => {
    setInvoices((prev) => {
      const idx = prev.findIndex((x) => x.id === inv.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = inv;
        return next;
      }
      return [inv, ...prev];
    });
  };

  const getInvoiceById = (id: string) => invoices.find((x) => x.id === id);

  const clearAll = () => setInvoices([]);

  const value = useMemo(
    () => ({ invoices, upsertInvoice, getInvoiceById, clearAll }),
    [invoices]
  );

  return <InvoicesContext.Provider value={value}>{children}</InvoicesContext.Provider>;
}

export function useInvoices() {
  const ctx = useContext(InvoicesContext);
  if (!ctx) throw new Error("useInvoices must be used within InvoicesProvider");
  return ctx;
}
