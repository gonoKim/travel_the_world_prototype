// scripts/build-admin1-svg.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { geoMercator, geoPath } from "d3-geo";
import "d3-geo-projection";

// ↓ Node 18+ 에서 전역 fetch 사용 (Node 16이면 node-fetch 설치)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../data");
const OUT_DIR  = path.join(__dirname, "../public/regions");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

// Natural Earth Admin-1 전체(전세계) GeoJSON
const NE_ADMIN1_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";
const NE_LOCAL = path.join(DATA_DIR, "ne_admin1.geojson");

function log(...args) { console.log("[build-admin1]", ...args); }

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

// 나라별(ADM0)로 필터: JPN / KOR
function filterCountryAdmin1(geojson, adm0_a3) {
  const feats = geojson.features.filter(f =>
    (f.properties?.adm0_a3 || f.properties?.adm0_a3_us) === adm0_a3
  );
  return { type: "FeatureCollection", features: feats };
}

function buildAdmin1SVG(geojson, { width, height, margin = 12, fill="#f4f1e6" }) {
  const projection = geoMercator();
  const pathGen = geoPath(projection);
  projection.fitExtent([[margin, margin],[width - margin, height - margin]], geojson);

  const style = `
    .region { fill:${fill}; stroke:#2f2f2f; stroke-width:1.2; vector-effect:non-scaling-stroke; }
    .inner  { fill:none; stroke:#7a7a7a; stroke-width:.8; stroke-dasharray:2 2; vector-effect:non-scaling-stroke; }
    text { font-family: system-ui, sans-serif; font-size:12px; fill:#222; user-select:none; }
  `;

  // path 조립 + 라벨(중심점) 옵션
  const parts = [];
  for (const f of geojson.features) {
    const d = pathGen(f);
    if (!d) continue;
    const name =
      f.properties?.name || f.properties?.name_en ||
      f.properties?.name_local || f.properties?.name_1 ||
      f.properties?.name_alt || "";

    parts.push(`<path class="region" d="${d}" data-name="${String(name).replace(/"/g,'&quot;')}"/>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"
     viewBox="0 0 ${width} ${height}">
  <style>${style}</style>
  <g id="regions">
    ${parts.join("\n    ")}
  </g>
</svg>`;
}

function saveSVG(svg, outFile) {
  fs.writeFileSync(outFile, svg, "utf8");
  log("✅", path.basename(outFile), "created");
}

(async () => {
  const ne = await ensureAdmin1();

  // 일본(JPN) / 한국(KOR) 필터
  const jp = filterCountryAdmin1(ne, "JPN");
  const kr = filterCountryAdmin1(ne, "KOR");

  // 보기 좋은 캔버스 크기 예시
  const jpSvg = buildAdmin1SVG(jp, { width: 900, height: 850 });
  const krSvg = buildAdmin1SVG(kr, { width: 720, height: 900 });

  saveSVG(jpSvg, path.join(OUT_DIR, "jpn_regions.svg"));
  saveSVG(krSvg, path.join(OUT_DIR, "kor_regions.svg"));
})();
