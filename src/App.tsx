import React, { useEffect, useRef, useState } from 'react';
import Globe, { GlobeInstance } from 'globe.gl';
import * as topojson from 'topojson-client';
import CountryModal from './CountryModal';

type CountryFeature = GeoJSON.Feature<GeoJSON.MultiPolygon | GeoJSON.Polygon, any>;
type UploadMap = Record<string, { [regionId: string]: { dataUrl: string; name: string } }>;

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// 국가별 1단계 행정구역 GeoJSON (원하는 나라를 계속 추가)
export const REGION_SOURCES: Record<string, { url: string; name: string }> = {
  JPN: { url: 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson', name: '도도부현' },
  KOR: { url: 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_provinces_geo.json', name: '시·도' },
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);

  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [uploads, setUploads] = useState<UploadMap>(() => {
    try { return JSON.parse(localStorage.getItem('uploads_by_country') || '{}'); }
    catch { return {}; }
  });
  useEffect(() => {
    localStorage.setItem('uploads_by_country', JSON.stringify(uploads));
  }, [uploads]);

  const [modalIso3, setModalIso3] = useState<string | null>(null);
  const [modalCountryName, setModalCountryName] = useState<string>('');

  // ── Globe 초기화: 밝은 단색 + 국경선 ─────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el || globeRef.current) return;

    const g = new (Globe as any)(el) as GlobeInstance;
    globeRef.current = g;

    g.backgroundColor('#f7faff')
      .globeImageUrl(null as any)
      .bumpImageUrl(null)
      .globeMaterial().color.set('#eef5ff');

    g.showAtmosphere(true)
      .atmosphereColor('#cfe4ff')
      .atmosphereAltitude(0.18)
      .pointOfView({ lat: 20, lng: 10, altitude: 2.6 }, 0);

    const onResize = () => g.width(window.innerWidth).height(window.innerHeight);
    onResize(); window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); el.replaceChildren(); globeRef.current = null; };
  }, []);

  // ── 세계 국가 로드 ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const res = await fetch(WORLD_TOPO_URL);
      const topo = await res.json();
      const geo = topojson.feature(topo, (topo.objects as any).countries) as any;
      setCountries(geo.features);
    })();
  }, []);

  // ── 세계 보기 렌더 + 클릭 시 모달 오픈 ─────────────────────
  useEffect(() => {
    const g = globeRef.current;
    if (!g || countries.length === 0) return;

    g.polygonsData(countries)
      .polygonCapColor((d: any) => {
        const iso3 = d.properties?.iso_a3 || d.properties?.ISO_A3;
        const hasAny = uploads[iso3] && Object.keys(uploads[iso3]).length > 0;
        return hasAny ? 'rgba(59,130,246,0.25)' : 'rgba(0,0,0,0.03)';
      })
      .polygonSideColor(() => 'rgba(0,0,0,0.05)')
      .polygonStrokeColor(() => '#cbd5e1')
      .polygonAltitude(0.01)
      .onPolygonClick((d: any) => {
        const iso3 = d.properties?.iso_a3 || d.properties?.ISO_A3;
        const name = d.properties?.name || d.properties?.NAME || iso3;
        setModalIso3(iso3);
        setModalCountryName(name);
      })
      .polygonsTransitionDuration(250);
  }, [countries, uploads]);

  // 국가 모달에서 업로드 반영
  function upsertRegionImage(iso3: string, regionId: string, name: string, dataUrl: string) {
    setUploads(prev => {
      const next = { ...(prev[iso3] || {}) };
      next[regionId] = { dataUrl, name };
      return { ...prev, [iso3]: next };
    });
  }

  function clearRegion(iso3: string, regionId: string) {
    setUploads(prev => {
      const cur = { ...(prev[iso3] || {}) };
      delete cur[regionId];
      return { ...prev, [iso3]: cur };
    });
  }

  return (
    <div style={{ height: '100%' }}>
      <div className="header">
        <div className="card">🌍 <b>Minimal Globe</b> <span className="muted">— 국가 클릭: 큰 지도 모달에서 지역 업로드</span></div>
        <div className="toolbar">
          <button onClick={() => setUploads({})}>전체 초기화</button>
          <button className="primary" onClick={() => alert('국가를 클릭하면 큰 지도가 열립니다. 지역을 클릭해 사진을 업로드하세요!')}>도움말</button>
        </div>
      </div>

      <div ref={containerRef} style={{ height: '100%' }} />

      {/* 국가 모달 */}
      {modalIso3 && (
        <CountryModal
          iso3={modalIso3}
          countryName={modalCountryName}
          onClose={() => setModalIso3(null)}
          uploads={uploads[modalIso3] || {}}
          onUpload={(regionId, name, dataUrl) => upsertRegionImage(modalIso3, regionId, name, dataUrl)}
          onRemove={(regionId) => clearRegion(modalIso3, regionId)}
        />
      )}
    </div>
  );
}
