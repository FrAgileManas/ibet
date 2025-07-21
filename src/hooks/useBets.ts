import { useState, useEffect } from 'react';

interface BetOption {
  id: number;
  text: string;
}

interface BetParticipation {
  id: number;
  betId: number;
  userId: string;
  optionId: number;
  amount: number;
  user?: {
    name: string;
  };
}

interface Bet {
  id: number;
  title: string;
  description: string;
  options: BetOption[];
  status: 'active' | 'locked' | 'completed';
  commissionRate: number;
  totalPool: number;
  commissionAmount: number;
  prizePool: number;
  winningOptionId?: number;
  createdAt: Date;
  completedAt?: Date;
  participations?: BetParticipation[];
}

export interface BetsState {
  bets: Bet[];
  loading: boolean;
  error: string | null;
  refreshBets: () => void;
}

export function useBets(): BetsState {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/bets');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bets');
      }
      
      const data = await response.json();
      setBets(data.bets || []);
    } catch (err: any) {
      console.error('Error fetching bets:', err);
      setError(err.message || 'Failed to fetch bets');
      setBets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, []);

  return {
    bets,
    loading,
    error,
    refreshBets: fetchBets
  };
}

// Hook for fetching a specific bet with details
export function useBet(betId: number | null) {
  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBet = async () => {
    if (!betId) {
      setBet(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/bets/${betId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bet details');
      }
      
      const data = await response.json();
      setBet(data.bet);
    } catch (err: any) {
      console.error('Error fetching bet:', err);
      setError(err.message || 'Failed to fetch bet details');
      setBet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBet();
  }, [betId]);

  return {
    bet,
    loading,
    error,
    refreshBet: fetchBet
  };
}