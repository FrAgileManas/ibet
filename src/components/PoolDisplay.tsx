// components/PoolDisplay.tsx
'use client';

import { usePoolStats } from '@/hooks/usePoolStats';
import { RefreshCcw, TrendingUp, Users, DollarSign } from 'lucide-react';

interface PoolDisplayProps {
  betId: number;
  options: Array<{ id: number; text: string }>;
  status: 'active' | 'locked' | 'completed';
  className?: string;
}

export default function PoolDisplay({ 
  betId, 
  options, 
  status, 
  className = '' 
}: PoolDisplayProps) {
  const { poolStats, isLoading, error, refresh } = usePoolStats(betId);

  if (isLoading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !poolStats) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <p className="text-red-600 text-sm">
            {error || 'Unable to load pool stats'}
          </p>
          <button
            onClick={refresh}
            className="text-red-600 hover:text-red-700"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Prize Pool Status
        </h3>
        <button
          onClick={refresh}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh pool stats"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Pool Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Total Pool</span>
          </div>
          <div className="text-xl font-bold text-gray-800">
            {formatCurrency(poolStats.totalPool)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-sm font-medium text-gray-600 mb-1">Prize Pool</div>
          <div className="text-xl font-bold text-green-600">
            {formatCurrency(poolStats.prizePool)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Commission ({poolStats.commissionRate}%)
          </div>
          <div className="text-lg font-semibold text-gray-600">
            {formatCurrency(poolStats.commission)}
          </div>
        </div>
      </div>

      {/* Option Breakdown */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Option Breakdown
        </h4>
        
        {options.map((option) => {
          const optionStat = poolStats.optionStats.find(s => s.optionId === option.id);
          const percentage = poolStats.totalPool > 0 
            ? ((optionStat?.totalAmount || 0) / poolStats.totalPool * 100).toFixed(1)
            : '0';

          return (
            <div key={option.id} className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800 truncate">
                  {option.text}
                </span>
                <span className="text-sm text-gray-600">
                  {optionStat?.participantCount || 0} participants
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Amount: {formatCurrency(optionStat?.totalAmount || 0)}
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {percentage}% of pool
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {status !== 'completed' && (
                <div className="text-xs text-gray-500">
                  Potential multiplier: {optionStat?.potentialMultiplier || '0.00'}x
                </div>
              )}
            </div>
          );
        })}
      </div>

      {poolStats.totalPool === 0 && (
        <div className="text-center text-gray-500 text-sm mt-4">
          No participants yet. Be the first to join!
        </div>
      )}
    </div>
  );
}