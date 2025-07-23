// components/AdminBetCompletion.tsx
'use client';

import { useState } from 'react';
import { Trophy, AlertCircle, CheckCircle } from 'lucide-react';

interface BetOption {
  id: number;
  text: string;
}

interface AdminBetCompletionProps {
  betId: number;
  options: BetOption[];
  status: string;
  onComplete: () => void;
}

export default function AdminBetCompletion({
  betId,
  options,
  status,
  onComplete
}: AdminBetCompletionProps) {
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (status === 'completed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">Bet Completed</span>
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    if (!selectedWinner) {
      setError('Please select a winning option');
      return;
    }

    setIsCompleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/bets/${betId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winningOptionId: selectedWinner
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete bet');
      }

      setSuccess(
        `Bet completed successfully! ${data.winnersCount} winners received ₹${data.distributedAmount.toFixed(2)} total in prizes.`
      );
      
      // Call parent callback after a short delay to show success message
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (err) {
      console.error('Error completing bet:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-600" />
        <h3 className="font-medium text-yellow-800">Complete Bet</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-800 text-sm">{success}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Select Winning Option:
        </label>
        
        <div className="space-y-2">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                name="winningOption"
                value={option.id}
                checked={selectedWinner === option.id}
                onChange={(e) => setSelectedWinner(parseInt(e.target.value))}
                className="mr-3 text-blue-600"
                disabled={isCompleting}
              />
              <span className="text-gray-800">{option.text}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleComplete}
          disabled={!selectedWinner || isCompleting}
          className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isCompleting ? 'Completing Bet...' : 'Complete Bet & Distribute Prizes'}
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-600">
        <p>⚠️ This action cannot be undone. Prizes will be distributed immediately.</p>
      </div>
    </div>
  );
}