"use client";
import { useEffect, useState } from "react";
import { SlideProvider, useSlideReady } from "./SlideContext";

function AnimatedShell({ children }: { children: React.ReactNode }) {
  const { setReady } = useSlideReady();
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    // 새 페이지 진입 시 애니메이션 시작 + 준비 false
    setEntering(true);
    setReady(false);
  }, [setReady]);

  return (
    <div className="relative overflow-hidden">
      <main
        className={`min-h-screen bg-white ${entering ? "animate-slide-in" : ""}`}
        onAnimationEnd={() => {
          setEntering(false);
          setReady(true);           // ✅ 애니메이션 끝났다고 알림
        }}
      >
        {children}
      </main>
      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: .6; }
          to   { transform: translateX(0);     opacity: 1;  }
        }
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
