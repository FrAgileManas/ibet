import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// POST - Create new bet participation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { optionId, amount } = await request.json();
    const betId = parseInt(params.id);

    // Validate input
    if (!optionId || !amount || amount < 10 || amount % 10 !== 0) {
      return NextResponse.json(
        { error: 'Invalid input. Amount must be in multiples of 10 and at least 10.' },
        { status: 400 }
      );
    }

    // Use database transaction for consistency
    const result = await db.$transaction(async (tx) => {
      // Check if bet exists and is active
      const bet = await tx.bets.findUnique({
        where: { id: betId },
        include: { bet_participations: true }
      });

      if (!bet) {
        throw new Error('Bet not found');
      }

      if (bet.status !== 'active') {
        throw new Error('Bet is not active for participation');
      }

      // Validate option exists
      const options = bet.options as any[];
      const validOption = options.find(opt => opt.id === optionId);
      if (!validOption) {
        throw new Error('Invalid option selected');
      }

      // Check if user already participated
      const existingParticipation = await tx.bet_participations.findUnique({
        where: {
          bet_id_user_id: {
            bet_id: betId,
            user_id: user.id
          }
        }
      });

      if (existingParticipation) {
        throw new Error('You have already participated in this bet');
      }

      // Get user balance and validate
      const dbUser = await tx.users.findUnique({
        where: { id: user.id }
      });

      if (!dbUser) {
        throw new Error('User not found in database');
      }

      if (dbUser.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Create participation record
      const participation = await tx.bet_participations.create({
        data: {
          bet_id: betId,
          user_id: user.id,
          option_id: optionId,
          amount: amount
        }
      });

      // Deduct amount from user balance
      const balanceBefore = dbUser.balance;
      const balanceAfter = balanceBefore - amount;

      await tx.users.update({
        where: { id: user.id },
        data: { balance: balanceAfter }
      });

      // Create payment history entry
      await tx.payment_history.create({
        data: {
          user_id: user.id,
          type: 'debit',
          amount: amount,
          description: `Bet participation: ${bet.title}`,
          reference_id: betId,
          balance_before: balanceBefore,
          balance_after: balanceAfter
        }
      });

      // Update bet total pool
      await tx.bets.update({
        where: { id: betId },
        data: {
          total_pool: bet.total_pool + amount
        }
      });

      return participation;
    });

    return NextResponse.json({ 
      success: true, 
      participation: result 
    });

  } catch (error: any) {
    console.error('Participation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to participate in bet' },
      { status: 400 }
    );
  }
}

// PUT - Edit existing bet participation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { optionId, amount } = await request.json();
    const betId = parseInt(params.id);

    // Validate input
    if (!optionId || !amount || amount < 10 || amount % 10 !== 0) {
      return NextResponse.json(
        { error: 'Invalid input. Amount must be in multiples of 10 and at least 10.' },
        { status: 400 }
      );
    }

    // Use database transaction for consistency
    const result = await db.$transaction(async (tx) => {
      // Check if bet exists and is active
      const bet = await tx.bets.findUnique({
        where: { id: betId }
      });

      if (!bet) {
        throw new Error('Bet not found');
      }

      if (bet.status !== 'active') {
        throw new Error('Cannot edit participation. Bet is locked or completed.');
      }

      // Validate option exists
      const options = bet.options as any[];
      const validOption = options.find(opt => opt.id === optionId);
      if (!validOption) {
        throw new Error('Invalid option selected');
      }

      // Get existing participation
      const existingParticipation = await tx.bet_participations.findUnique({
        where: {
          bet_id_user_id: {
            bet_id: betId,
            user_id: user.id
          }
        }
      });

      if (!existingParticipation) {
        throw new Error('You have not participated in this bet yet');
      }

      // Get user balance
      const dbUser = await tx.users.findUnique({
        where: { id: user.id }
      });

      if (!dbUser) {
        throw new Error('User not found in database');
      }

      // Calculate balance changes
      const oldAmount = existingParticipation.amount;
      const amountDifference = amount - oldAmount;
      const balanceBefore = dbUser.balance;

      // Check if user has sufficient balance for increased amount
      if (amountDifference > 0 && dbUser.balance < amountDifference) {
        throw new Error('Insufficient balance for increased participation amount');
      }

      const balanceAfter = balanceBefore - amountDifference;

      // Update participation
      const updatedParticipation = await tx.bet_participations.update({
        where: {
          bet_id_user_id: {
            bet_id: betId,
            user_id: user.id
          }
        },
        data: {
          option_id: optionId,
          amount: amount,
          updated_at: new Date()
        }
      });

      // Update user balance
      await tx.users.update({
        where: { id: user.id },
        data: { balance: balanceAfter }
      });

      // Create payment history entry for the difference
      if (amountDifference !== 0) {
        await tx.payment_history.create({
          data: {
            user_id: user.id,
            type: amountDifference > 0 ? 'debit' : 'credit',
            amount: Math.abs(amountDifference),
            description: `Bet participation ${amountDifference > 0 ? 'increase' : 'decrease'}: ${bet.title}`,
            reference_id: betId,
            balance_before: balanceBefore,
            balance_after: balanceAfter
          }
        });
      }

      // Update bet total pool
      await tx.bets.update({
        where: { id: betId },
        data: {
          total_pool: bet.total_pool + amountDifference
        }
      });

      return updatedParticipation;
    });

    return NextResponse.json({ 
      success: true, 
      participation: result 
    });

  } catch (error: any) {
    console.error('Participation edit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to edit bet participation' },
      { status: 400 }
    );
  }
}