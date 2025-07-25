import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Friendly Betting Platform",
  description: "A friendly place to make bets with friends.",
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
          <header className="bg-white shadow-md">
            <div className="container mx-auto flex justify-between items-center p-4">
              <Link href="/" className="text-2xl font-bold text-gray-800">
                iBet
              </Link>
              <nav className="flex items-center space-x-4">
                <SignedIn>
                   <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
                   <Link href="/bets" className="text-gray-600 hover:text-gray-900">Bets</Link>
                   <Link href="/payments" className="text-gray-600 hover:text-gray-900">Payments</Link>
                   <AdminNav />
                   <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>
                  <Link href="/sign-in" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Sign In
                  </Link>
                   <Link href="/sign-up" className="px-4 py-2 rounded-md text-blue-600 border border-blue-600 hover:bg-blue-50">
                    Sign Up
                  </Link>
                </SignedOut>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}