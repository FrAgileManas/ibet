// src/app/(dashboard)/admin/users/page.tsx

import { Metadata } from 'next';
import AdminUserManager from '@/components/AdminUserManager';

export const metadata: Metadata = {
  title: 'User Management - Admin Panel',
  description: 'Manage user accounts, balances, and view user statistics',
};

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminUserManager />
      </div>
    </div>
  );
}