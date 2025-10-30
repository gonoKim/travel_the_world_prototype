"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;                 // e.g. /regions/jpn_regions.svg
  imgBase?: string;            // e.g. /images/pref
  countryPrefix?: string;      // e.g. "jpn" | "kor"
  defaultFill?: string;        // fallback fill when no image exists
  onRegionClick?: (info:{code:string;name:string}) => void;
  useIndexJson?: boolean;      // true면 `${imgBase}/index.json` 배열 키만 이미지 채움
  preserveAspectRatio?: "none" | "xMinYMin meet" | "xMidYMid meet" | "xMaxYMax meet" | "xMinYMin slice" | "xMidYMid slice" | "xMaxYMax slice";
};

function slugify(x: string) {
  return x
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export default function RegionSVG({
  src,
  imgBase = "/images/pref",
  countryPrefix = "",
  defaultFill = "#f4f1e6",
  onRegionClick,
  useIndexJson = true,
  preserveAspectRatio = "xMidYMid slice",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!wrapRef.current) return;

      // 1) SVG 로드
      const text = await fetch(src, { cache: "force-cache" }).then(r => r.text());
      if (cancelled) return;

      // 2) 파싱
      const dom = new DOMParser().parseFromString(text, "image/svg+xml");
      const svg = dom.documentElement as unknown as SVGSVGElement;

      // viewBox
      const vb = svg.getAttribute("viewBox")?.split(/\s+/).map(Number)
        || [0,0, Number(svg.getAttribute("width")||"1000"), Number(svg.getAttribute("height")||"1000")];
      const [minX, minY, vbW, vbH] = vb as [number, number, number, number];

      // 3) index.json (있으면 그 키만 이미지 채움)
      let available: Set<string> | null = null;
      if (useIndexJson) {
        try {
          const arr = await fetch(`${imgBase}/index.json`, { cache: "no-store" }).then(r => r.json());
          if (Array.isArray(arr)) available = new Set<string>(arr.map((s:any)=>String(s).toLowerCase()));
        } catch {}
      }

      // 4) <defs> 보장
      let defs = svg.querySelector("defs");
      if (!defs) {
        defs = dom.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.insertBefore(defs, svg.firstChild);
      }

      // 5) 지역 찾기: <g data-name>, <path data-name>, 그리고 예비로 .region
      const regionRoots: Element[] = Array.from(svg.querySelectorAll('[data-name], path.region'));

      regionRoots.forEach((rootEl) => {
        const dataName = (rootEl.getAttribute("data-name") || rootEl.getAttribute("title") || "").trim();

        // 이 루트 아래의 모든 path (복수조각 대응)
        const paths = rootEl.matches("path")
          ? [rootEl as SVGPathElement]
          : Array.from(rootEl.querySelectorAll("path"));

        if (!dataName) {
          // 이름이 없으면 기본색
          paths.forEach(p => p.setAttribute("fill", defaultFill));
          return;
        }

        const slug = slugify(dataName);       // "Hokkaidō" → "hokkaido" 처럼 정규화
        if (available && !available.has(slug)) {
          paths.forEach(p => p.setAttribute("fill", defaultFill));
          return;
        }

        const imgUrl = `${imgBase}/${slug}.jpg`;
        const patId = `pat_${slug}`;

        // 패턴 1회만 생성
        if (!svg.querySelector(`#${patId}`)) {
          const pattern = dom.createElementNS("http://www.w3.org/2000/svg", "pattern");
          pattern.setAttribute("id", patId);
          pattern.setAttribute("patternUnits", "objectBoundingBox");
          pattern.setAttribute("width", "1");
          pattern.setAttribute("height", "1");

          const image = dom.createElementNS("http://www.w3.org/2000/svg", "image");
          image.setAttribute("href", imgUrl); // 최신 속성 (xlink:href 대신)
          image.setAttribute("width", String(vbW));
          image.setAttribute("height", String(vbH));
          image.setAttribute("preserveAspectRatio", preserveAspectRatio);
          pattern.appendChild(image);
          defs!.appendChild(pattern);
        }

        // 해당 지역의 모든 path에 패턴 적용 + 테두리 보정
        paths.forEach((p) => {
          p.setAttribute("fill", `url(#${patId})`);
          if (!p.getAttribute("stroke")) p.setAttribute("stroke", "#2f2f2f");
          if (!p.getAttribute("stroke-width")) p.setAttribute("stroke-width", "1.2");
        });

        // 상호작용(루트에 부여)
        const code = countryPrefix ? `${countryPrefix}-${slug}` : slug;
        (rootEl as any).style.cursor = "pointer";
        (rootEl as any).setAttribute("tabindex", "0");
        (rootEl as any).setAttribute("role", "button");
        const go = () => onRegionClick?.({ code, name: dataName });
        rootEl.addEventListener("click", go);
        rootEl.addEventListener("keydown", (e: any) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
        });
        console.log({ dataName, slug, imgUrl, has: available?.has?.(slug) });
      });

      // 6) mount
      wrapRef.current.innerHTML = "";
      wrapRef.current.appendChild(svg);
      if (!cancelled) setReady(true);
    }
    run();
    return () => { cancelled = true; };
  }, [src, imgBase, countryPrefix, defaultFill, onRegionClick, useIndexJson, preserveAspectRatio]);

  return <div ref={wrapRef} className="relative w-full" />;
}
