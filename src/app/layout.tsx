import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-app-bg text-app-text antialiased transition-colors duration-300">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}