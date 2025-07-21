'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Trophy, Clock, Edit } from 'lucide-react';
import BetParticipationModal from './BetParticipationModal';

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
  user?: {
    name: string;
  };
}

interface BetCardProps {
  bet: {
    id: number;
    title: string;
    description: string;
    options: BetOption[];
    status: 'active' | 'locked' | 'completed';
    commissionRate: number;
    totalPool: number;
    commissionAmount: number;
    prizePool: number;
    winningOptionId?: number;
    createdAt: Date;
    completedAt?: Date;
    participations?: BetParticipation[];
  };
  userBalance: number;
  currentUserId: string;
  onParticipationChange: () => void;
}

export default function BetCard({
  bet,
  userBalance,
  currentUserId,
  onParticipationChange
}: BetCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'locked': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'locked': return 'Locked';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  // Calculate option-wise pool distribution
  const getOptionStats = (optionId: number) => {
    if (!bet.participations) return { amount: 0, percentage: 0, count: 0 };
    
    const optionParticipations = bet.participations.filter(p => p.optionId === optionId);
    const amount = optionParticipations.reduce((sum, p) => sum + p.amount, 0);
    const percentage = bet.totalPool > 0 ? (amount / bet.totalPool) * 100 : 0;
    const count = optionParticipations.length;
    
    return { amount, percentage, count };
  };

  // Check if current user has participated
  const userParticipation = bet.participations?.find(p => p.userId === currentUserId);

  // Get winning option for completed bets
  const winningOption = bet.winningOptionId 
    ? bet.options.find(opt => opt.id === bet.winningOptionId)
    : null;

  // Calculate user's prize if they won
  const getUserPrize = () => {
    if (bet.status !== 'completed' || !userParticipation || !bet.winningOptionId) return 0;
    if (userParticipation.optionId !== bet.winningOptionId) return 0;
    
    const winnerParticipations = bet.participations?.filter(p => p.optionId === bet.winningOptionId) || [];
    const totalWinnerAmount = winnerParticipations.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalWinnerAmount === 0) return 0;
    
    const winRatio = userParticipation.amount / totalWinnerAmount;
    return bet.prizePool * winRatio;
  };

  const userPrize = getUserPrize();

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{bet.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{bet.description}</p>
            </div>
            <Badge className={getStatusColor(bet.status)}>
              {getStatusText(bet.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Pool Information */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                <Trophy className="w-4 h-4" />
                <span>Total Pool</span>
              </div>
              <div className="text-lg font-bold text-green-600">₹{bet.totalPool}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Participants</span>
              </div>
              <div className="text-lg font-bold">{bet.participations?.length || 0}</div>
            </div>
          </div>

          {/* Commission Info */}
          {bet.totalPool > 0 && (
            <div className="text-xs text-gray-500 text-center">
              Commission: {bet.commissionRate}% (₹{bet.commissionAmount.toFixed(2)}) 
              • Prize Pool: ₹{bet.prizePool.toFixed(2)}
            </div>
          )}

          {/* Options with Distribution */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Options & Current Distribution:</h4>
            {bet.options.map((option) => {
              const stats = getOptionStats(option.id);
              const isWinning = bet.winningOptionId === option.id;
              const isUserChoice = userParticipation?.optionId === option.id;
              
              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{option.text}</span>
                      {isWinning && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Winner!
                        </Badge>
                      )}
                      {isUserChoice && (
                        <Badge variant="outline" className="text-xs">
                          Your Choice
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      ₹{stats.amount} ({stats.count} bets)
                    </div>
                  </div>
                  <Progress value={stats.percentage} className="h-2" />
                </div>
              );
            })}
          </div>

          {/* User Participation Info */}
          {userParticipation && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm">
                <span className="text-blue-600 font-medium">Your participation:</span>
                <div className="mt-1">
                  Amount: ₹{userParticipation.amount} on "{bet.options.find(opt => opt.id === userParticipation.optionId)?.text}"
                </div>
                {bet.status === 'completed' && (
                  <div className="mt-1">
                    {userPrize > 0 ? (
                      <span className="text-green-600 font-medium">
                        You won: ₹{userPrize.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-red-600">
                        You lost this bet
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {bet.status === 'active' && (
              <>
                {!userParticipation ? (
                  <Button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1"
                  >
                    Participate
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Participation
                  </Button>
                )}
              </>
            )}
            {bet.status !== 'active' && (
              <Button disabled className="flex-1">
                {bet.status === 'locked' ? 'Betting Locked' : 'Betting Closed'}
              </Button>
            )}
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Created: {new Date(bet.createdAt).toLocaleDateString()}</span>
            </div>
            {bet.completedAt && (
              <span>Completed: {new Date(bet.completedAt).toLocaleDateString()}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participation Modal */}
      <BetParticipationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bet={bet}
        userBalance={userBalance}
        existingParticipation={userParticipation}
        onParticipationChange={onParticipationChange}
      />
    </>
  );
}