// components/RegionSVG.tsx
import React, { useEffect, useRef, useState } from "react";

type Mode = "clip" | "pattern";
type ImagesMap = Record<string, string>;

type Props = {
  src: string;
  images?: ImagesMap;
  mode?: Mode;
  preserveAspectRatio?: string;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (svgEl: SVGSVGElement) => void;

  baseFill?: string;              // 예: "#f4f1e6"
  clearExistingFill?: boolean;    // 기본 true
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
    clip.setAttribute("clipPathUnits", "userSpaceOnUse"); // 좌표계 일치!
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

  // 1) SVG 인라인 로드
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

  // 2) 채우기/이미지 주입
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const svg = host.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return;

    onReady?.(svg);

    const vb = getViewBox(svg);
    const imagesLayer = ensureImagesLayer(svg);

    // A) 기존 fill 제거(옵션)
    if (clearExistingFill) {
      svg.querySelectorAll<SVGPathElement>("#regions path").forEach((p) => {
        p.removeAttribute("fill");
        p.style.removeProperty("fill");
      });
    }

    // B) 먼저 이미지가 필요한 path들을 처리
    const imageISOs = new Set(Object.keys(images));
    imageISOs.forEach((iso) => {
      const path = findRegionPath(svg, iso);
      if (!path) {
        console.warn(`[RegionSVG] region not found: ${iso}`);
        return;
      }
      const regionId = path.getAttribute("id") || `adm1-${iso}`;
      if (!path.getAttribute("id")) path.setAttribute("id", regionId);

      if (mode === "clip") {
        // 경계 path는 투명(이미지 레이어가 아래에 있음)
        path.style.fill = "none";

        const img = document.createElementNS(NS, "image");
        const href = images[iso];
        img.setAttributeNS(XLINK, "href", href);
        (img as any).setAttribute("href", href);
        img.setAttribute("x", String(vb.x));
        img.setAttribute("y", String(vb.y));
        img.setAttribute("width", String(vb.w));
        img.setAttribute("height", String(vb.h));
        img.setAttribute("preserveAspectRatio", preserveAspectRatio);
        img.setAttribute("clip-path", `url(#${makeClip(svg, iso, regionId)})`);
        imagesLayer.appendChild(img);
      } else {
        // pattern 방식: path에 패턴 채우기 (프레젠테이션 속성)
        const patId = makePattern(svg, iso, images[iso], vb.w, vb.h, preserveAspectRatio);
        path.setAttribute("fill", `url(#${patId})`);
        // 혹시 상위 CSS가 덮어쓰면 인라인 스타일로 고정
        path.style.fill = `url(#${patId})`;
      }
    });

    // C) 이미지가 **없는** path들을 인라인 스타일로 아이보리 채우기
    if (baseFill) {
      svg.querySelectorAll<SVGPathElement>("#regions path").forEach((p) => {
        // path의 ISO 얻기
        const iso =
          p.getAttribute("data-iso") ||
          (p.id?.startsWith("adm1-") ? p.id.replace(/^adm1-/, "") : "");
        if (iso && imageISOs.has(iso)) return; // 이미지는 제외

        // CSS 규칙(.region {fill:none})를 이기기 위해 인라인 스타일로 지정
        if (!p.style.fill || p.style.fill === "none") {
          p.style.fill = baseFill;
        }
      });
    }
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
