// hooks/usePoolStats.ts
import { useState, useEffect } from 'react';

interface OptionStat {
  optionId: number;
  totalAmount: number;
  participantCount: number;
  potentialMultiplier: string;
}

interface PoolStats {
  totalPool: number;
  prizePool: number;
  commission: number;
  commissionRate: number;
  optionStats: OptionStat[];
}

export function usePoolStats(betId: number, refreshInterval = 5000) {
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoolStats = async () => {
    try {
      const response = await fetch(`/api/bets/${betId}/pool-stats`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pool stats');
      }
      
      const data = await response.json();
      setPoolStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching pool stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPoolStats();

    // Set up polling for real-time updates
    const interval = setInterval(fetchPoolStats, refreshInterval);

    return () => clearInterval(interval);
  }, [betId, refreshInterval]);

  const refresh = () => {
    setIsLoading(true);
    fetchPoolStats();
  };

  return {
    poolStats,
    isLoading,
    error,
    refresh
  };
}