'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BetCard from '@/components/BetCard';
import { useBets } from '@/hooks/useBets';
import { useUserBalance } from '@/hooks/useUserBalance';

export default function BetsPage() {
  const { user } = useUser();
  const { bets, loading: betsLoading, error: betsError, refreshBets } = useBets();
  const { balance, loading: balanceLoading, refreshBalance } = useUserBalance();
  const [activeTab, setActiveTab] = useState('active');

  const handleParticipationChange = () => {
    // Refresh both bets and balance when participation changes
    refreshBets();
    refreshBalance();
  };

  // Filter bets by status
  const activeBets = bets.filter(bet => bet.status === 'active');
  const lockedBets = bets.filter(bet => bet.status === 'locked');
  const completedBets = bets.filter(bet => bet.status === 'completed');

  // Get user's bet history
  const userBets = bets.filter(bet => 
    bet.participations?.some(p => p.userId === user?.id)
  );

  const handleRefresh = () => {
    refreshBets();
    refreshBalance();
  };

  const handleBrowseActiveBets = () => {
    setActiveTab('active');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p>Please sign in to view bets.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Betting Arena</h1>
          <p className="text-gray-600">Place your bets and win big!</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Balance Display */}
          <Card className="px-4 py-2">
            <div className="text-center">
              <p className="text-sm text-gray-600">Your Balance</p>
              <p className="text-lg font-bold text-green-600">
                {balanceLoading ? '...' : `₹${balance}`}
              </p>
            </div>
          </Card>
          
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={betsLoading || balanceLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(betsLoading || balanceLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {betsError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">
            {betsError}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for different bet categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active" className="relative">
            Active Bets
            {activeBets.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {activeBets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="locked" className="relative">
            Locked Bets
            {lockedBets.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {lockedBets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative">
            Completed Bets
            {completedBets.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {completedBets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-bets" className="relative">
            My Bets
            {userBets.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {userBets.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Bets */}
        <TabsContent value="active" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active Bets</h2>
            <p className="text-sm text-gray-600">Join now and make your predictions!</p>
          </div>
          
          {betsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Loading active bets...</p>
            </div>
          ) : activeBets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No active bets available right now.</p>
                <p className="text-sm text-gray-400 mt-2">Check back later or contact admin to create new bets!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeBets.map((bet) => (
                <BetCard
                  key={bet.id}
                  bet={bet}
                  userBalance={balance}
                  currentUserId={user.id}
                  onParticipationChange={handleParticipationChange}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Locked Bets */}
        <TabsContent value="locked" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Locked Bets</h2>
            <p className="text-sm text-gray-600">Awaiting results...</p>
          </div>
          
          {betsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Loading locked bets...</p>
            </div>
          ) : lockedBets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No locked bets at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lockedBets.map((bet) => (
                <BetCard
                  key={bet.id}
                  bet={bet}
                  userBalance={balance}
                  currentUserId={user.id}
                  onParticipationChange={handleParticipationChange}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed Bets */}
        <TabsContent value="completed" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Completed Bets</h2>
            <p className="text-sm text-gray-600">See past results and winners</p>
          </div>
          
          {betsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Loading completed bets...</p>
            </div>
          ) : completedBets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No completed bets yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedBets
                .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
                .map((bet) => (
                  <BetCard
                    key={bet.id}
                    bet={bet}
                    userBalance={balance}
                    currentUserId={user.id}
                    onParticipationChange={handleParticipationChange}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        {/* My Bets */}
        <TabsContent value="my-bets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Bets</h2>
            <p className="text-sm text-gray-600">Your betting history</p>
          </div>
          
          {betsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Loading your bets...</p>
            </div>
          ) : userBets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">You haven't placed any bets yet.</p>
                <Button 
                  className="mt-4"
                  onClick={handleBrowseActiveBets}
                >
                  Browse Active Bets
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userBets
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((bet) => (
                  <BetCard
                    key={bet.id}
                    bet={bet}
                    userBalance={balance}
                    currentUserId={user.id}
                    onParticipationChange={handleParticipationChange}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}