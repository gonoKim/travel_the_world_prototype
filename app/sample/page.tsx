// app/sample/page.tsx (또는 pages/sample.tsx)
"use client";

import RegionSVG from "@/components/RegionSVG";

export default function SamplePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
        Sample Regions (이미지 채움 테스트)
      </h1>
      <p style={{ marginBottom: 16 }}>
        <code>sample_regions.svg</code>의 <code>&lt;g data-name="Alpha"&gt;</code>와
        <code>&lt;path data-name="Beta Island"&gt;</code>에 각각
        <code>alpha.jpg</code>, <code>beta-island.jpg</code>가 채워집니다.
      </p>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
        <RegionSVG
          src="/sample/sample_regions.svg"
          imgBase="/sample/images/pref"
          countryPrefix="test"
          defaultFill="#f4f1e6"
          useIndexJson={true}               // index.json에 있는 키만 채움
          preserveAspectRatio="xMidYMid slice"
          onRegionClick={({ code, name }) => {
            console.log("clicked:", code, name);
          }}
        />
      </div>
    </main>
  );
}
