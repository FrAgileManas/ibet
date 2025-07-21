import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const paymentHistory = await prisma.payment_history.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(paymentHistory);

  } catch (error) {
    console.error("[PAYMENT_HISTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
