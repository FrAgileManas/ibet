// app/api/admin/bets/[id]/commission/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma as db } from '@/lib/db';

interface CommissionUpdateRequest {
  commissionRate: number;
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

    const body: CommissionUpdateRequest = await request.json();
    
    // Validate commission rate
    if (typeof body.commissionRate !== 'number' || 
        body.commissionRate < 0 || 
        body.commissionRate > 100) {
      return NextResponse.json(
        { error: 'Commission rate must be between 0 and 100' }, 
        { status: 400 }
      );
    }

    // Check if bet exists and is not completed - FIXED: bets table
    const bet = await db.bets.findUnique({
      where: { id: betId }
    });

    if (!bet) {
      return NextResponse.json(
        { error: 'Bet not found' }, 
        { status: 404 }
      );
    }

    if (bet.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot modify commission rate for completed bet' }, 
        { status: 400 }
      );
    }

    // Update commission rate - FIXED: bets table, commission_rate and updated_at fields
    const updatedBet = await db.bets.update({
      where: { id: betId },
      data: { 
        commission_rate: body.commissionRate,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      message: 'Commission rate updated successfully',
      betId: betId,
      newCommissionRate: updatedBet.commission_rate // FIXED: snake_case field name
    });

  } catch (error) {
    console.error('Error updating commission rate:', error);
    
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
