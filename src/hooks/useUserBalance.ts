import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export interface UserBalance {
  balance: number;
  loading: boolean;
  error: string | null;
  refreshBalance: () => void;
}

export function useUserBalance(): UserBalance {
  const { user, isLoaded } = useUser();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!user || !isLoaded) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user balance');
      }
      
      const data = await response.json();
      setBalance(data.user?.balance || 0);
    } catch (err: any) {
      console.error('Error fetching balance:', err);
      setError(err.message || 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user, isLoaded]);

  return {
    balance,
    loading,
    error,
    refreshBalance: fetchBalance
  };
}