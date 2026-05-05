import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit, DM_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Moodine | Find Restaurants by Mood",
  description: "Find the perfect restaurant based on your mood, occasion, and vibe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable} ${dmMono.variable} scroll-smooth`}>
      <body className="font-outfit bg-cream text-ink antialiased min-h-screen flex flex-col">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
