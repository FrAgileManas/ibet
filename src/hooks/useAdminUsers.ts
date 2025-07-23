// src/hooks/useAdminUsers.ts

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    betParticipations: number;
    paymentHistory: number;
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface AdminUsersResponse {
  users: User[];
  pagination: Pagination;
}

interface AdjustBalanceParams {
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
}

export function useAdminUsers(initialSearch: string = '') {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [adjustingBalance, setAdjustingBalance] = useState<string | null>(null);

  const fetchUsers = async (page: number = 1, searchTerm: string = search) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data: AdminUsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const adjustBalance = async ({ userId, type, amount, description }: AdjustBalanceParams) => {
    try {
      setAdjustingBalance(userId);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}/adjust-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, amount, description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to adjust balance');
      }

      // Update the user in the current list
      setUsers(currentUsers =>
        currentUsers.map(user =>
          user.id === userId
            ? { ...user, balance: data.user.balance }
            : user
        )
      );

      return { success: true, message: data.message };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust balance';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAdjustingBalance(null);
    }
  };

  const searchUsers = (searchTerm: string) => {
    setSearch(searchTerm);
    setCurrentPage(1);
    fetchUsers(1, searchTerm);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && (!pagination || page <= pagination.totalPages)) {
      fetchUsers(page, search);
    }
  };

  const refreshUsers = () => {
    fetchUsers(currentPage, search);
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    pagination,
    loading,
    error,
    search,
    currentPage,
    adjustingBalance,
    searchUsers,
    adjustBalance,
    goToPage,
    refreshUsers,
    setError // Allow components to clear errors
  };
}