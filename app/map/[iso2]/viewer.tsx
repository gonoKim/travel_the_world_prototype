"use client";

import Link from "next/link";
import RegionSVG from "@/components/RegionSVG";
import { useSlideReady } from "../SlideContext";

const FILE_BY_CODE: Record<string, { file: string; prefix: string; imgBase?: string }> = {
  jpn: { file: "/regions/jpn_regions.svg", prefix: "jpn", imgBase: "/images/pref" }, // ★ jpn
  kor: { file: "/regions/kor_regions.svg", prefix: "kor", imgBase: "/images/pref" },
};


export default function Viewer({ code }: { code: string }) {
  const { ready } = useSlideReady();
  const conf = FILE_BY_CODE[code] ?? { file: `/regions/${code}.svg`, prefix: code };

  if (!ready) return <div className="p-6" />;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold uppercase">{code}</h1>
        <Link href="/" className="rounded px-3 py-1 border">뒤로</Link>
      </div>

      <RegionSVG
        src={conf.file}
        imgBase={conf.imgBase}
        countryPrefix={conf.prefix}
        defaultFill="#f4f1e6"
        useIndexJson={false} // ★ 지금은 false (404 줄이려면 index.json 세팅 후 true)
        onRegionClick={({ code: rcode, name }) => {
          console.log("clicked:", rcode, name);
        }}
      />
    </div>
  );
}
