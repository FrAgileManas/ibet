import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-purple-50 text-center px-4">
      <main className="max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 animate-fade-in-down">
          Welcome to iBet
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 animate-fade-in-up">
          The friendly platform to place bets with your friends, track your winnings, and manage your payments all in one place.
        </p>
        <Link href="/bets">
          <Button size="lg" className="animate-bounce">
            Go to Bets Page
          </Button>
        </Link>
      </main>

      <footer className="absolute bottom-8 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} iBet. All rights reserved.</p>
      </footer>
    </div>
  );
}