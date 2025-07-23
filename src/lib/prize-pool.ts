// lib/prize-pool.ts

import { prisma as db } from './db';
import { Decimal } from '@prisma/client/runtime/library';
import type { JsonValue } from '@prisma/client/runtime/library';

export interface PoolCalculation {
  totalPool: number;
  commissionAmount: number;
  prizePool: number;
  optionBreakdown: Array<{
    optionId: number;
    totalAmount: number;
    participantCount: number;
    potentialPrizeRatio: number;
  }>;
}

export interface PrizeDistribution {
  userId: string;
  amount: number;
  winRatio: number;
  originalBet: number;
}

// Keep your original BetOption interface
// Keep your original BetOption interface
interface BetOption {
  id: number;
  name: string;
  [key: string]: any; 
}

// Fix the type guard by casting to unknown first
function isBetOptionArray(value: JsonValue): value is BetOption[] {
  if (!Array.isArray(value)) return false;
  
  return value.every(item => 
    typeof item === 'object' && 
    item !== null && 
    'id' in item &&
    'name' in item &&
    typeof (item as Record<string, unknown>).id === 'number' && 
    typeof (item as Record<string, unknown>).name === 'string'
  );
}


// Safe function to parse options from JSON
function parseOptionsFromJson(jsonValue: JsonValue): BetOption[] {
  if (isBetOptionArray(jsonValue)) {
    return jsonValue;
  }
  
  // Fallback: return empty array if parsing fails
  console.warn('Failed to parse bet options from JSON:', jsonValue);
  return [];
}

/**
 * Calculate real-time pool information for a bet
 */
export async function calculatePoolInfo(betId: number): Promise<PoolCalculation> {
  const bet = await db.bets.findUnique({
    where: { id: betId },
    include: {
      bet_participations: true
    }
  });

  if (!bet) {
    throw new Error('Bet not found');
  }

  const totalPool = bet.bet_participations.reduce((sum, p) => sum + Number(p.amount), 0);
  const commissionAmount = (totalPool * Number(bet.commission_rate || 1.0)) / 100;
  const prizePool = totalPool - commissionAmount;

  // Safely parse options from JSON
  const options = parseOptionsFromJson(bet.options);

  // Calculate breakdown by option
  const optionBreakdown = options.map((option) => {
    const optionParticipations = bet.bet_participations.filter(p => p.option_id === option.id);
    const totalAmount = optionParticipations.reduce((sum, p) => sum + Number(p.amount), 0);
    const participantCount = optionParticipations.length;
    // Potential prize ratio if this option wins
    const potentialPrizeRatio = totalAmount > 0 ? prizePool / totalAmount : 0;

    return {
      optionId: option.id,
      totalAmount,
      participantCount,
      potentialPrizeRatio
    };
  });

  return {
    totalPool,
    commissionAmount,
    prizePool,
    optionBreakdown
  };
}

/**
 * Calculate prize distribution for winners
 */
export async function calculatePrizeDistribution(
  betId: number,
  winningOptionId: number
): Promise<PrizeDistribution[]> {
  const poolInfo = await calculatePoolInfo(betId);
  
  const bet = await db.bets.findUnique({
    where: { id: betId },
    include: {
      bet_participations: {
        where: { option_id: winningOptionId },
        include: { user: true }
      }
    }
  });

  if (!bet) {
    throw new Error('Bet not found');
  }

  const winners = bet.bet_participations;
  const totalWinnerAmount = winners.reduce((sum, w) => sum + Number(w.amount), 0);

  if (totalWinnerAmount === 0) {
    return []; // No winners
  }

  return winners.map(winner => {
    const winRatio = Number(winner.amount) / totalWinnerAmount;
    const prizeAmount = poolInfo.prizePool * winRatio;

    return {
      userId: winner.user_id!,
      amount: prizeAmount,
      winRatio,
      originalBet: Number(winner.amount)
    };
  });
}

/**
 * Distribute prizes to winners and update balances
 */
export async function distributePrizes(betId: number, winningOptionId: number): Promise<{
  totalPool: number;
  winnersCount: number;
  distributedAmount: number;
}> {
  return await db.$transaction(async (tx) => {
    // Get bet details
    const bet = await tx.bets.findUnique({
      where: { id: betId },
      include: { bet_participations: true }
    });

    if (!bet) {
      throw new Error('Bet not found');
    }

    if (bet.status === 'completed') {
      throw new Error('Bet already completed');
    }

    // Calculate pool information
    const totalPool = bet.bet_participations.reduce((sum, p) => sum + Number(p.amount), 0);
    const commissionAmount = (totalPool * Number(bet.commission_rate || 1.0)) / 100;
    const prizePool = totalPool - commissionAmount;

    // Get winners
    const winners = bet.bet_participations.filter(p => p.option_id === winningOptionId);
    const totalWinnerAmount = winners.reduce((sum, w) => sum + Number(w.amount), 0);

    // Handle edge cases
    if (totalPool === 0) {
      // No participants - just mark as completed
      await tx.bets.update({
        where: { id: betId },
        data: {
          status: 'completed',
          winning_option_id: winningOptionId,
          total_pool: new Decimal(0),
          commission_amount: new Decimal(0),
          prize_pool: new Decimal(0),
          completed_at: new Date(),
          updated_at: new Date()
        }
      });

      return { totalPool: 0, winnersCount: 0, distributedAmount: 0 };
    }

    if (totalWinnerAmount === 0) {
      // No winners - just mark as completed, no prize distribution
      await tx.bets.update({
        where: { id: betId },
        data: {
          status: 'completed',
          winning_option_id: winningOptionId,
          total_pool: new Decimal(totalPool),
          commission_amount: new Decimal(commissionAmount),
          prize_pool: new Decimal(prizePool),
          completed_at: new Date(),
          updated_at: new Date()
        }
      });

      return { totalPool, winnersCount: 0, distributedAmount: 0 };
    }

    let totalDistributed = 0;

    // Distribute prizes to winners
    for (const winner of winners) {
      const winRatio = Number(winner.amount) / totalWinnerAmount;
      const prize = Math.floor(prizePool * winRatio * 100) / 100; // Round to 2 decimals

      // Get current user balance
      const user = await tx.users.findUnique({
        where: { id: winner.user_id! }
      });

      if (!user) {
        throw new Error(`User ${winner.user_id} not found`);
      }

      // Update user balance
      await tx.users.update({
        where: { id: winner.user_id! },
        data: {
          balance: { increment: new Decimal(prize) },
          updated_at: new Date()
        }
      });

      // Create payment history entry
      await tx.payment_history.create({
        data: {
          user_id: winner.user_id!,
          type: 'bet_win',
          amount: new Decimal(prize),
          description: `Prize from bet: ${bet.title}`,
          reference_id: betId,
          balance_before: user.balance || new Decimal(0),
          balance_after: (user.balance || new Decimal(0)).add(new Decimal(prize))
        }
      });

      totalDistributed += prize;
    }

    // Create payment history for losers
    const losers = bet.bet_participations.filter(p => p.option_id !== winningOptionId);
    for (const loser of losers) {
      const user = await tx.users.findUnique({
        where: { id: loser.user_id! }
      });

      if (user) {
        await tx.payment_history.create({
          data: {
            user_id: loser.user_id!,
            type: 'bet_loss',
            amount: new Decimal(Number(loser.amount)).neg(),
            description: `Loss from bet: ${bet.title}`,
            reference_id: betId,
            balance_before: user.balance || new Decimal(0),
            balance_after: user.balance || new Decimal(0) // Balance doesn't change for losses (already deducted)
          }
        });
      }
    }

    // Update bet status
    await tx.bets.update({
      where: { id: betId },
      data: {
        status: 'completed',
        winning_option_id: winningOptionId,
        total_pool: new Decimal(totalPool),
        commission_amount: new Decimal(commissionAmount),
        prize_pool: new Decimal(prizePool),
        completed_at: new Date(),
        updated_at: new Date()
      }
    });

    return {
      totalPool,
      winnersCount: winners.length,
      distributedAmount: totalDistributed
    };
  });
}

/**
 * Get real-time pool statistics for display
 */
export async function getPoolStats(betId: number): Promise<{
  totalPool: number;
  prizePool: number;
  commission: number;
  commissionRate: number;
  optionStats: Array<{
    optionId: number;
    totalAmount: number;
    participantCount: number;
    potentialMultiplier: string;
  }>;
}> {
  const poolInfo = await calculatePoolInfo(betId);
  
  return {
    totalPool: poolInfo.totalPool,
    prizePool: poolInfo.prizePool,
    commission: poolInfo.commissionAmount,
    commissionRate: await getBetCommissionRate(betId),
    optionStats: poolInfo.optionBreakdown.map(option => ({
      optionId: option.optionId,
      totalAmount: option.totalAmount,
      participantCount: option.participantCount,
      potentialMultiplier: option.potentialPrizeRatio.toFixed(2)
    }))
  };
}

async function getBetCommissionRate(betId: number): Promise<number> {
  const bet = await db.bets.findUnique({
    where: { id: betId },
    select: { commission_rate: true }
  });

  return Number(bet?.commission_rate || 1.0);
}
