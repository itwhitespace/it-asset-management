"use client";

import ClientLayout from "./ClientLayout";

export default function DynamicClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}