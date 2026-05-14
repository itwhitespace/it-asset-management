"use client";

import dynamic from "next/dynamic";

const ClientLayout = dynamic(() => import("./ClientLayout"), {
  ssr: false,
});

export default function DynamicClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
