'use client';

import { useAdminStats } from '@/hooks/useAdminStats';
import AdminStats from './AdminStats';
import AdminAnalytics from './AdminAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No data available for the dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats Cards */}
      <AdminStats stats={stats} />

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">New Users (24h)</span>
                <span className="font-semibold">{stats.recentUsers}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">New Bets (24h)</span>
                <span className="font-semibold">{stats.recentBets}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">Total Participations (24h)</span>
                <span className="font-semibold">{stats.recentParticipations}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Commission Earned (24h)</span>
                <span className="font-semibold text-green-600">
                  ₹{stats.recentCommission.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <AdminAnalytics />
      </div>
    </div>
  );
}
