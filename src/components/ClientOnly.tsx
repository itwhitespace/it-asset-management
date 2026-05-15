"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const DynamicClientLayout = dynamic(
  () => import("@/components/DynamicClientLayout"),
  { ssr: false }
);

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // ส่ง Component ว่างๆ ออกไปก่อนในจังหวะ Server
    return <div style={{ minHeight: '100vh', backgroundColor: '#09090b' }} />;
  }

  return <DynamicClientLayout>{children}</DynamicClientLayout>;
}