// Import necessary types from Next.js for metadata handling
import type { Metadata } from "next";
// Import the Inter font from Google Fonts via Next.js optimization
import { Inter } from "next/font/google";
// Import global CSS styles
import "./globals.css";

// Initialize the Inter font with the 'latin' subset
const inter = Inter({ subsets: ["latin"] });

// Define metadata for the application (Title, Description) for SEO and browser tab display
export const metadata: Metadata = {
  title: "Enactus Portal",
  description: "Enactus Chapter Management System",
};

// Define the RootLayout component which wraps all pages in the application
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode; // Type validation for children props
}>) {
  return (
    // Set the HTML document language to English
    <html lang="en">
      {/* Apply the Inter font class to the body and render child components */}
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
