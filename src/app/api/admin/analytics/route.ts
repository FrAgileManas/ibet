import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get last 6 months for trend analysis
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // User growth over last 6 months
    const userGrowthData = await prisma.$queryRaw<Array<{month: string, users: bigint}>>`
      SELECT 
        TO_CHAR(created_at, 'Mon YYYY') as month,
        COUNT(*) as users
      FROM users 
      WHERE created_at >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `;

    // Bet status distribution
    const betStatusData = await prisma.bets.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // Commission trend over last 6 months
    const commissionTrendData = await prisma.$queryRaw<Array<{month: string, commission: number}>>`
      SELECT 
        TO_CHAR(created_at, 'Mon YYYY') as month,
        COALESCE(SUM(commission_amount), 0) as commission
      FROM bets 
      WHERE created_at >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `;

    // Top users by participation
    const topUsersData = await prisma.$queryRaw<Array<{
      name: string, 
      participations: bigint, 
      total_amount: number
    }>>`
      SELECT 
        u.name,
        COUNT(bp.id) as participations,
        COALESCE(SUM(bp.amount), 0) as total_amount
      FROM users u
      LEFT JOIN bet_participations bp ON u.id = bp.user_id
      GROUP BY u.id, u.name
      HAVING COUNT(bp.id) > 0
      ORDER BY COUNT(bp.id) DESC, SUM(bp.amount) DESC
      LIMIT 10
    `;

    // Format the data
    const userGrowth = userGrowthData.map(item => ({
      month: item.month,
      users: Number(item.users)
    }));

    const betsByStatus = betStatusData.map(item => ({
      status: item.status || 'unknown',
      count: item._count.id,
      color: getStatusColor(item.status || 'unknown')
    }));

    const commissionTrend = commissionTrendData.map(item => ({
      month: item.month,
      commission: Number(item.commission)
    }));

    const topUsers = topUsersData.map(item => ({
      name: item.name,
      participations: Number(item.participations),
      totalAmount: Number(item.total_amount)
    }));

    const analytics = {
      userGrowth,
      betsByStatus,
      commissionTrend,
      topUsers
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'active': '#3B82F6',
    'completed': '#10B981', 
    'locked': '#F59E0B',
    'cancelled': '#EF4444'
  };
  return colorMap[status] || '#6B7280';
}
