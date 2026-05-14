"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="flex-1 bg-app-bg" />}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 overflow-hidden">
            <Header />
            <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </Suspense>
    </AuthProvider>
  );
}
