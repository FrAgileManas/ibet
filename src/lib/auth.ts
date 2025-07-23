// lib/auth.ts
import { auth } from '@clerk/nextjs/server';
import { prisma as db } from '@/lib/db';

export async function getUserRole(userId: string) {
  try {
    const user = await db.users.findUnique({
      where: { id: userId },
      select: { is_admin: true }
    });
    return user?.is_admin ? 'admin' : 'user';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'user'; // Default to user role on error
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}
