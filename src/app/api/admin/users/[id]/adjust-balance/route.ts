// src/app/api/admin/users/[id]/adjust-balance/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma as db } from '@/lib/db';
import { getUserRole } from '@/lib/auth';

interface AdjustBalanceRequest {
  type: 'credit' | 'debit';
  amount: number;
  description: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: adminId } = await auth();
    
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is admin using database role
    const userRole = await getUserRole(adminId);
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: targetUserId } = params;
    const body: AdjustBalanceRequest = await request.json();
    
    // Validate request body
    if (!body.type || !['credit', 'debit'].includes(body.type)) {
      return NextResponse.json({ error: 'Invalid adjustment type' }, { status: 400 });
    }

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    if (!body.description || body.description.trim().length === 0) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Round amount to 2 decimal places
    const adjustmentAmount = Math.round(body.amount * 100) / 100;

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Get current user - using correct table name and field names
      const targetUser = await tx.users.findUnique({
        where: { id: targetUserId }
      });

      if (!targetUser) {
        throw new Error('User not found');
      }

      // Calculate new balance - handle Decimal type properly
      const balanceBefore = Number(targetUser.balance) || 0;
      const balanceChange = body.type === 'credit' ? adjustmentAmount : -adjustmentAmount;
      const balanceAfter = balanceBefore + balanceChange;

      // Check for negative balance on debit
      if (body.type === 'debit' && balanceAfter < 0) {
        throw new Error('Insufficient balance for debit adjustment');
      }

      // Update user balance - using correct field names
      const updatedUser = await tx.users.update({
        where: { id: targetUserId },
        data: { 
          balance: balanceAfter,
          updated_at: new Date()
        }
      });

      // Create payment history entry - using correct table and field names
      await tx.payment_history.create({
        data: {
          user_id: targetUserId,
          type: 'admin_adjustment',
          amount: body.type === 'credit' ? adjustmentAmount : -adjustmentAmount,
          description: `Admin adjustment: ${body.description}`,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          created_by: adminId
        }
      });

      return {
        user: updatedUser,
        adjustment: {
          type: body.type,
          amount: adjustmentAmount,
          balanceBefore,
          balanceAfter,
          description: body.description
        }
      };
    });

    return NextResponse.json({
      success: true,
      message: `Balance ${body.type === 'credit' ? 'credited' : 'debited'} successfully`,
      ...result
    });

  } catch (error) {
    console.error('Error adjusting balance:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to adjust balance' },
      { status: 500 }
    );
  }
}
