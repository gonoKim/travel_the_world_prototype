// app/map/[iso2]/page.tsx
import { ISO2_LIST } from "@/data/iso2-list";

type Props = {
  params: { iso2: string };
};

export async function generateStaticParams() {
  // 빌드 시 생성할 모든 경로를 반환
  return ISO2_LIST.map((code) => ({ iso2: code }));
}

// (옵션) 동적 파라미터를 엄격히 제한하고 싶다면:
export const dynamicParams = false; // ISO2_LIST에 없는 값으로 접근 시 404

export default function MapDetailPage({ params }: Props) {
  const { iso2 } = params;

  // 여기서 사용하는 데이터는 "빌드타임에 확정" 가능한 것이어야 해요.
  // (런타임 서버 의존 fetch/쿠키/헤더 사용 X)
  return (
    <main>
      <h1>Map – {iso2}</h1>
      {/* ... */}
    </main>
  );
}
