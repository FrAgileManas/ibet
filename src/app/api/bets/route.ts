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