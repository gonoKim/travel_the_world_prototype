// scripts/build-admin1-svg.mjs
// ------------------------------------------------------------
// Natural Earth Admin-1(전세계)에서 국가별(일본/한국) 행정1 경계 SVG 생성
// - 기본 채우기 제거(fill:none) → RegionSVG에서 이미지/패턴으로 채우기 용이
// - 각 영역에 안정적 ID(id="adm1-JP-01")와 data-iso 부여
// - clipPath/패턴 등은 생성하지 않음(용량↓, 런타임에서 동적 생성 권장)
//
// Node 18+ 권장(전역 fetch 사용). Node 16은 node-fetch를 설치 후 import 하세요.
// ------------------------------------------------------------

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { geoMercator, geoPath } from "d3-geo";
import "d3-geo-projection";

// --- 경로 기본 설정 ----------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../data");
const OUT_DIR  = path.join(__dirname, "../public/regions");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

// --- 데이터 소스 -------------------------------------------------------------
// Natural Earth Admin-1 전체(전세계) GeoJSON
const NE_ADMIN1_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";
const NE_LOCAL = path.join(DATA_DIR, "ne_admin1.geojson");

function log(...args) { console.log("[build-admin1]", ...args); }

// --- 다운로드/로컬캐시 --------------------------------------------------------
async function ensureAdmin1() {
  if (fs.existsSync(NE_LOCAL)) {
    log("using local:", "data/ne_admin1.geojson");
    return JSON.parse(fs.readFileSync(NE_LOCAL, "utf8"));
  }
  log("downloading admin-1…");
  const res = await fetch(NE_ADMIN1_URL);
  if (!res.ok) throw new Error("download failed: " + res.status);
  const txt = await res.text();
  fs.writeFileSync(NE_LOCAL, txt, "utf8");
  log("saved:", "data/ne_admin1.geojson");
  return JSON.parse(txt);
}

// --- 유틸 --------------------------------------------------------------------
function slugify(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9\-_.]/g, "")
    .toLowerCase();
}

// iso_3166_2 > gn_a1_code > adm1_code > name 우선순위로 코드 선택
function pickRegionCode(props, fallbackPrefix) {
  const iso = props?.iso_3166_2;      // e.g., "JP-01"
  const gn  = props?.gn_a1_code;      // e.g., "JP.01"
  const adm = props?.adm1_code;       // e.g., "JPN-1863"
  const nm  = props?.name || props?.name_en || props?.name_1 || props?.name_local;

  if (iso) return iso.toUpperCase();
  if (gn)  return gn.replace(/\./g, "-").toUpperCase();
  if (adm) return adm.replace(/\./g, "-").toUpperCase();
  return `${fallbackPrefix}-${slugify(nm || "region")}`.toUpperCase();
}

// 나라별(ADM0) 필터: JPN / KOR 등
function filterCountryAdmin1(geojson, adm0_a3) {
  const feats = geojson.features.filter((f) => {
    const a3 = f.properties?.adm0_a3 || f.properties?.adm0_a3_us;
    return a3 === adm0_a3;
  });
  return { type: "FeatureCollection", features: feats };
}

// --- SVG 생성 (최소셋: 경계선 + 안정 ID/데이터) ------------------------------
function buildAdmin1SVG(
  geojson,
  {
    width,
    height,
    margin = 12,
    stroke = "#2f2f2f",
    strokeWidth = 1.25,
  } = {}
) {
  const projection = geoMercator();
  const pathGen = geoPath(projection);
  projection.fitExtent([[margin, margin], [width - margin, height - margin]], geojson);

  // 기본 fill 제거(RegionSVG에서 이미지/패턴으로 채우도록)
  const style = `
    .region { fill: none; stroke:${stroke}; stroke-width:${strokeWidth}; vector-effect: non-scaling-stroke; }
    .region { pointer-events: all; } /* 히트테스트 필요 시 */
    text { font-family: system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, sans-serif; font-size:12px; fill:#222; user-select:none; }
  `;

  const parts = [];
  const a3 = (geojson.features[0]?.properties?.adm0_a3 || "ADM0").toUpperCase();

  for (const f of geojson.features) {
    const d = pathGen(f);
    if (!d) continue;

    const name =
      f.properties?.name || f.properties?.name_en ||
      f.properties?.name_local || f.properties?.name_1 ||
      f.properties?.name_alt || "";

    const code = pickRegionCode(f.properties, a3); // "JP-01" 등의 안정 코드
    const safeId = `adm1-${code}`;                // id="adm1-JP-01"

    parts.push(
      `<path id="${safeId}" class="region" d="${d}"
        data-name="${String(name).replace(/"/g, "&quot;")}"
        data-iso="${code}" />`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>${style}</style>
  <g id="regions">
    ${parts.join("\n    ")}
  </g>
</svg>`;
}

// --- 파일 저장 ---------------------------------------------------------------
function saveSVG(svg, outFile) {
  fs.writeFileSync(outFile, svg, "utf8");
  log("✅", path.basename(outFile), "created");
}

// --- 메인 --------------------------------------------------------------------
(async () => {
  try {
    const ne = await ensureAdmin1();

    // 국가별로 필터
    const jp = filterCountryAdmin1(ne, "JPN");
    const kr = filterCountryAdmin1(ne, "KOR");

    // 보기 좋은 캔버스 크기 (필요 시 조절)
    const jpSvg = buildAdmin1SVG(jp, { width: 900, height: 850 });
    const krSvg = buildAdmin1SVG(kr, { width: 720, height: 900 });

    // 출력
    saveSVG(jpSvg, path.join(OUT_DIR, "jpn_regions.svg"));
    saveSVG(krSvg, path.join(OUT_DIR, "kor_regions.svg"));

    log("done.");
  } catch (err) {
    console.error("[build-admin1] ❌ error:", err);
    process.exit(1);
  }
})();
