'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  userGrowth: Array<{ month: string; users: number }>;
  betsByStatus: Array<{ status: string; count: number; color: string }>;
  commissionTrend: Array<{ month: string; commission: number }>;
  topUsers: Array<{ name: string; participations: number; totalAmount: number }>;
}

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState('userGrowth');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading analytics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            No analytics data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    switch (selectedMetric) {
      case 'userGrowth':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'betStatus':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analyticsData.betsByStatus}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ status, count }) => `${status}: ${count}`}
              >
                {analyticsData.betsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'commission':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData.commissionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value}`, 'Commission']} />
              <Bar dataKey="commission" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Analytics</CardTitle>
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="userGrowth">User Growth</SelectItem>
            <SelectItem value="betStatus">Bet Status</SelectItem>
            <SelectItem value="commission">Commission</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {renderChart()}
        
        {/* Top Users Table */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Top Users by Participation</h4>
          <div className="space-y-2">
            {analyticsData.topUsers.slice(0, 5).map((user, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <span className="font-medium">{user.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {user.participations} bets
                  </span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  ₹{user.totalAmount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
