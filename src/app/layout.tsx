import type { Metadata } from "next";
import "./globals.css";
import { isAuthenticated } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
export const metadata: Metadata = {
  title: "Herminator | Operator Dashboard",
  description: "Herminator operator dashboard",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>%E2%9A%A1</text></svg>" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();

  return (
    <html lang="en" className="dark">
      <body className="relative overflow-x-hidden antialiased">
        {authed ? (
          <div className="relative z-10 min-h-screen">
            <MobileNav />
            <Sidebar />
            <main className="px-4 pb-7 pt-24 md:ml-[244px] md:px-7 md:pt-7 xl:px-8">
              <div className="mx-auto max-w-[1480px] fade-in">
                {children}
              </div>
            </main>
          </div>
        ) : (
          <div className="relative z-10">{children}</div>
        )}
      </body>
    </html>
  );
}
