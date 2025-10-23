# 여행추억쌓기 - Next.js + Globe.gl 스타터

- Next.js(App Router) + globe.gl + TopoJSON
- 국가 클릭 → 모달에 해당 국가 SVG 지도 표시(/public/regions/[iso3].svg)
- 기본 제공: 일본(JPN), 한국(KOR) 데모 SVG

## 실행
```bash
npm i
npm run dev
# http://localhost:3000/globe
```

## 커스터마이즈
- 국가 SVG는 ISO3 코드 소문자 기준으로 `/public/regions/{iso3}.svg` 에 추가
  - 예: 일본 JPN → `public/regions/jpn.svg`
- 지구 폴리곤 데이터는 world-atlas TopoJSON을 사용 (자동 로드)

## 구조
- `app/globe/page.tsx` : 글로브 화면
- `components/GlobeCanvas.tsx` : globe.gl 초기화 및 상호작용
- `components/CountryModal.tsx` : 국가 모달 + SVG 로더
- `store/globe.ts` : 선택 국가 상태
