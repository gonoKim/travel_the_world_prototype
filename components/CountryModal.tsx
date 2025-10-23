// components/CountryModal.tsx
"use client"
import { useEffect, useState, useMemo } from "react"
import useGlobeStore from "@/store/globe"

const NUMERIC_TO_ALPHA3: Record<string, string> = {
  "392": "JPN", // 일본
  "410": "KOR", // 한국
  // 필요 시 이후 국가를 여기에 추가
}

export default function CountryModal({ onClose }: { onClose: () => void }) {
  const { selectedCountry } = useGlobeStore()
  const [svg, setSvg] = useState<string | null>(null)

  const codeForFile = useMemo(() => {
    if (!selectedCountry) return null
    const c = selectedCountry.iso3
    // 숫자면 알파3로 변환
    const alpha3 = /^\d+$/.test(c) ? (NUMERIC_TO_ALPHA3[c] ?? c) : c
    return alpha3.toLowerCase()
  }, [selectedCountry])

  useEffect(() => {
    if (!selectedCountry || !codeForFile) return
    const url = `/regions/${codeForFile}.svg`
    fetch(url)
      .then(res => { if (!res.ok) throw new Error("no svg"); return res.text() })
      .then(text => setSvg(text))
      .catch(() => setSvg(null))
  }, [selectedCountry, codeForFile])

  if (!selectedCountry) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
          <h2 style={{margin:0}}>{selectedCountry.name} 지도</h2>
          <button className="close-btn" onClick={onClose}>닫기</button>
        </div>

        {svg ? (
          <div className="svg-wrap" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <div className="svg-wrap" style={{padding:16}}>
            <p style={{margin:0}}>해당 국가의 SVG 지도가 아직 없습니다.</p>
            <p style={{margin:'8px 0 0 0',fontSize:12,color:'#888'}}>
              /public/regions/{codeForFile}.svg 파일을 추가하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
