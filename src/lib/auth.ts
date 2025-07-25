// lib/auth.ts
import { auth } from '@clerk/nextjs/server';
import { prisma as db } from '@/lib/db';

export async function getUserRole(userId: string) {
  try {
    // First try to get role from Clerk (works in both edge and Node.js)
    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerkUser = await (await clerkClient()).users.getUser(userId);
    
    const clerkIsAdmin = clerkUser.publicMetadata?.role === 'admin' || 
                        clerkUser.privateMetadata?.role === 'admin' ||
                        clerkUser.unsafeMetadata?.role === 'admin';
    
    if (clerkIsAdmin) {
      console.log('User is admin from Clerk metadata');
      return 'admin';
    }

    // Fallback to database check (only works in Node.js runtime)
    const dbUser = await db.users.findUnique({
      where: { id: userId },
      select: { is_admin: true }
    });
    
    console.log('Fetched user role from DB:', dbUser);
    return dbUser?.is_admin ? 'admin' : 'user';
    
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'user'; // Default to user role on error
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

// Optional: If you want Clerk-only check (faster, no DB fallback)
export async function isAdminClerkOnly(userId: string): Promise<boolean> {
  try {
    const { clerkClient } = await import('@clerk/nextjs/server');
    const user = await (await clerkClient()).users.getUser(userId);
    
    return user.publicMetadata?.role === 'admin' || 
           user.privateMetadata?.role === 'admin' ||
           user.unsafeMetadata?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status from Clerk:', error);
    return false;
  }
}