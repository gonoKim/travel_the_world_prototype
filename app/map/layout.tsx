"use client";
import { useEffect, useRef, useState } from "react";
import { SlideProvider, useSlideReady } from "./SlideContext";

function AnimatedShell({ children }: { children: React.ReactNode }) {
  const { setReady } = useSlideReady();
  const [entering, setEntering] = useState(false);
  const ran = useRef(false); // StrictMode 이펙트 2회 가드

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    setReady(false);
    setEntering(true);
    const t = setTimeout(() => {
      setEntering(false);
      setReady(true);
      ran.current = false;
    }, 350);
    return () => clearTimeout(t);
  }, [setReady]);

  return (
    <div className="relative overflow-hidden">
      <main className={`min-h-screen bg-white ${entering ? "animate-slide-in" : ""}`}>
        {children}
      </main>
      <style jsx global>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity:.6 } to { transform: translateX(0); opacity:1 } }
        .animate-slide-in { animation: slide-in .35s ease-in-out both; }
      `}</style>
    </div>
  );
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <SlideProvider>
      <AnimatedShell>{children}</AnimatedShell>
    </SlideProvider>
  );
}
