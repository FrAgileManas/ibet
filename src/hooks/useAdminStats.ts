'use client';

import { useState, useEffect } from 'react';

interface AdminStats {
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
}

export function useAdminStats() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/stats');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        setData(stats);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
}
