import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { REGION_SOURCES } from './App';

type RegionUpload = { dataUrl: string; name: string };
type Props = {
  iso3: string;
  countryName: string;
  uploads: Record<string, RegionUpload>;
  onUpload: (regionId: string, name: string, dataUrl: string) => void;
  onRemove: (regionId: string) => void;
  onClose: () => void;
};

type Feature = GeoJSON.Feature<GeoJSON.MultiPolygon | GeoJSON.Polygon, any>;

export default function CountryModal({ iso3, countryName, uploads, onUpload, onRemove, onClose }: Props) {
  const src = REGION_SOURCES[iso3];
  const [regions, setRegions] = useState<Feature[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const pending = useRef<{ id: string; name: string; lon: number; lat: number } | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!src) { setRegions([]); return; }
      const gj = await (await fetch(src.url)).json();
      if (ignore) return;
      const feats: Feature[] = (gj.features as any[]).map((f, i) => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: {
          id: f.properties?.id || f.properties?.code || f.properties?.NAME_1 || f.properties?.name || `r-${i}`,
          name: f.properties?.name || f.properties?.NAME_1 || f.properties?.prefecture || f.properties?.nam || `Region ${i}`,
        }
      }));
      setRegions(feats);
    })();
    return () => { ignore = true; };
  }, [iso3]);

  function centroidOf(f: Feature): [number, number] {
    const geom: any = f.geometry;
    const coords: any[] =
      geom?.type === 'Polygon' ? geom.coordinates?.[0] :
      geom?.type === 'MultiPolygon' ? geom.coordinates?.[0]?.[0] : [];
    let x = 0, y = 0; const n = coords?.length || 0;
    coords?.forEach((c: number[]) => { x += c[0]; y += c[1]; });
    return n ? [x / n, y / n] : [0, 0];
  }

  function openUpload(region: Feature) {
    const id = (region.properties as any)?.id;
    const name = (region.properties as any)?.name || id;
    const [lon, lat] = centroidOf(region);
    pending.current = { id, name, lon, lat };
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    const p = pending.current;
    if (!f || !p) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpload(p.id, p.name, String(reader.result));
      if (fileRef.current) fileRef.current.value = '';
      pending.current = null;
    };
    reader.readAsDataURL(f);
  }

  // 썸네일을 Marker(<image/>)로 렌더
  const markers = useMemo(() => {
    return regions.flatMap((r) => {
      const id = (r.properties as any)?.id;
      const up = uploads[id];
      if (!up) return [];
      const [lon, lat] = centroidOf(r);
      return [{ id, lon, lat, dataUrl: up.dataUrl }];
    });
  }, [regions, uploads]);

  return (
    <div className="upload-modal" onClick={onClose}>
      <div className="upload-box" style={{ width: 'min(920px, 92vw)' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>
          {countryName} <small style={{ color: '#6b7280' }}>({iso3})</small>
        </h3>
        <p style={{ marginTop: 0, color: '#6b7280' }}>
          {src ? `${src.name}를 클릭해 이미지를 업로드하세요.` : '이 나라는 아직 지역 데이터가 등록되지 않았습니다.'}
        </p>

        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />

        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          {src ? (
            <ComposableMap projection="geoMercator" style={{ width: '100%', height: 520, background: '#f8fbff' }}>
              <Geographies geography={src.url}>
                {({ geographies }) => (
                  <>
                    {geographies.map((geo) => {
                      const id = (geo.properties as any)?.id;
                      const name = (geo.properties as any)?.name || id;
                      const has = !!uploads[id];
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => openUpload(geo as any)}
                          style={{
                            default: { fill: has ? '#dbeafe' : '#eef2ff', stroke: '#94a3b8', strokeWidth: 0.6 },
                            hover:   { fill: has ? '#bfdbfe' : '#e0e7ff' },
                            pressed: { fill: has ? '#93c5fd' : '#c7d2fe' },
                          }}
                        />
                      );
                    })}
                    {markers.map((m) => (
                      <Marker key={`m-${m.id}`} coordinates={[m.lon, m.lat]}>
                        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                        {/* @ts-ignore: SVG image element */}
                        <image href={m.dataUrl} width={72} height={48} preserveAspectRatio="xMidYMid slice"
                          style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.35))', borderRadius: 6 }} />
                        <text y={56} textAnchor="middle" fontSize={10} fill="#374151" style={{ userSelect: 'none' }}>
                          {m.id}
                        </text>
                      </Marker>
                    ))}
                  </>
                )}
              </Geographies>
            </ComposableMap>
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
              이 나라는 아직 지원되지 않습니다. (KR, JP부터 제공)
            </div>
          )}
        </div>

        {/* 업로드된 목록(삭제 기능) */}
        {Object.keys(uploads).length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(uploads).map(([id, u]) => (
              <div key={id} className="card" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <img src={u.dataUrl} style={{ width: 80, height: 54, objectFit: 'cover', borderRadius: 6 }} />
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{u.name || id}</div>
                  <div style={{ color: '#6b7280' }}>{id}</div>
                </div>
                <button onClick={() => onRemove(id)} style={{ marginLeft: 8 }}>삭제</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
