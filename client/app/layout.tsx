import type { Metadata } from "next";
import { Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";

import CloudBackground from "@/components/layout/CloudBackground";
import { NotificationProvider } from "@/components/ui/notification";

// Optimize font loading with proper display strategy
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Prevents invisible text while loading
  preload: true,
  variable: '--font-inter'
});

// Load Press Start 2P with optimization
const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pixel',
  preload: true,
});

export const metadata: Metadata = {
  title: "Enactus Portal",
  description: "Enactus Chapter Management System",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${pressStart2P.variable} ${inter.className}`}>
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
