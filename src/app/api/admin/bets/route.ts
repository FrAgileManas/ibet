import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma as db } from '@/lib/db';

// GET - Get all bets for admin with detailed information
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.users.findUnique({
      where: { id: userId },
      select: { is_admin: true }
    });

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all bets with participation details
    const bets = await db.bets.findMany({
      include: {
        bet_participations: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        creator: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Transform data to match expected format
    const transformedBets = bets.map(bet => ({
      id: bet.id,
      title: bet.title,
      description: bet.description,
      options: bet.options,
      status: bet.status,
      commission_rate: bet.commission_rate,
      total_pool: bet.total_pool,
      commission_amount: bet.commission_amount,
      prize_pool: bet.prize_pool,
      winning_option_id: bet.winning_option_id,
      created_at: bet.created_at?.toISOString(),
      updated_at: bet.updated_at?.toISOString(),
      completed_at: bet.completed_at?.toISOString(),
      created_by: bet.creator,
      participations: bet.bet_participations.map(p => ({
        id: p.id,
        user: p.user,
        option_id: p.option_id,
        amount: p.amount,
        created_at: p.created_at?.toISOString()
      }))
    }));

    return NextResponse.json(transformedBets);

  } catch (error) {
    console.error('Error fetching admin bets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bets' },
      { status: 500 }
    );
  }
}

// POST - Create new bet (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.users.findUnique({
      where: { id: userId },
      select: { is_admin: true }
    });

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, commissionRate, options } = body;

    // Validation
    if (!title || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'Title and at least 2 options are required' },
        { status: 400 }
      );
    }

    // Validate commission rate
    if (typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 100) {
      return NextResponse.json(
        { error: 'Commission rate must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Transform options to include IDs
    const betOptions = options.map((option: any, index: number) => ({
      id: index + 1,
      text: option.text || option
    }));

    // Create bet
    const newBet = await db.bets.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        options: betOptions,
        commission_rate: parseFloat(commissionRate.toFixed(2)),
        created_by: userId,
        status: 'active'
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Transform response to match expected format
    const transformedBet = {
      id: newBet.id,
      title: newBet.title,
      description: newBet.description,
      options: newBet.options,
      status: newBet.status,
      commission_rate: newBet.commission_rate,
      total_pool: newBet.total_pool,
      commission_amount: newBet.commission_amount,
      prize_pool: newBet.prize_pool,
      winning_option_id: newBet.winning_option_id,
      created_at: newBet.created_at?.toISOString(),
      updated_at: newBet.updated_at?.toISOString(),
      completed_at: newBet.completed_at?.toISOString(),
      created_by: newBet.creator,
      participations: []
    };

    return NextResponse.json(transformedBet, { status: 201 });

  } catch (error) {
    console.error('Error creating bet:', error);
    return NextResponse.json(
      { error: 'Failed to create bet' },
      { status: 500 }
    );
  }
}

// PUT - Update bet status, commission rate, or complete bet
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.users.findUnique({
      where: { id: userId },
      select: { is_admin: true }
    });

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { betId, status, commissionRate, winningOptionId } = body;

    if (!betId) {
      return NextResponse.json({ error: 'Bet ID is required' }, { status: 400 });
    }

    // Get existing bet
    const existingBet = await db.bets.findUnique({
      where: { id: parseInt(betId) },
      include: {
        bet_participations: {
          include: {
            user: true
          }
        }
      }
    });

    if (!existingBet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    // Handle status update
    if (status) {
      if (!['active', 'locked', 'completed'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = status;

      // If completing the bet, handle prize distribution
      if (status === 'completed') {
        updateData.completed_at = new Date();
        
        // If there's a winning option, distribute prizes
        if (winningOptionId && existingBet.bet_participations.length > 0) {
          await distributePrizes(parseInt(betId), parseInt(winningOptionId));
          updateData.winning_option_id = parseInt(winningOptionId);
        }
      }
    }

    // Handle commission rate update
    if (commissionRate !== undefined) {
      if (typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 100) {
        return NextResponse.json(
          { error: 'Commission rate must be between 0 and 100' },
          { status: 400 }
        );
      }
      updateData.commission_rate = parseFloat(commissionRate.toFixed(2));
    }

    // Update bet
    const updatedBet = await db.bets.update({
      where: { id: parseInt(betId) },
      data: updateData,
      include: {
        bet_participations: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Transform response
    const transformedBet = {
      id: updatedBet.id,
      title: updatedBet.title,
      description: updatedBet.description,
      options: updatedBet.options,
      status: updatedBet.status,
      commission_rate: updatedBet.commission_rate,
      total_pool: updatedBet.total_pool,
      commission_amount: updatedBet.commission_amount,
      prize_pool: updatedBet.prize_pool,
      winning_option_id: updatedBet.winning_option_id,
      created_at: updatedBet.created_at?.toISOString(),
      updated_at: updatedBet.updated_at?.toISOString(),
      completed_at: updatedBet.completed_at?.toISOString(),
      created_by: updatedBet.creator,
      participations: updatedBet.bet_participations.map(p => ({
        id: p.id,
        user: p.user,
        option_id: p.option_id,
        amount: p.amount,
        created_at: p.created_at?.toISOString()
      }))
    };

    return NextResponse.json(transformedBet);

  } catch (error) {
    console.error('Error updating bet:', error);
    return NextResponse.json(
      { error: 'Failed to update bet' },
      { status: 500 }
    );
  }
}

// Helper function to distribute prizes (as per the plan)
async function distributePrizes(betId: number, winningOptionId: number) {
  return await db.$transaction(async (tx) => {
    // Get bet and all participations
    const bet = await tx.bets.findUnique({
      where: { id: betId },
      include: { bet_participations: true }
    });

    if (!bet) throw new Error('Bet not found');

    // Calculate totals
    const totalPool = bet.bet_participations.reduce((sum, p) => sum + Number(p.amount), 0);
    const commissionAmount = (totalPool * Number(bet.commission_rate)) / 100;
    const prizePool = totalPool - commissionAmount;

    // Get winners
    const winners = bet.bet_participations.filter(p => p.option_id === winningOptionId);
    
    if (winners.length === 0) {
      // No winners, just update bet totals
      await tx.bets.update({
        where: { id: betId },
        data: {
          total_pool: totalPool,
          commission_amount: commissionAmount,
          prize_pool: 0,
          winning_option_id: winningOptionId
        }
      });
      return;
    }

    const totalWinnerAmount = winners.reduce((sum, w) => sum + Number(w.amount), 0);

    // Distribute prizes to winners
    for (const winner of winners) {
      const user = await tx.users.findUnique({ where: { id: winner.user_id! } });
      if (!user) continue;

      const winRatio = Number(winner.amount) / totalWinnerAmount;
      const prize = prizePool * winRatio;
      
      // Update user balance
      await tx.users.update({
        where: { id: winner.user_id! },
        data: { balance: { increment: prize } }
      });

      // Create payment history entry
      await tx.payment_history.create({
        data: {
          user_id: winner.user_id!,
          type: 'bet_win',
          amount: prize,
          description: `Prize from bet: ${bet.title}`,
          reference_id: betId,
          balance_before: Number(user.balance),
          balance_after: Number(user.balance) + prize
        }
      });
    }

    // Update bet totals
    await tx.bets.update({
      where: { id: betId },
      data: {
        total_pool: totalPool,
        commission_amount: commissionAmount,
        prize_pool: prizePool,
        winning_option_id: winningOptionId
      }
    });
  });
}