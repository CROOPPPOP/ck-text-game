import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "../components/PWARegister";

export const metadata: Metadata = {
  title: "Chronicles: Text Simulator",
  description: "AI-driven persistent text simulation game",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chronicles",
  },
  openGraph: {
    title: "Chronicles: Text Simulator",
    description: "AI-driven persistent text simulation game",
  },
};

export const viewport: Viewport = {
  themeColor: "#d4af37",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
