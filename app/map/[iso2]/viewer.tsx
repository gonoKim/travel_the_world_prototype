"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSlideReady } from "../SlideContext";

export default function Viewer({ code }: { code: string }) {
  const { ready } = useSlideReady();
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ready || !code) return;
    setExists(null);
    fetch(`/regions/${code}.svg`, { method: "HEAD" })
      .then(r => setExists(r.ok))
      .catch(() => setExists(false));
  }, [ready, code]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold uppercase">{code}</h1>
        <Link href="/" className="rounded px-3 py-1 border">뒤로</Link>
      </div>
      {!ready && <div style={{ height: 24 }} />}      {/* 슬라이드 중 비워두기 */}
      {ready && exists === null && <p>로딩 중…</p>}
      {ready && exists === false && <p>/regions/{code}.svg 없음</p>}
      {ready && exists === true && <img src={`/regions/${code}.svg`} alt={`${code} map`} />}
    </div>
  );
}
