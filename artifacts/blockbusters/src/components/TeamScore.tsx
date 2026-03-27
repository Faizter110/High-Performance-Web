import React from 'react';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface TeamScoreProps {
  team: 'Red' | 'Blue';
  name: string;
  blocksOwned: number;
  isWinner?: boolean;
  activeBuzzer?: boolean;
}

export function TeamScore({ team, name, blocksOwned, isWinner, activeBuzzer }: TeamScoreProps) {
  const isRed = team === 'Red';
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl glass-panel relative overflow-hidden transition-all duration-300",
      activeBuzzer && (isRed ? "ring-4 ring-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.5)] scale-105" : "ring-4 ring-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.5)] scale-105"),
      isWinner && "scale-110 z-10"
    )}>
      {/* Background glow */}
      <div className={cn(
        "absolute inset-0 opacity-20",
        isRed ? "bg-red-team" : "bg-blue-team"
      )} />
      
      {isWinner && (
        <div className="absolute top-0 w-full bg-yellow-500 text-black text-xs font-bold py-1 text-center uppercase tracking-widest flex items-center justify-center gap-1">
          <Trophy className="w-3 h-3" /> Winner
        </div>
      )}

      <h2 className={cn(
        "font-display text-2xl sm:text-4xl font-black uppercase tracking-wider text-glow mt-2",
        isRed ? "text-red-400" : "text-blue-400"
      )}>
        {name}
      </h2>
      
      <div className="mt-2 flex items-center gap-2">
        <div className="text-sm text-white/60 uppercase tracking-widest font-semibold">Blocks</div>
        <div className="text-3xl font-bold text-white bg-black/40 px-4 py-1 rounded-xl">
          {blocksOwned}
        </div>
      </div>
    </div>
  );
}
