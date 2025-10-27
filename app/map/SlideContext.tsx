"use client";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type SlideCtx = { ready: boolean; setReady: (v: boolean) => void };
const Ctx = createContext<SlideCtx | null>(null);

export function SlideProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const value = useMemo(() => ({ ready, setReady }), [ready]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSlideReady() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSlideReady must be used within <SlideProvider>");
  return ctx;
}
