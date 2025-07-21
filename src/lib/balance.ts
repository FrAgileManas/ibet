import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export type TransactionType = 'credit' | 'debit' | 'bet_win' | 'bet_loss' | 'admin_adjustment';

export interface BalanceOperation {
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  referenceId?: number;
  createdBy?: string;
}

export interface BalanceValidationResult {
  success: boolean;
  currentBalance: number;
  newBalance?: number;
  error?: string;
}

/**
 * Validates if a user has sufficient balance for a debit operation
 */
export async function validateBalance(userId: string, amount: number): Promise<BalanceValidationResult> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user) {
      return {
        success: false,
        currentBalance: 0,
        error: 'User not found',
      };
    }

    const currentBalance = Number(user.balance);
    
    if (currentBalance < amount) {
      return {
        success: false,
        currentBalance,
        error: 'Insufficient balance',
      };
    }

    return {
      success: true,
      currentBalance,
      newBalance: currentBalance - amount,
    };
  } catch (error) {
    console.error('Error validating balance:', error);
    return {
      success: false,
      currentBalance: 0,
      error: 'Database error',
    };
  }
}

/**
 * Updates user balance with proper transaction handling and audit trail
 */
export async function updateBalance(operation: BalanceOperation): Promise<{
  success: boolean;
  balanceBefore: number;
  balanceAfter: number;
  error?: string;
}> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get current user balance
      const user = await tx.users.findUnique({
        where: { id: operation.userId },
        select: { balance: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const balanceBefore = Number(user.balance);
      
      // Validate debit operations
      if ((operation.type === 'debit' || operation.type === 'bet_loss') && balanceBefore < operation.amount) {
        throw new Error('Insufficient balance');
      }

      // Calculate new balance
      const balanceChange = (operation.type === 'credit' || operation.type === 'bet_win') 
        ? operation.amount 
        : -operation.amount;
      
      const balanceAfter = balanceBefore + balanceChange;

      // Update user balance
      await tx.users.update({
        where: { id: operation.userId },
        data: { 
          balance: balanceAfter,
          updated_at: new Date(),
        },
      });

      // Create payment history record
      await tx.payment_history.create({
        data: {
          user_id: operation.userId,
          type: operation.type,
          amount: operation.amount,
          description: operation.description,
          reference_id: operation.referenceId,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          created_by: operation.createdBy,
        },
      });

      return { balanceBefore, balanceAfter };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    return {
      success: true,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
    };
  } catch (error) {
    console.error('Error updating balance:', error);
    return {
      success: false,
      balanceBefore: 0,
      balanceAfter: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's current balance
 */
export async function getUserBalance(userId: string): Promise<number> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    return user ? Number(user.balance) : 0;
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return 0;
  }
}

/**
 * Validates bet amount (must be multiple of 10 and minimum 10)
 */
export function validateBetAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < 10) {
    return { valid: false, error: 'Minimum bet amount is ₹10' };
  }
  
  if (amount % 10 !== 0) {
    return { valid: false, error: 'Bet amount must be in multiples of ₹10' };
  }
  
  return { valid: true };
}

/**
 * Processes bet participation with balance validation
 */
export async function processBetParticipation(
  userId: string,
  betId: number,
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  // Validate bet amount
  const amountValidation = validateBetAmount(amount);
  if (!amountValidation.valid) {
    return { success: false, error: amountValidation.error };
  }

  // Update balance
  const result = await updateBalance({
    userId,
    amount,
    type: 'debit',
    description,
    referenceId: betId,
  });

  return {
    success: result.success,
    error: result.error,
  };
}

/**
 * Processes bet winnings distribution
 */
export async function processBetWinnings(
  userId: string,
  betId: number,
  amount: number,
  betTitle: string
): Promise<{ success: boolean; error?: string }> {
  const result = await updateBalance({
    userId,
    amount,
    type: 'bet_win',
    description: `Prize from bet: ${betTitle}`,
    referenceId: betId,
  });

  return {
    success: result.success,
    error: result.error,
  };
}