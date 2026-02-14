import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "EventPro - ניהול אירועים חכם",
  description: "מערכת ניהול אירועים, הושבה חכמה וניהול מוזמנים",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
