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
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
