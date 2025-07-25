'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusCircle, Trash2, Loader2, Lock, Unlock, CheckCircle, AlertCircle } from 'lucide-react';

// A simple Textarea component if you don't have one in ui/textarea.tsx
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    {...props}
  />
);


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
  
  // UI state for the creation form
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // --- NEW: UI state for the management table ---
  const [tableError, setTableError] = useState<string | null>(null);
  const [tableSuccess, setTableSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchBets();
  }, []);

  const fetchBets = async () => {
    try {
      setLoadingBets(true);
      const response = await fetch('/api/bets');
      if (response.ok) {
        const data = await response.json();
        setExistingBets(data.bets || []);
      } else {
        setTableError('Failed to fetch bets.');
      }
    } catch (err) {
      setTableError('An error occurred while fetching bets.');
    } finally {
      setLoadingBets(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const addOption = () => setOptions([...options, { text: '' }]);

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    setIsCreating(true);
    setFormError(null);
    setFormSuccess(null);

    const validOptions = options.filter(opt => opt.text.trim() !== '');

    if (!title.trim() || validOptions.length < 2) {
      setFormError('Title and at least two valid options are required.');
      setIsCreating(false);
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

      if (!response.ok) throw new Error('Failed to create bet.');

      setFormSuccess('Bet created successfully!');
      setTitle('');
      setDescription('');
      setCommissionRate(1.0);
      setOptions([{ text: '' }, { text: '' }]);
      fetchBets(); // Refresh the bets list
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const updateBetStatus = async (betId: number, newStatus: string) => {
    setTableError(null);
    setTableSuccess(null);

    try {
      const response = await fetch(`/api/bets/${betId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update bet status.');
      
      setTableSuccess(`Bet status updated to ${newStatus}.`);
      fetchBets(); // Refresh the list
    } catch (err: any) {
      setTableError(err.message);
    }
  };
  
  const StatusBadge = ({ status }: { status: string }) => {
    const statusClasses = {
      active: "bg-green-100 text-green-800",
      locked: "bg-yellow-100 text-yellow-800",
      completed: "bg-gray-100 text-gray-800"
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* --- Column 1: Create Bet Form --- */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Create New Bet</CardTitle>
            <CardDescription>Fill out the details to launch a new bet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Who will win the match?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more context here..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input id="commissionRate" type="number" value={commissionRate} onChange={(e) => setCommissionRate(parseFloat(e.target.value))} step="0.1" min="0" max="100" />
            </div>
            
            <div className="space-y-2">
              <Label>Betting Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                  {options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeOption(index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addOption} className="mt-2">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>

            {formError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">{formError}</AlertDescription>
              </Alert>
            )}
            {formSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">{formSuccess}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleSubmit} disabled={isCreating} className="w-full">
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Bet
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* --- Column 2: Manage Existing Bets --- */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Manage Existing Bets</CardTitle>
            <CardDescription>View, lock, or complete active bets.</CardDescription>
          </CardHeader>
          <CardContent>
            {tableError && (
              <Alert className="border-red-200 bg-red-50 mb-4">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">{tableError}</AlertDescription>
              </Alert>
            )}
            {tableSuccess && (
              <Alert className="border-green-200 bg-green-50 mb-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">{tableSuccess}</AlertDescription>
              </Alert>
            )}

            {loadingBets ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : existingBets.length === 0 ? (
              <p className="text-center py-12 text-gray-500">No bets have been created yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium p-3">Title</th>
                      <th className="text-left font-medium p-3">Status</th>
                      <th className="text-left font-medium p-3">Pool</th>
                      <th className="text-left font-medium p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingBets.map((bet) => (
                      <tr key={bet.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{bet.title}</td>
                        <td className="p-3"><StatusBadge status={bet.status} /></td>
                        <td className="p-3">₹{Number(bet.total_pool).toFixed(2)}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {bet.status === 'active' && (
                              <Button size="sm" variant="outline" onClick={() => updateBetStatus(bet.id, 'locked')}>
                                <Lock className="w-3 h-3 mr-1" /> Lock
                              </Button>
                            )}
                            {bet.status === 'locked' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => updateBetStatus(bet.id, 'active')}>
                                  <Unlock className="w-3 h-3 mr-1" /> Reopen
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => updateBetStatus(bet.id, 'completed')}>
                                  <CheckCircle className="w-3 h-3 mr-1" /> Complete
                                </Button>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBetManager;