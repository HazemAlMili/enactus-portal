import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import CloudBackground from "@/components/layout/CloudBackground";
import { NotificationProvider } from "@/components/ui/notification";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Enactus Portal",
  description: "Enactus Chapter Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NotificationProvider>
          <CloudBackground />
          <main className="relative z-10">
            {children}
          </main>
        </NotificationProvider>
      </body>
    </html>
  );
}
