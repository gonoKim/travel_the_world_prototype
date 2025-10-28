"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;                 // /regions/jpn_regions.svg
  imgBase?: string;            // /images/pref
  countryPrefix?: string;      // "jpn" | "kor"
  defaultFill?: string;        // ivory
  onRegionClick?: (info:{code:string;name:string}) => void;
  useIndexJson?: boolean;      // 디버깅 동안 false 권장
};

function slugify(x: string) {
  return x
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function RegionSVG({
  src,
  imgBase = "/images/pref",
  countryPrefix = "",
  defaultFill = "#f4f1e6",
  onRegionClick,
  useIndexJson = false, // ← 디버깅 동안 false 로!
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = wrapRef.current;
    if (!host) return;

    const exists = async (url: string) => {
      // HEAD → 실패 시 GET 폴백 (dev 환경 호환)
      try { const h = await fetch(url, { method: "HEAD", cache: "no-store" }); if (h.ok) return true; } catch {}
      try { const g = await fetch(url, { method: "GET", cache: "no-store" }); return g.ok; } catch {}
      return false;
    };

    const run = async () => {
      // (옵션) index.json 사용 — 디버깅 끝나면 true로 돌려도 됨
      let hasSet: Set<string> | null = null;
      if (useIndexJson) {
        try {
          const r = await fetch(`${imgBase}/index.json`, { cache: "no-store" });
          if (r.ok) hasSet = new Set<string>(await r.json());
        } catch {}
      }

      const txt = await fetch(src, { cache: "no-store" }).then(r => r.text());
      host.innerHTML = txt;
      const svg = host.querySelector("svg");
      if (!svg) return;

      if (!svg.getAttribute("xmlns:xlink")) {
        svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
      }

      const vb = svg.viewBox?.baseVal;
      const vw = Math.max(1, vb?.width  || parseFloat(svg.getAttribute("width")  || "1000") || 1000);
      const vh = Math.max(1, vb?.height || parseFloat(svg.getAttribute("height") || "800")  || 800);

      const defs =
        svg.querySelector("defs") ||
        svg.insertBefore(document.createElementNS(svg.namespaceURI, "defs"), svg.firstChild);

      const style = document.createElement("style");
      style.textContent = `.region:hover{filter:brightness(.92)}`;
      svg.prepend(style);

      for (const node of Array.from(svg.querySelectorAll<SVGElement>(".region"))) {
        const name = node.getAttribute("data-name") || "";
        if (!name) continue;

        const code = slugify(node.getAttribute("data-code") || name);
        node.setAttribute("data-code", code);

        const imgUrl = `${imgBase}/${code}.jpg`;
        const patId  = `img-${countryPrefix}-${code}`;

        // 디버깅 로그
        // eslint-disable-next-line no-console
        console.log("[Region]", { code, imgUrl, patId, countryPrefix });

        // 기존 잘못된 fill 제거
        node.removeAttribute("fill");

        let useImg = false;
        if (hasSet) {
          useImg = hasSet.has(code);
        } else {
          useImg = await exists(imgUrl);
        }

        if (useImg) {
          // 패턴 없으면 생성
          if (!svg.querySelector(`#${patId}`)) {
            const pat = document.createElementNS(svg.namespaceURI, "pattern");
            pat.setAttribute("id", patId);
            pat.setAttribute("patternUnits", "userSpaceOnUse");
            pat.setAttribute("patternContentUnits", "userSpaceOnUse");
            pat.setAttribute("x", "0");
            pat.setAttribute("y", "0");
            pat.setAttribute("width", String(vw));
            pat.setAttribute("height", String(vh));

            const im = document.createElementNS(svg.namespaceURI, "image");
            // 최신+구형 둘 다
            im.setAttributeNS(null, "href", imgUrl);
            im.setAttributeNS("http://www.w3.org/1999/xlink", "href", imgUrl);
            im.setAttribute("x", "0");
            im.setAttribute("y", "0");
            im.setAttribute("width", String(vw));
            im.setAttribute("height", String(vh));
            im.setAttribute("preserveAspectRatio", "xMidYMid slice");

            pat.appendChild(im);
            defs.appendChild(pat);
          }

          requestAnimationFrame(() => {
            node.setAttribute("fill", `url(#${patId})`);
            // 디버깅 표시: 이미지가 적용된 구역은 테두리를 살짝 진하게
            node.setAttribute("stroke", "rgba(0,0,0,.4)");
            node.setAttribute("stroke-width", "0.6");
          });
        } else {
          node.setAttribute("fill", defaultFill);
        }

        (node.style as any).cursor = "pointer";
        node.setAttribute("tabindex", "0");
        node.setAttribute("role", "button");
        const go = () => onRegionClick?.({ code, name });
        node.addEventListener("click", go);
        node.addEventListener("keydown", (e: any) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
        });
      }
    };

    run();
  }, [src, imgBase, countryPrefix, defaultFill, onRegionClick, useIndexJson]);

  return <div ref={wrapRef} className="relative w-full" />;
}
