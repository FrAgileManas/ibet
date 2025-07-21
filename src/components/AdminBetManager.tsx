'use client';

import { useState, useEffect, FormEvent } from 'react';

// Types
type Option = {
  text: string;
};

type BetOption = {
  id: number;
  text: string;
};

type Bet = {
  id: number;
  title: string;
  description: string;
  options: BetOption[];
  status: 'active' | 'locked' | 'completed';
  commission_rate: number;
  total_pool: number;
  created_at: string;
  updated_at: string;
};

const AdminBetManager = () => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [commissionRate, setCommissionRate] = useState(1.0);
  const [options, setOptions] = useState<Option[]>([
    { text: '' },
    { text: '' },
  ]);
  
  // Existing bets state
  const [existingBets, setExistingBets] = useState<Bet[]>([]);
  const [loadingBets, setLoadingBets] = useState(true);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch existing bets on component mount
  useEffect(() => {
    fetchBets();
  }, []);

  const fetchBets = async () => {
  try {
    const response = await fetch('/api/bets');
    if (response.ok) {
      const data = await response.json();
      // Ensure data is an array before setting state
      const bets = Array.isArray(data) ? data : [];
      setExistingBets(bets);
    } else {
      // If response is not ok, set empty array
      console.error('Failed to fetch bets:', response.statusText);
      setExistingBets([]);
    }
  } catch (err) {
    console.error('Failed to fetch bets:', err);
    // Always ensure existingBets is an array
    setExistingBets([]);
  } finally {
    setLoadingBets(false);
  }
};


  // --- Option Handlers ---
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { text: '' }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  // --- Form Submission ---
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const validOptions = options.filter(opt => opt.text.trim() !== '');

    if (!title.trim() || validOptions.length < 2) {
      setError('Title and at least two valid options are required.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          commissionRate,
          options: validOptions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.statusText}`);
      }

      setSuccess('Bet created successfully!');
      setTitle('');
      setDescription('');
      setCommissionRate(1.0);
      setOptions([{ text: '' }, { text: '' }]);
      
      // Refresh the bets list
      fetchBets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Status Update Handler ---
  const updateBetStatus = async (betId: number, newStatus: string, newCommissionRate?: number) => {
    try {
      const body: any = { status: newStatus };
      if (newCommissionRate !== undefined) {
        body.commissionRate = newCommissionRate;
      }

      const response = await fetch(`/api/bets/${betId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      setSuccess(`Bet status updated to ${newStatus}`);
      fetchBets(); // Refresh the list
    } catch (err: any) {
      setError(`Failed to update bet: ${err.message}`);
    }
  };

  // --- Status Badge Component ---
  const StatusBadge = ({ status }: { status: string }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    const statusClasses = {
      active: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
      locked: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
      completed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
    };
    
    return (
      <span className={`${baseClasses} ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Create New Bet Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Create New Bet</h2>
        <div className="space-y-4">
          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter bet title"
              required
            />
          </div>

          {/* Description Input */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter bet description"
            />
          </div>

          {/* Commission Rate Input */}
          <div>
            <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Commission Rate (%)
            </label>
            <input
              type="number"
              id="commissionRate"
              value={commissionRate}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
              step="0.01"
              min="0"
              max="100"
              className="w-full md:w-48 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          {/* Dynamic Options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Betting Options</h3>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-grow p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-100 rounded-lg font-medium transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-3 px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-100 rounded-lg font-medium transition-colors"
            >
              + Add Option
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Bet...' : 'Create Bet'}
          </button>
        </div>
      </div>

      {/* Existing Bets Management */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Manage Existing Bets</h2>
        
        {loadingBets ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading bets...</p>
          </div>
        ) : existingBets.length === 0 ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">No bets created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 rounded-lg">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Pool</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Commission</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {existingBets.map((bet) => (
                  <tr key={bet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{bet.title}</div>
                        {bet.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{bet.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                      <StatusBadge status={bet.status} />
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white">
                      ₹{bet.total_pool.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white">
                      {bet.commission_rate}%
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {bet.status === 'active' && (
                          <button
                            onClick={() => updateBetStatus(bet.id, 'locked')}
                            className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-medium rounded transition-colors"
                          >
                            Lock
                          </button>
                        )}
                        {bet.status === 'locked' && (
                          <>
                            <button
                              onClick={() => updateBetStatus(bet.id, 'active')}
                              className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 text-xs font-medium rounded transition-colors"
                            >
                              Reopen
                            </button>
                            <button
                              onClick={() => updateBetStatus(bet.id, 'completed')}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded transition-colors"
                            >
                              Complete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBetManager;