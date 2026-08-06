"use client";

import { createContext, useContext } from "react";
import type { Bar } from "@/lib/types";

export type AdminCtxValue = {
  bars: Bar[];
  barId: string | null;
  setBarId: (id: string) => void;
  selectedBar: Bar | null;
  isAdmin: boolean;
  reloadBars: () => Promise<void>;
};

export const AdminCtx = createContext<AdminCtxValue>({
  bars: [],
  barId: null,
  setBarId: () => {},
  selectedBar: null,
  isAdmin: false,
  reloadBars: async () => {},
});

export function useAdmin() {
  return useContext(AdminCtx);
}
