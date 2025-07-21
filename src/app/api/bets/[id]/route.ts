import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

/**
 * @summary Get a specific bet by its ID
 * @description Fetches detailed information for a single bet, including its participations and the users who participated.
 * @param req The incoming request object.
 * @param params Contains the dynamic route parameter, where `id` is the bet's ID.
 * @returns A JSON response with the bet details or an error.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bet = await prisma.bets.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        bet_participations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!bet) {
      return new NextResponse('Bet not found', { status: 404 });
    }

    const { bet_participations, ...rest } = bet;
    const response = {
      ...rest,
      participations: bet_participations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[BETS_ID_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * @summary Update a bet's details or status
 * @description Updates a bet's title, description, or status. Requires admin authentication.
 * @param req The incoming request object containing the JSON body for the update.
 * @param params Contains the dynamic route parameter, where `id` is the bet's ID.
 * @returns A JSON response with the updated bet or an error.
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || !user.is_admin) {
      return new NextResponse('Forbidden: Admin access required', { status: 403 });
    }

    const { title, description, status, commissionRate } = await req.json();
    const betId = parseInt(params.id);

    // Validate status transitions
    if (status) {
      const validStatuses = ['active', 'locked', 'completed'];
      if (!validStatuses.includes(status)) {
        return new NextResponse('Invalid status. Must be: active, locked, or completed', { status: 400 });
      }

      // Get current bet to check current status
      const currentBet = await prisma.bets.findUnique({ where: { id: betId } });
      if (!currentBet) {
        return new NextResponse('Bet not found', { status: 404 });
      }

      // Validate status transitions
      if (currentBet.status === 'completed' && status !== 'completed') {
        return new NextResponse('Cannot change status of completed bet', { status: 400 });
      }
    }

    // Validate commission rate
    if (commissionRate !== undefined) {
      if (commissionRate < 0 || commissionRate > 100) {
        return new NextResponse('Commission rate must be between 0 and 100', { status: 400 });
      }
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    // Only update fields that are provided
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (commissionRate !== undefined) updateData.commission_rate = commissionRate;

    const updatedBet = await prisma.bets.update({
      where: { id: betId },
      data: updateData,
    });

    return NextResponse.json(updatedBet);
  } catch (error) {
    console.error('[BETS_ID_PUT]', error);
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return new NextResponse('Bet not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * @summary Delete a bet
 * @description Deletes a bet. Requires admin authentication. A bet cannot be deleted if it has participations.
 * @param req The incoming request object.
 * @param params Contains the dynamic route parameter, where `id` is the bet's ID.
 * @returns A 204 No Content response on success or an error.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || !user.is_admin) {
      return new NextResponse('Forbidden: Admin access required', { status: 403 });
    }

    const betId = parseInt(params.id);

    const participationCount = await prisma.bet_participations.count({
      where: { bet_id: betId },
    });

    if (participationCount > 0) {
      return new NextResponse('Cannot delete a bet that has active participations.', { status: 400 });
    }

    await prisma.bets.delete({
      where: { id: betId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[BETS_ID_DELETE]', error);
    // CORRECTED: Type guard to safely access error.code
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return new NextResponse('Bet not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}