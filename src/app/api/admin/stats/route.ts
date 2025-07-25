import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get current date for recent stats (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Parallel queries for better performance
    const [
      totalUsers,
      recentUsers,
      totalBets,
      betStatusCounts,
      recentBets,
      totalParticipations,
      recentParticipations,
      poolStats,
      commissionStats,
      recentCommission
    ] = await Promise.all([
      // Total users
      prisma.users.count(),
      
      // Recent users (last 24h)
      prisma.users.count({
        where: {
          created_at: {
            gte: oneDayAgo
          }
        }
      }),
      
      // Total bets
      prisma.bets.count(),
      
      // Bet status counts
      prisma.bets.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),
      
      // Recent bets (last 24h)
      prisma.bets.count({
        where: {
          created_at: {
            gte: oneDayAgo
          }
        }
      }),
      
      // Total participations
      prisma.bet_participations.count(),
      
      // Recent participations (last 24h)
      prisma.bet_participations.count({
        where: {
          created_at: {
            gte: oneDayAgo
          }
        }
      }),
      
      // Pool statistics
      prisma.bets.aggregate({
        _sum: {
          total_pool: true,
          prize_pool: true
        },
        _avg: {
          total_pool: true
        }
      }),
      
      // Commission statistics
      prisma.bets.aggregate({
        _sum: {
          commission_amount: true
        }
      }),
      
      // Recent commission (last 24h)
      prisma.bets.aggregate({
        where: {
          created_at: {
            gte: oneDayAgo
          }
        },
        _sum: {
          commission_amount: true
        }
      })
    ]);

    // Process bet status counts
    const statusMap = betStatusCounts.reduce((acc, item) => {
      acc[item.status || 'unknown'] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalUsers,
      totalBets,
      activeBets: statusMap.active || 0,
      completedBets: statusMap.completed || 0,
      lockedBets: statusMap.locked || 0,
      totalPrizePool: Number(poolStats._sum.prize_pool || 0),
      totalCommission: Number(commissionStats._sum.commission_amount || 0),
      totalParticipations,
      averagePoolSize: Number(poolStats._avg.total_pool || 0),
      recentUsers,
      recentBets,
      recentParticipations,
      recentCommission: Number(recentCommission._sum.commission_amount || 0)
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
