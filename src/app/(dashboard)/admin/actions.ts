// app/admin/actions.ts (Server Actions)
'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma as db } from '@/lib/db';
import { getUserRole } from '@/lib/auth';

export async function updateUserRole(targetUserId: string, newRole: 'admin' | 'user') {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Check if current user is admin
  const currentUserRole = await getUserRole(userId);
  if (currentUserRole !== 'admin') {
    throw new Error('Insufficient permissions');
  }

  try {
    await db.users.update({
      where: { id: targetUserId },
      data: { is_admin: newRole === 'admin' }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }
}
