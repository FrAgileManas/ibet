// app/api/bets/[id]/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma as db } from '@/lib/db';
import { distributePrizes } from '@/lib/prize-pool';

interface CompleteRequest {
  winningOptionId: number;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Check if user is admin - FIXED: users table and is_admin field
    const user = await db.users.findUnique({
      where: { id: userId }
    });

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' }, 
        { status: 403 }
      );
    }

    const betId = parseInt(params.id);
    
    if (isNaN(betId)) {
      return NextResponse.json(
        { error: 'Invalid bet ID' }, 
        { status: 400 }
      );
    }

    const body: CompleteRequest = await request.json();
    
    if (!body.winningOptionId || typeof body.winningOptionId !== 'number') {
      return NextResponse.json(
        { error: 'Valid winning option ID required' }, 
        { status: 400 }
      );
    }

    // Verify bet exists and is in valid state - FIXED: bets table and bet_participations relation
    const bet = await db.bets.findUnique({
      where: { id: betId },
      include: { bet_participations: true }
    });

    if (!bet) {
      return NextResponse.json(
        { error: 'Bet not found' }, 
        { status: 404 }
      );
    }

    if (bet.status === 'completed') {
      return NextResponse.json(
        { error: 'Bet already completed' }, 
        { status: 400 }
      );
    }

    // Verify winning option exists
    const validOptions = bet.options as Array<{ id: number; text: string }>;
    const winningOption = validOptions.find(opt => opt.id === body.winningOptionId);
    
    if (!winningOption) {
      return NextResponse.json(
        { error: 'Invalid winning option ID' }, 
        { status: 400 }
      );
    }

    // Distribute prizes
    const result = await distributePrizes(betId, body.winningOptionId);

    return NextResponse.json({
      message: 'Bet completed successfully',
      betId: betId,
      winningOptionId: body.winningOptionId,
      winningOptionText: winningOption.text,
      totalPool: result.totalPool,
      winnersCount: result.winnersCount,
      distributedAmount: result.distributedAmount
    });

  } catch (error) {
    console.error('Error completing bet:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
