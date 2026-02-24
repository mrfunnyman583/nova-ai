import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nova AI — Free AI Chatbot",
  description:
    "Chat with Nova AI — a sleek, free AI chatbot powered by open-source models. No sign-up required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
