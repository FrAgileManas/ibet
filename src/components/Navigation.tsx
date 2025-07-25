'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Settings,
  Home,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  isAdmin?: boolean;
  userName?: string;
}

export default function Navigation({ isAdmin = false, userName }: NavigationProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const publicNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/bets', label: 'All Bets', icon: Trophy },
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/bets', label: 'Bets', icon: Trophy },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const navItems = isAdmin ? [...publicNavItems, ...adminNavItems] : publicNavItems;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Trophy className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                BettingPlatform
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}

            {/* User Info and Logout */}
            <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200 dark:border-gray-700">
              {userName && (
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {isAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2">
                      Admin
                    </span>
                  )}
                  {userName}
                </span>
              )}
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {userName && (
                  <div className="px-3 py-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {isAdmin && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2">
                          Admin
                        </span>
                      )}
                      {userName}
                    </span>
                  </div>
                )}
                <Link
                  href="/logout"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
