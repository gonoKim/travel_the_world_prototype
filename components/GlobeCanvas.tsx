// components/GlobeCanvas.tsx
"use client"

import { useEffect, useRef } from "react"
import GlobeFactory, { GlobeInstance } from "globe.gl"
import * as topojson from "topojson-client"
import useGlobeStore from "@/store/globe"

const WORLD_TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

type Props = { onCountryClick?: () => void }

const NUMERIC_TO_ALPHA3: Record<string, string> = {
  "392": "JPN", // 일본
  "410": "KOR", // 한국
  // 필요 시 이후 국가를 여기에 추가
}
export default function GlobeCanvas({ onCountryClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const globeRef = useRef<GlobeInstance | null>(null)
  const setCountry = useGlobeStore(s => s.setCountry)

  useEffect(() => {
    if (!containerRef.current) return

    // 타입 정의가 new 생성자 시그니처라서 생성자로 사용
    const GlobeCtor = GlobeFactory as unknown as new (el: HTMLElement) => GlobeInstance
    const globe = new GlobeCtor(containerRef.current)

    globe
      .backgroundColor("#ffffff")
      .showAtmosphere(true)
      .atmosphereColor("#88aaff")
      .atmosphereAltitude(0.2)
      .enablePointerInteraction(true)
      .polygonCapColor(() => "rgba(98, 163, 240, 0.25)")
      .polygonSideColor(() => "rgba(98, 163, 240, 0.25)")
      .polygonStrokeColor(() => "rgba(80, 120, 200, 0.8)")
      .onPolygonClick((feat: any) => {
        const iso3 = feat.properties?.iso_a3 ?? NUMERIC_TO_ALPHA3[String(feat.id)] ?? String(feat.id)
        const name = feat.properties?.name ?? "Unknown"
        setCountry({ iso3, name })
        onCountryClick?.()
      })
      .onPolygonHover((feat: any, prev: any) => {
        if (feat !== prev && containerRef.current) {
          containerRef.current.style.cursor = feat ? "pointer" : "grab"
        }
      })

    globeRef.current = globe

    // 국가 데이터 로드
    fetch(WORLD_TOPO_URL)
      .then(r => r.json())
      .then((topology) => {
        const countries = topojson.feature(topology, topology.objects.countries) as any
        globe
          .polygonsData(countries.features)
          .polygonLabel((d: any) => `<b>${d.properties.name}</b>`)

        // 안전한 호출용으로 한 번 캐스팅
        const g = globe as unknown as {
          pointOfView?: (pov: { lat: number; lng: number; altitude?: number }, ms?: number) => void
          controls?: () => any
        }

        // 옵셔널 호출(읽기)은 OK
        g.pointOfView?.({ lat: 20, lng: 120, altitude: 2.2 }, 1000)

        // 좌변 할당은 옵셔널 체이닝 금지 → 먼저 받아서 조건부로 설정
        const controls = g.controls?.()
        if (controls) {
          controls.autoRotate = true
          controls.autoRotateSpeed = 0.55
        }
      })

    const handleResize = () => {
      globe.width(window.innerWidth).height(window.innerHeight)
    }
    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      // 라이브러리 내부 파괴자 유무에 따라 정리
      if ((globe as any)._destructor) (globe as any)._destructor()
      globeRef.current = null
    }
  }, [onCountryClick, setCountry])

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
}
