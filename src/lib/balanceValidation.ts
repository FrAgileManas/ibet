import { prisma } from '@/lib/db';

export interface BalanceTransaction {
  balanceBefore: number;
  balanceAfter: number;
}

/**
 * Validates and updates user balance with proper transaction handling
 */
export async function validateAndUpdateBalance(
  userId: string,
  amount: number,
  type: 'debit' | 'credit',
  tx?: any // Prisma transaction client
): Promise<BalanceTransaction> {
  const dbClient = tx || prisma;
  
  const user = await dbClient.users.findUnique({ 
    where: { id: userId } 
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const currentBalance = user.balance ?? 0; // Handle null balance
  
  if (type === 'debit' && currentBalance < amount) {
    throw new Error('Insufficient balance');
  }
  
  const balanceBefore = currentBalance;
  const balanceAfter = type === 'debit' 
    ? balanceBefore - amount 
    : balanceBefore + amount;
  
  // Use Prisma's atomic operations
  await dbClient.users.update({
    where: { id: userId },
    data: { 
      balance: type === 'debit' 
        ? { decrement: amount }
        : { increment: amount }
    }
  });
  
  return { balanceBefore, balanceAfter };
}

/**
 * Validates bet participation amount
 */
export function validateBetAmount(amount: number): boolean {
  return amount >= 10 && amount % 10 === 0;
}

/**
 * Creates a payment history entry
 */
export async function createPaymentHistoryEntry(
  data: {
    userId: string;
    type: 'credit' | 'debit' | 'bet_win' | 'bet_loss' | 'admin_adjustment';
    amount: number;
    description: string;
    referenceId?: number;
    balanceBefore: number;
    balanceAfter: number;
    createdBy?: string;
  },
  tx?: any
): Promise<any> {
  const dbClient = tx || prisma;
  
  return await dbClient.payment_history.create({
    data: {
      user_id: data.userId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      reference_id: data.referenceId,
      balance_before: data.balanceBefore,
      balance_after: data.balanceAfter,
      created_by: data.createdBy
    }
  });
}

/**
 * Validates if user can participate in bet
 */
export async function validateBetParticipation(
  betId: number,
  userId: string,
  amount: number,
  optionId: number
): Promise<{
  bet: any;
  user: any;
  isValid: boolean;
  errorMessage?: string;
}> {
  try {
    // Validate amount format
    if (!validateBetAmount(amount)) {
      return {
        bet: null,
        user: null,
        isValid: false,
        errorMessage: 'Amount must be in multiples of 10 and at least 10'
      };
    }

    // Get bet details
    const bet = await prisma.bets.findUnique({
      where: { id: betId },
      include: { bet_participations: true }
    });

    if (!bet) {
      return {
        bet: null,
        user: null,
        isValid: false,
        errorMessage: 'Bet not found'
      };
    }

    if (bet.status !== 'active') {
      return {
        bet,
        user: null,
        isValid: false,
        errorMessage: 'Bet is not active for participation'
      };
    }

    // Validate option exists
    const options = bet.options as any[];
    const validOption = options.find((opt: any) => opt.id === optionId);
    if (!validOption) {
      return {
        bet,
        user: null,
        isValid: false,
        errorMessage: 'Invalid option selected'
      };
    }

    // Get user details
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return {
        bet,
        user: null,
        isValid: false,
        errorMessage: 'User not found in database'
      };
    }

    const userBalance = user.balance ?? 0; // Handle null balance
    
    if (userBalance < amount) {
      return {
        bet,
        user,
        isValid: false,
        errorMessage: 'Insufficient balance'
      };
    }

    return {
      bet,
      user,
      isValid: true
    };

  } catch (error) {
    console.error('Validation error:', error);
    return {
      bet: null,
      user: null,
      isValid: false,
      errorMessage: 'Validation failed'
    };
  }
}
