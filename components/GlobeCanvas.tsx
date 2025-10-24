// components/GlobeCanvas.tsx
"use client";

import { useEffect, useRef } from "react";
import GlobeFactory, { GlobeInstance } from "globe.gl";
import * as topojson from "topojson-client";
import * as THREE from "three";

const WORLD_TOPO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// 색상 정의
const SEA = "#6fb3ff";     // 바다(지구 표면)
const LAND = "#f3e8c8ff";    // 대륙(아이보리)
const BLACK = "#000000";   // 경계선(검정)

type Props = {
  onCountryClick?: (feature: any) => void;
};

export default function GlobeCanvas({ onCountryClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const GlobeCtor =
      GlobeFactory as unknown as new (el: HTMLElement) => GlobeInstance;
    const globe = new GlobeCtor(containerRef.current);

    // 1) 텍스처 완전히 끄기 → 재질 색만 보이도록
    globe.globeImageUrl("" as unknown as string); // 또는: null as unknown as string
    globe.bumpImageUrl("" as unknown as string);

    // 2) 지구(바다) 재질: SEA
    const seaMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(SEA),
      shininess: 8,
      specular: new THREE.Color("#ffffff"),
    });
    globe
      .globeMaterial(seaMaterial)
      .showAtmosphere(false)              // 가장 깔끔한 톤
      .backgroundColor("#ffffff")         // 캔버스 배경(원하면 변경)
      // 3) 대륙을 아이보리로: 폴리곤을 살짝 띄워서 칠함
      .polygonAltitude(() => 0.002)       // 살짝 띄워서 색 겹침 방지
      .polygonCapColor(() => LAND)        // 면 = 아이보리
      .polygonSideColor(() => LAND)       // 옆면도 아이보리(아주 얇아서 거의 안 보임)
      .polygonStrokeColor(() => BLACK);   // 경계선 = 검정

    globeRef.current = globe;

    // 국가 데이터 로드 후 적용 + 핸들러 연결
    fetch(WORLD_TOPO_URL)
      .then((r) => r.json())
      .then((topology) => {
        const countries = topojson.feature(
          topology,
          (topology as any).objects.countries
        ) as any;

        globe
          .polygonsData(countries.features)
          .polygonLabel((d: any) => `<b>${d.properties.name}</b>`)
          .onPolygonClick((feat: any) => {
            onCountryClick?.(feat);
          });

        // 보기 각도/회전(원하면 조정)
        (globe as any).pointOfView?.({ lat: 20, lng: 120, altitude: 2.2 }, 800);
        const controls = (globe as any).controls?.();
        if (controls) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0;
        }
      });

    // 리사이즈 & DPI 최적화 (모바일 가독성)
    const handleResize = () => {
      globe.width(window.innerWidth).height(window.innerHeight);
      const r = (globe as any).renderer?.();
      if (r?.setPixelRatio) {
        r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if ((globe as any)._destructor) (globe as any)._destructor();
      globeRef.current = null;
    };
  }, [onCountryClick]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}
