'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Trophy, Minus, Plus } from 'lucide-react';

// Define the PaymentHistory type to match your database schema
interface PaymentHistory {
  id: number;
  type: string;
  amount: number;
  description: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export default function PaymentHistoryTable() {
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/user/payment-history');
        if (!response.ok) {
          throw new Error('Failed to fetch payment history');
        }
        const data = await response.json();
        setHistory(data);
        
        // Set current balance from the latest entry
        if (data.length > 0) {
          setCurrentBalance(Number(data[0].balance_after));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getTypeIcon = (type: string) => {
    if (type.includes('win')) return <Trophy className="w-4 h-4" />;
    if (type.includes('credit')) return <Plus className="w-4 h-4" />;
    if (type.includes('debit') || type.includes('loss')) return <Minus className="w-4 h-4" />;
    return <Wallet className="w-4 h-4" />;
  };

  const getTypeColor = (type: string) => {
    if (type.includes('win')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (type.includes('credit')) return 'bg-green-100 text-green-800 border-green-200';
    if (type.includes('debit') || type.includes('loss')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getAmountColor = (type: string) => {
    if (type.includes('win') || type.includes('credit')) return 'text-green-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading payment history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 text-red-400">⚠️</div>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg">No payment history found.</p>
        <p className="text-gray-500 text-sm mt-1">Your transactions will appear here once you start betting!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Balance Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Current Balance</p>
            <p className="text-3xl font-bold">${currentBalance.toFixed(2)}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <Wallet className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
          <p className="text-sm text-gray-600">Track all your credits, debits, and winnings</p>
        </div>

        <div className="overflow-x-auto">
          <div className="space-y-1">
            {history.map((item, index) => {
              const isPositive = item.type.includes('win') || item.type.includes('credit');
              const balanceChange = Number(item.balance_after) - Number(item.balance_before);
              
              return (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full border ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(item.type)}`}>
                          {item.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-lg font-bold ${getAmountColor(item.type)}`}>
                        {isPositive ? '+' : '-'}${Math.abs(Number(item.amount)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Balance: ${Number(item.balance_after).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}