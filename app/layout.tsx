import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "카드 맞추기 게임",
  description: "PAIR - 과일 카드 맞추기 게임",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
