"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSlideReady } from "../SlideContext";

const ISO2_TO_NAME: Record<string, string> = { jp: "jpn", kr: "kor" };

export default function Viewer({ code }: { code: string }) {
  const { ready } = useSlideReady();
  const [svgText, setSvgText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const fileName = useMemo(() => ISO2_TO_NAME[code] ?? code, [code]);
  const src = `${base}/regions/${fileName}.svg`;

  // ✅ 데이터를 "바로" 받아 캐시에 담아둠
  useEffect(() => {
    if (!code) return;
    setError(null);
    setSvgText(null);
    fetch(src, { method: "GET", cache: "no-store" })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(txt => {
        if (!txt.includes("<svg")) throw new Error("Not an SVG");
        setSvgText(txt);           // 미리 준비해두기
      })
      .catch(e => setError(e.message ?? "load-failed"));
  }, [code, src]);

  const info = (
    <div className="mb-3 text-sm text-gray-600">
      <div><b>file:</b> {`/public/regions/${fileName}.svg`}</div>
      <div><b>request URL:</b> {src}</div>
      {error && <div className="text-red-600"><b>load error:</b> {error}</div>}
      <div><a className="underline" href={src} target="_blank">새 탭으로 직접 열기</a></div>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold uppercase">{code}</h1>
        <Link href="/" className="rounded px-3 py-1 border">뒤로</Link>
      </div>

      {/* 디버그 정보는 항상 보이게 두면 원인 파악 쉬움 */}
      {info}

      {/* ✅ 슬라이드가 끝나기 전엔 렌더만 숨김(데이터는 이미 받아둠) */}
      {ready ? (
        error ? (
          <div className="p-3 border rounded">
            이미지를 불러오지 못했습니다. 위의 URL을 새 탭에서 열어 확인해 주세요.
          </div>
        ) : svgText ? (
          <div
            className="w-full"
            dangerouslySetInnerHTML={{ __html: svgText }}
          />
        ) : (
          <p>로딩 중…</p>
        )
      ) : (
        <div style={{ height: 24 }} />   // 슬라이드 중 공백만
      )}
    </div>
  );
}
