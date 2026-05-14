import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DynamicClientLayout from "@/components/DynamicClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Whitespace Asset - IT Management",
  description: "Advanced IT Asset Management System for Whitespace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full bg-app-bg`}>
        <DynamicClientLayout>
          {children}
        </DynamicClientLayout>
      </body>
    </html>
  );
}
