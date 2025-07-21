import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile from database
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        balance: true,
        is_admin: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      // If user doesn't exist in our DB, create them
      // This handles cases where the webhook might have failed
      const clerkUser = await import('@clerk/nextjs/server').then(m => m.currentUser());
      
      if (clerkUser) {
        const newUser = await prisma.users.create({
          data: {
            id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
            balance: 0.00,
            is_admin: false,
          },
        });
        
        return NextResponse.json({
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            balance: Number(newUser.balance),
            isAdmin: newUser.is_admin,
            createdAt: newUser.created_at,
            updatedAt: newUser.updated_at,
          }
        });
      }
      
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balance: Number(user.balance),
        isAdmin: user.is_admin,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        balance: true,
        is_admin: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        balance: Number(updatedUser.balance),
        isAdmin: updatedUser.is_admin,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}