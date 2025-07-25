// src/app/api/bets/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { BetOption } from '@/lib/types';

/**
 * @swagger
 * /api/bets:
 * get:
 * summary: Retrieve a list of all bets
 * description: Fetches a list of all bets, sorted by creation date. No authentication is required.
 * responses:
 * 200:
 * description: A list of bets.
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Bet'
 * 500:
 * description: Internal server error.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (status && ['active', 'locked', 'completed'].includes(status)) {
      where.status = status;
    }

    const totalCount = await prisma.bets.count({ where });
    
    const bets = await prisma.bets.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
      include: {
        bet_participations: {
          select: {
            amount: true,
            option_id: true,
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
      },
    });

    // Calculate pool totals for each bet using Decimal arithmetic
    const betsWithPools = bets.map(bet => {
      const totalPool = bet.bet_participations.reduce(
        (sum, participation) => sum.add(participation.amount),
        new Prisma.Decimal(0)
      );
      
      // FIX: Handle cases where commission_rate might be null in the database.
      // Use the nullish coalescing operator (??) to provide a default value.
      const commissionRateDecimal = new Prisma.Decimal(bet.commission_rate ?? 0);
      const commissionAmount = totalPool.mul(commissionRateDecimal).div(100);
      const prizePool = totalPool.sub(commissionAmount);
      
      const optionTotals: { [key: number]: Prisma.Decimal } = {};
      bet.bet_participations.forEach(participation => {
        const currentTotal = optionTotals[participation.option_id] || new Prisma.Decimal(0);
        optionTotals[participation.option_id] = currentTotal.add(participation.amount);
      });

      return {
        ...bet,
        total_pool: totalPool,
        commission_amount: commissionAmount,
        prize_pool: prizePool,
        option_totals: optionTotals,
        participation_count: bet.bet_participations.length,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      bets: betsWithPools,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  } catch (error) {
    console.error('[BETS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * @swagger
 * /api/bets:
 * post:
 * summary: Create a new bet
 * description: Creates a new bet. Requires admin authentication.
 * ... (swagger docs) ...
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || !user.is_admin) {
      return new NextResponse('Forbidden: Admin access required', { status: 403 });
    }

    const { title, description, options, commissionRate } = await req.json();

    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return new NextResponse('Bad Request: Title and at least two options are required', { status: 400 });
    }
    
    const formattedOptions: BetOption[] = options.map((opt: { text: string }, index: number) => ({
        id: index + 1,
        text: opt.text
    }));

    const newBet = await prisma.bets.create({
      data: {
        title,
        description,
        options: formattedOptions as unknown as Prisma.JsonArray,
        commission_rate: commissionRate ?? 1.0, 
        created_by: userId,
      },
    });

    return NextResponse.json(newBet, { status: 201 });
  } catch (error) {
    console.error('[BETS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
/**
 * @swagger
 * /api/bets:
 * put:
 * summary: Update bet status, commission rate, or complete bet
 * description: Updates bet properties or completes a bet with winner selection. Requires admin authentication.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * betId:
 * type: integer
 * description: ID of the bet to update
 * status:
 * type: string
 * enum: [active, locked, completed]
 * description: New status for the bet
 * commissionRate:
 * type: number
 * description: New commission rate (0-100)
 * winningOptionId:
 * type: integer
 * description: ID of winning option (required when completing bet)
 * responses:
 * 200:
 * description: Bet updated successfully
 * 400:
 * description: Bad request
 * 401:
 * description: Unauthorized
 * 403:
 * description: Forbidden - Admin access required
 * 404:
 * description: Bet not found
 * 500:
 * description: Internal server error
 */
export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { is_admin: true }
    });

    if (!user?.is_admin) {
      return new NextResponse('Forbidden: Admin access required', { status: 403 });
    }

    const { betId, status, commissionRate, winningOptionId } = await req.json();

    if (!betId) {
      return new NextResponse('Bad Request: Bet ID is required', { status: 400 });
    }

    // Get existing bet
    const existingBet = await prisma.bets.findUnique({
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
      return new NextResponse('Bet not found', { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    // Handle status update
    if (status) {
      if (!['active', 'locked', 'completed'].includes(status)) {
        return new NextResponse('Bad Request: Invalid status', { status: 400 });
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
        return new NextResponse('Bad Request: Commission rate must be between 0 and 100', { status: 400 });
      }
      updateData.commission_rate = parseFloat(commissionRate.toFixed(2));
    }

    // Update bet
    const updatedBet = await prisma.bets.update({
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

    return NextResponse.json(updatedBet);

  } catch (error) {
    console.error('[BETS_PUT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper function to distribute prizes (as per the plan)
async function distributePrizes(betId: number, winningOptionId: number) {
  return await prisma.$transaction(async (tx) => {
    // Get bet and all participations
    const bet = await tx.bets.findUnique({
      where: { id: betId },
      include: { bet_participations: true }
    });

    if (!bet) throw new Error('Bet not found');

    // Calculate totals using Decimal arithmetic
    const totalPool = bet.bet_participations.reduce(
      (sum, p) => sum.add(p.amount),
      new Prisma.Decimal(0)
    );
    
    const commissionRateDecimal = new Prisma.Decimal(bet.commission_rate ?? 0);
    const commissionAmount = totalPool.mul(commissionRateDecimal).div(100);
    const prizePool = totalPool.sub(commissionAmount);

    // Get winners
    const winners = bet.bet_participations.filter(p => p.option_id === winningOptionId);
    
    if (winners.length === 0) {
      // No winners, just update bet totals
      await tx.bets.update({
        where: { id: betId },
        data: {
          total_pool: totalPool,
          commission_amount: commissionAmount,
          prize_pool: new Prisma.Decimal(0),
          winning_option_id: winningOptionId
        }
      });
      return;
    }

    const totalWinnerAmount = winners.reduce(
      (sum, w) => sum.add(w.amount),
      new Prisma.Decimal(0)
    );

    // Distribute prizes to winners
    for (const winner of winners) {
      const user = await tx.users.findUnique({ where: { id: winner.user_id! } });
      if (!user) continue;

      const winRatio = new Prisma.Decimal(winner.amount).div(totalWinnerAmount);
      const prize = prizePool.mul(winRatio);
      
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
          balance_before: user.balance ?? new Prisma.Decimal(0),
          balance_after: (user.balance ?? new Prisma.Decimal(0)).add(prize)
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