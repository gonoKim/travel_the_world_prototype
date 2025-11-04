// components/RegionSVG.tsx
import React, { useEffect, useRef, useState } from "react";

type Mode = "clip" | "pattern";
type ImagesMap = Record<string, string>;

type Props = {
  src: string;
  images?: ImagesMap;                // { "JP-01": "/images/pref/hokkaido.jpg", ... }
  mode?: Mode;                       // "clip" | "pattern" (기본 "clip")
  preserveAspectRatio?: string;      // 이미지 배치 (기본 "xMidYMid slice")
  className?: string;
  style?: React.CSSProperties;
  onReady?: (svgEl: SVGSVGElement) => void;

  // 추가 옵션
  baseFill?: string;                 // 예: "#f4f1e6" → 이미지 없는 path를 아이보리로 채움
  clearExistingFill?: boolean;       // true면 기존 path fill 속성 삭제 (기본 true)
};

const NS = "http://www.w3.org/2000/svg";
const XLINK = "http://www.w3.org/1999/xlink";

function ensureDefs(svg: SVGSVGElement): SVGDefsElement {
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(NS, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }
  return defs as SVGDefsElement;
}

function ensureImagesLayer(svg: SVGSVGElement): SVGGElement {
  let imagesLayer = svg.querySelector("#images") as SVGGElement | null;
  if (imagesLayer) return imagesLayer;

  const regions = svg.querySelector("#regions");
  imagesLayer = document.createElementNS(NS, "g");
  imagesLayer.setAttribute("id", "images");

  if (regions) svg.insertBefore(imagesLayer, regions);
  else svg.appendChild(imagesLayer);

  return imagesLayer;
}

function getViewBox(svg: SVGSVGElement) {
  const vb = svg.getAttribute("viewBox");
  if (vb) {
    const [x, y, w, h] = vb.split(/[\s,]+/).map(Number);
    return { x: x || 0, y: y || 0, w: w || 0, h: h || 0 };
  }
  const w = Number(svg.getAttribute("width") || 0);
  const h = Number(svg.getAttribute("height") || 0);
  return { x: 0, y: 0, w, h };
}

function findRegionPath(svg: SVGSVGElement, iso: string): SVGPathElement | null {
  const byId = svg.querySelector(`#adm1-${CSS.escape(iso)}`) as SVGPathElement | null;
  if (byId) return byId;
  const byData = svg.querySelector(`[data-iso="${iso}"]`) as SVGPathElement | null;
  return byData;
}

function makeClip(svg: SVGSVGElement, iso: string, regionId: string): string {
  const defs = ensureDefs(svg);
  const id = `clip-${iso}`;
  let clip = defs.querySelector(`#${CSS.escape(id)}`) as SVGClipPathElement | null;
  if (!clip) {
    clip = document.createElementNS(NS, "clipPath");
    clip.setAttribute("id", id);
    clip.setAttribute("clipPathUnits", "userSpaceOnUse"); // 중요!

    const use = document.createElementNS(NS, "use");
    use.setAttributeNS(XLINK, "href", `#${regionId}`);
    (use as any).setAttribute("href", `#${regionId}`);
    clip.appendChild(use);
    defs.appendChild(clip);
  }
  return id;
}

function makePattern(
  svg: SVGSVGElement,
  iso: string,
  imageHref: string,
  w: number,
  h: number,
  preserveAspectRatio: string
): string {
  const defs = ensureDefs(svg);
  const id = `pat-${iso}`;
  let pat = defs.querySelector(`#${CSS.escape(id)}`) as SVGPatternElement | null;
  if (!pat) {
    pat = document.createElementNS(NS, "pattern");
    pat.setAttribute("id", id);
    pat.setAttribute("patternUnits", "userSpaceOnUse");
    pat.setAttribute("x", "0");
    pat.setAttribute("y", "0");
    pat.setAttribute("width", String(w));
    pat.setAttribute("height", String(h));

    const img = document.createElementNS(NS, "image");
    img.setAttributeNS(XLINK, "href", imageHref);
    (img as any).setAttribute("href", imageHref);
    img.setAttribute("x", "0");
    img.setAttribute("y", "0");
    img.setAttribute("width", String(w));
    img.setAttribute("height", String(h));
    img.setAttribute("preserveAspectRatio", preserveAspectRatio);

    pat.appendChild(img);
    defs.appendChild(pat);
  }
  return id;
}

export default function RegionSVG({
  src,
  images = {},
  mode = "clip",
  preserveAspectRatio = "xMidYMid slice",
  className,
  style,
  onReady,
  baseFill,
  clearExistingFill = true,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [svgMarkup, setSvgMarkup] = useState("");

  // 1) SVG 불러와 인라인
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) throw new Error(`fetch ${src} ${res.status}`);
        const txt = await res.text();
        if (!cancelled) setSvgMarkup(txt);
      } catch (e) {
        console.error("[RegionSVG] fetch failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [src]);

  // 2) 채색/이미지 주입
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const svg = host.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return;

    onReady?.(svg);

    const vb = getViewBox(svg);
    const imagesLayer = ensureImagesLayer(svg);

    // (A) 기존 fill 제거(옵션)
    if (clearExistingFill) {
      svg.querySelectorAll<SVGPathElement>("#regions path").forEach(p => {
        p.removeAttribute("fill");
      });
    }

    // (B) 기본 아이보리 채색(옵션)
    if (baseFill) {
      svg.querySelectorAll<SVGPathElement>("#regions path").forEach(p => {
        if (!p.getAttribute("fill")) p.setAttribute("fill", baseFill);
      });
    }

    // (C) 이미지 채우기
    Object.entries(images).forEach(([iso, href]) => {
      const path = findRegionPath(svg, iso);
      if (!path) {
        console.warn(`[RegionSVG] region not found: ${iso}`);
        return;
      }
      const regionId = path.getAttribute("id") || `adm1-${iso}`;
      if (!path.getAttribute("id")) path.setAttribute("id", regionId);

      if (mode === "clip") {
        const clipId = makeClip(svg, iso, regionId);
        const img = document.createElementNS(NS, "image");
        img.setAttributeNS(XLINK, "href", href);
        (img as any).setAttribute("href", href);
        img.setAttribute("x", String(vb.x));
        img.setAttribute("y", String(vb.y));
        img.setAttribute("width", String(vb.w));
        img.setAttribute("height", String(vb.h));
        img.setAttribute("preserveAspectRatio", preserveAspectRatio);
        img.setAttribute("clip-path", `url(#${clipId})`);
        img.addEventListener("error", () => {
          console.warn(`[RegionSVG] image failed to load: ${href}`);
        });
        imagesLayer.appendChild(img);
      } else {
        const patId = makePattern(svg, iso, href, vb.w, vb.h, preserveAspectRatio);
        path.setAttribute("fill", `url(#${patId})`);
      }
    });
  }, [svgMarkup, images, mode, preserveAspectRatio, onReady, baseFill, clearExistingFill]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
