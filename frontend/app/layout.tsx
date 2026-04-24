import type { Metadata } from "next";
import { Inter, Playfair_Display, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"] 
});

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-playfair",
  weight: ["600", "700"] 
});

const lora = Lora({ 
  subsets: ["latin"], 
  variable: "--font-lora",
  weight: ["400"] 
});

export const metadata: Metadata = {
  title: "Versiculus",
  description: "A daily Bible word puzzle game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} ${lora.variable} font-inter antialiased bg-[#121213] text-white`}
      >
        {children}
      </body>
    </html>
  );
}
