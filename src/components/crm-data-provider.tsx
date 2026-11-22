"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Contact, Requirement } from "@/types/crm";

type CrmData = {
  contacts: Contact[];
  requirements: Requirement[];
  user: { name: string; email: string };
  renderedAt: number;
};

const CrmDataContext = createContext<CrmData | null>(null);

export function CrmDataProvider({ value, children }: { value: CrmData; children: ReactNode }) {
  return <CrmDataContext.Provider value={value}>{children}</CrmDataContext.Provider>;
}

export function useCrmData() {
  const data = useContext(CrmDataContext);
  if (!data) throw new Error("CRM data is not available outside the workspace.");
  return data;
}
