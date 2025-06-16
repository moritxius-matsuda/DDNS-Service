import { ClerkProvider } from "@clerk/nextjs";
import { type Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "./components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DDNS Service - dm1lx.de",
  description: "Manage your DDNS hostnames and IP addresses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
