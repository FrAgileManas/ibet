// lib/types.ts - Updated with pool calculation types

export interface User {
  id: string;
  email: string;
  name: string;
  balance: number;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BetOption {
  id: number;
  text: string;
}

export interface Bet {
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
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  participations?: BetParticipation[];
}

export interface BetParticipation {
  id: number;
  betId: number;
  userId: string;
  optionId: number;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface PaymentHistory {
  id: number;
  userId: string;
  type: 'credit' | 'debit' | 'bet_win' | 'bet_loss' | 'admin_adjustment';
  amount: number;
  description: string;
  referenceId?: number;
  balanceBefore: number;
  balanceAfter: number;
  createdBy?: string;
  createdAt: Date;
}

// Pool calculation types
export interface PoolCalculation {
  totalPool: number;
  commissionAmount: number;
  prizePool: number;
  optionBreakdown: OptionBreakdown[];
}

export interface OptionBreakdown {
  optionId: number;
  totalAmount: number;
  participantCount: number;
  potentialPrizeRatio: number;
}

export interface PrizeDistribution {
  userId: string;
  amount: number;
  winRatio: number;
  originalBet: number;
}

export interface PoolStats {
  totalPool: number;
  prizePool: number;
  commission: number;
  commissionRate: number;
  optionStats: OptionStat[];
}

export interface OptionStat {
  optionId: number;
  totalAmount: number;
  participantCount: number;
  potentialMultiplier: string;
}

// API Response types
export interface BetCompletionResponse {
  message: string;
  betId: number;
  winningOptionId: number;
  winningOptionText: string;
  totalPool: number;
  winnersCount: number;
  distributedAmount: number;
}

export interface CommissionUpdateResponse {
  message: string;
  betId: number;
  newCommissionRate: number;
}

// Error types
export interface ApiError {
  error: string;
}