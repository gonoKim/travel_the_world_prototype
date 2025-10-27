// components/WorldMap.tsx
"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function WorldMap() {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    fetch("/maps/world.svg").then(r => r.text()).then(svg => {
      el.innerHTML = svg;
      const root = el.querySelector("svg");
      if (!root) return;

      const go = (iso2: string) => {
        const path = `/map/${iso2.toLowerCase()}`;
        // 프리패치
        router.prefetch?.(path);
        // View Transitions API(지원 브라우저)
        const vt = (document as any).startViewTransition;
        if (typeof vt === "function") {
          vt(() => router.push(path));
        } else {
          router.push(path);
        }
      };

      root.querySelectorAll<SVGElement>("[data-iso2]").forEach((n) => {
        const iso2 = n.getAttribute("data-iso2")!;
        n.style.cursor = "pointer";
        n.addEventListener("mouseenter", () => router.prefetch?.(`/map/${iso2.toLowerCase()}`));
        n.addEventListener("click", () => go(iso2));
      });
    });
  }, [router]);

  return <div ref={ref} className="border rounded-lg overflow-hidden" />;
}
