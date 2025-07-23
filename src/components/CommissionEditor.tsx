// components/CommissionEditor.tsx
'use client';

import { useState } from 'react';
import { Edit3, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

interface CommissionEditorProps {
  betId: number;
  currentRate: number;
  status: string;
  onUpdate: () => void;
}

export default function CommissionEditor({
  betId,
  currentRate,
  status,
  onUpdate
}: CommissionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newRate, setNewRate] = useState(currentRate.toString());
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canEdit = status !== 'completed';

  const handleSave = async () => {
    const rate = parseFloat(newRate);
    
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('Commission rate must be between 0 and 100');
      return;
    }

    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/bets/${betId}/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commissionRate: rate
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update commission rate');
      }

      setSuccess('Commission rate updated successfully');
      setIsEditing(false);
      
      // Call parent callback to refresh data
      setTimeout(() => {
        onUpdate();
        setSuccess(null);
      }, 2000);

    } catch (err) {
      console.error('Error updating commission rate:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setNewRate(currentRate.toString());
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (!canEdit) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <span className="text-sm">Commission Rate: {currentRate}%</span>
        <span className="text-xs text-gray-500">(Cannot edit completed bet)</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-800 text-sm">{success}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isEditing ? (
          <>
            <span className="text-sm text-gray-700">Commission Rate: {currentRate}%</span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700 transition-colors"
              title="Edit commission rate"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                min="0"
                max="100"
                step="0.1"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUpdating}
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">%</span>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="text-green-600 hover:text-green-700 disabled:text-gray-400 transition-colors"
              title="Save changes"
            >
              <Save className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="text-red-600 hover:text-red-700 disabled:text-gray-400 transition-colors"
              title="Cancel changes"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="text-xs text-gray-600">
          <p>⚠️ Changing commission rate will affect future prize calculations.</p>
        </div>
      )}
    </div>
  );
}