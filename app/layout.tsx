export const metadata = {
  title: "여행추억쌓기 | Globe",
  description: "회전하는 지구에서 국가를 클릭해 추억을 기록하는 앱",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
