// src/lib/types.ts

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  balance: number;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Bet types
export interface BetOption {
  id: number;
  text: string;
}

export interface Bet {
  id: number;
  title: string;
  description: string | null;
  options: BetOption[];
  status: 'active' | 'locked' | 'completed';
  commissionRate: number;
  totalPool: number;
  commissionAmount: number;
  prizePool: number;
  winningOptionId?: number | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
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

// Payment history
export interface PaymentHistory {
  id: number;
  userId: string;
  type: 'credit' | 'debit' | 'bet_win' | 'bet_loss' | 'admin_adjustment';
  amount: number;
  description: string;
  referenceId?: number | null;
  balanceBefore: number;
  balanceAfter: number;
  createdBy?: string | null;
  createdAt: Date;
}