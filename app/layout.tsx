import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const noto = Noto_Sans_SC({ variable: "--font-noto", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Cislunar–I · 地月工业化追踪",
  description: "以真实物理量与工程数据追踪地月工业化和人类迈向 I 型文明的进程。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${geist.variable} ${mono.variable} ${noto.variable}`}>{children}</body></html>;
}
