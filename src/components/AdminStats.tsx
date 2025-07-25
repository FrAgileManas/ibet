'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Trophy, IndianRupee } from 'lucide-react';

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    totalBets: number;
    activeBets: number;
    completedBets: number;
    lockedBets: number;
    totalPrizePool: number;
    totalCommission: number;
    totalParticipations: number;
    averagePoolSize: number;
    recentUsers: number;
    recentBets: number;
    recentParticipations: number;
    recentCommission: number;
  };
}

interface StatCard {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
}

export default function AdminStats({ stats }: AdminStatsProps) {
  // Helper function to safely format numbers
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return Math.round(num).toLocaleString();
  };

  // Helper function to safely format currency
  const formatCurrency = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) return '₹0';
    return `₹${Math.round(num).toLocaleString()}`;
  };

  // Helper function to safely format decimal currency
  const formatDecimalCurrency = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) return '₹0.00';
    return `₹${num.toFixed(2)}`;
  };

  const statCards: StatCard[] = [
    {
      title: 'Total Users',
      value: formatNumber(stats.totalUsers),
      icon: Users,
      description: `+${formatNumber(stats.recentUsers)} in last 24h`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Active Bets',
      value: formatNumber(stats.activeBets),
      icon: TrendingUp,
      description: `${formatNumber(stats.completedBets)} completed, ${formatNumber(stats.lockedBets)} locked`,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Total Prize Pool',
      value: formatCurrency(stats.totalPrizePool),
      icon: Trophy,
      description: `Avg: ${formatCurrency(stats.averagePoolSize)} per bet`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Commission Earned',
      value: formatCurrency(stats.totalCommission),
      icon: IndianRupee,
      description: `+${formatDecimalCurrency(stats.recentCommission)} today`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
