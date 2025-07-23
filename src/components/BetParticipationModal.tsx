'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface BetOption {
  id: number;
  text: string;
}

interface BetParticipation {
  id: number;
  betId: number;
  userId: string;
  optionId: number;
  amount: number;
}

interface BetParticipationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bet: {
    id: number;
    title: string;
    description: string;
    options: BetOption[];
    status: string;
    totalPool: number;
  };
  userBalance: number;
  existingParticipation?: BetParticipation | null;
  onParticipationChange: () => void;
}

export default function BetParticipationModal({
  isOpen,
  onClose,
  bet,
  userBalance,
  existingParticipation,
  onParticipationChange
}: BetParticipationModalProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const isEditing = !!existingParticipation;

  // Set initial values when modal opens or participation changes
  useEffect(() => {
    if (isOpen) {
      if (existingParticipation) {
        setSelectedOptionId(existingParticipation.optionId);
        setAmount(existingParticipation.amount.toString());
      } else {
        setSelectedOptionId(null);
        setAmount('');
      }
      setError('');
    }
  }, [isOpen, existingParticipation]);

  const validateAmount = (value: string): boolean => {
    const numValue = parseInt(value);
    return !isNaN(numValue) && numValue >= 10 && numValue % 10 === 0;
  };

  const calculateBalanceChange = (): number => {
    if (!existingParticipation || !amount) return 0;
    const newAmount = parseInt(amount);
    return existingParticipation.amount - newAmount; // Positive means balance increases
  };

  const getEffectiveBalance = (): number => {
    if (!isEditing) return userBalance;
    return userBalance + calculateBalanceChange();
  };

  const handleSubmit = async () => {
    if (!selectedOptionId || !amount) {
      setError('Please select an option and enter an amount');
      return;
    }

    if (!validateAmount(amount)) {
      setError('Amount must be in multiples of 10 and at least 10');
      return;
    }

    const numAmount = parseInt(amount);
    const effectiveBalance = getEffectiveBalance();

    if (numAmount > effectiveBalance) {
      setError('Insufficient balance');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch(`/api/bets/${bet.id}/participate`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optionId: selectedOptionId,
          amount: numAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to participate in bet');
      }

      onParticipationChange();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const canParticipate = bet.status === 'active';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Participation' : 'Participate in Bet'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bet Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm">{bet.title}</h4>
            <p className="text-xs text-gray-600 mt-1">{bet.description}</p>
            <p className="text-xs text-gray-500 mt-2">
              Total Pool: ₹{bet.totalPool}
            </p>
          </div>

          {/* Balance Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Current Balance:</span>
              <span className="font-medium">₹{userBalance}</span>
            </div>
            {isEditing && (
              <div className="flex justify-between text-sm mt-1">
                <span>Available for betting:</span>
                <span className="font-medium text-green-600">
                  ₹{getEffectiveBalance()}
                </span>
              </div>
            )}
          </div>

          {!canParticipate && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This bet is {bet.status} and cannot be {isEditing ? 'edited' : 'joined'}.
              </AlertDescription>
            </Alert>
          )}

          {canParticipate && (
            <>
              {/* Option Selection */}
              <div>
                <Label className="text-sm font-medium">Select Option</Label>
                <RadioGroup
  value={selectedOptionId?.toString()}
  onValueChange={(value: string) => setSelectedOptionId(parseInt(value))}
  className="mt-2"
>

                  {bet.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option.id.toString()} 
                        id={`option-${option.id}`}
                      />
                      <Label 
                        htmlFor={`option-${option.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Amount Input */}
              <div>
                <Label className="text-sm font-medium">
                  Amount (in multiples of ₹10)
                </Label>
                <Input
  type="number"
  value={amount}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
  min="10"
  step="10"
  className="mt-1"
/>

                <p className="text-xs text-gray-500 mt-1">
                  Minimum: ₹10, Must be in multiples of 10
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-600">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading || !canParticipate}
                  className="flex-1"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Update' : 'Participate'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}