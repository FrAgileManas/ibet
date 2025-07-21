import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  balance: number;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get the current authenticated user with database information
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  try {
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
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      balance: Number(user.balance),
      isAdmin: user.is_admin || false,
      createdAt: user.created_at!,
      updatedAt: user.updated_at!,
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * Require authentication and return user, redirect to sign-in if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  return user;
}

/**
 * Require admin privileges, redirect to home if not admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (!user.isAdmin) {
    redirect('/home');
  }
  
  return user;
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isAdmin || false;
}

/**
 * Validate user access to bet operations
 */
export async function validateBetAccess(userId: string, betId: number): Promise<{
  valid: boolean;
  user?: AuthUser;
  error?: string;
}> {
  // Get current authenticated user
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return { valid: false, error: 'Not authenticated' };
  }
  
  // Check if the requesting user matches the authenticated user
  if (currentUser.id !== userId) {
    return { valid: false, error: 'Unauthorized access' };
  }
  
  // Check if bet exists
  try {
    const bet = await prisma.bets.findUnique({
      where: { id: betId },
      select: { id: true, status: true },
    });
    
    if (!bet) {
      return { valid: false, error: 'Bet not found' };
    }
    
    return { valid: true, user: currentUser };
  } catch (error) {
    console.error('Error validating bet access:', error);
    return { valid: false, error: 'Database error' };
  }
}

/**
 * Check if user can participate in or edit bet participation
 */
export async function canParticipateInBet(betId: number): Promise<{
  canParticipate: boolean;
  canEdit: boolean;
  error?: string;
}> {
  try {
    const bet = await prisma.bets.findUnique({
      where: { id: betId },
      select: { status: true },
    });
    
    if (!bet) {
      return { 
        canParticipate: false, 
        canEdit: false, 
        error: 'Bet not found' 
      };
    }
    
    const canParticipate = bet.status === 'active';
    const canEdit = bet.status === 'active';
    
    return { canParticipate, canEdit };
  } catch (error) {
    console.error('Error checking bet participation:', error);
    return { 
      canParticipate: false, 
      canEdit: false, 
      error: 'Database error' 
    };
  }
}