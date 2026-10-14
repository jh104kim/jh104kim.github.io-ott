import "./globals.css";

export const metadata = {
  title: "Screen Intelligence Agent — 개인 OTT & 극장 스마트 추천",
  description: "한국에서 볼 수 있는 검증된 재미·인기 작품을 신뢰할 수 있는 40/40/10/10 지수와 함께 추천합니다.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
