import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keepsake — personalized video greetings & tributes",
  description:
    "Create a heartfelt video for the holidays, celebrations or in loving memory — with photos of up to 5 people or pets. Everything stays on your device.",
};

export const viewport: Viewport = {
  themeColor: "#fbf7f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
