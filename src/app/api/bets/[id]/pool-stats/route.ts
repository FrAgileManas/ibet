// app/api/bets/[id]/pool-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPoolStats } from '@/lib/prize-pool';

export async function GET(
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

    const betId = parseInt(params.id);
    
    if (isNaN(betId)) {
      return NextResponse.json(
        { error: 'Invalid bet ID' }, 
        { status: 400 }
      );
    }

    const poolStats = await getPoolStats(betId);

    return NextResponse.json(poolStats);

  } catch (error) {
    console.error('Error fetching pool stats:', error);
    
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