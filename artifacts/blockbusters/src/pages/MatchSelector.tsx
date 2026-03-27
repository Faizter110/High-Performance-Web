import React from 'react';
import { useGetMatches } from '@workspace/api-client-react';
import { Card, Button } from '@/components/ui';
import { Link, useLocation } from 'wouter';
import { Play, ArrowLeft } from 'lucide-react';

interface MatchSelectorProps {
  role: 'host' | 'moderator' | 'audience';
}

export function MatchSelector({ role }: MatchSelectorProps) {
  const [, setLocation] = useLocation();
  const { data: matches, isLoading, error } = useGetMatches();

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-6xl mx-auto flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="glass" size="icon" onClick={() => setLocation('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-white capitalize">{role} View</h1>
          <p className="text-white/60">Select an active match to join</p>
        </div>
      </div>

      {isLoading && <div className="text-white text-center py-20">Loading matches...</div>}
      {error && <div className="text-red-400 text-center py-20">Error loading matches.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches?.map((match) => (
          <Card key={match.id} className="p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-white/80">
                Match #{match.matchNumber}
              </div>
              <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase">
                {match.status}
              </div>
            </div>
            
            <div className="flex-1 my-4 flex items-center justify-between">
              <div className="text-center w-[40%]">
                <div className="text-red-400 font-bold text-lg leading-tight truncate">{match.redTeamName}</div>
              </div>
              <div className="text-white/40 font-black text-xl italic">VS</div>
              <div className="text-center w-[40%]">
                <div className="text-blue-400 font-bold text-lg leading-tight truncate">{match.blueTeamName}</div>
              </div>
            </div>

            <div className="text-sm text-white/50 mb-6 text-center">
              Board: {match.boardSize} | Round: {match.round || 'N/A'}
            </div>

            <Button 
              variant="default" 
              className="w-full mt-auto"
              onClick={() => setLocation(`/${role}/${match.id}`)}
            >
              <Play className="w-4 h-4 mr-2" /> Join as {role}
            </Button>
          </Card>
        ))}
        
        {matches?.length === 0 && (
          <div className="col-span-full text-center py-20 text-white/50">
            No matches found. Create one in the Admin panel.
            <div className="mt-4">
              <Button variant="outline" onClick={() => setLocation('/admin')}>Go to Admin</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
