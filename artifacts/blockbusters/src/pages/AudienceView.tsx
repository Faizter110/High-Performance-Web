import React, { useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useGetMatch, useGetMatchState } from '@workspace/api-client-react';
import { useGameSync } from '@/hooks/use-game-sync';
import { HexBoard } from '@/components/HexBoard';
import { TeamScore } from '@/components/TeamScore';
import { findMatchPoints } from '@/lib/hex-utils';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { ArrowLeft } from 'lucide-react';

export default function AudienceView() {
  const [, params] = useRoute("/audience/:id");
  const [, navigate] = useLocation();
  const matchId = params?.id ? parseInt(params.id) : null;

  const { data: match } = useGetMatch(matchId as number, { query: { enabled: !!matchId } });
  const { data: gameState } = useGetMatchState(matchId as number, { query: { enabled: !!matchId } });
  const { buzzer } = useGameSync(matchId);

  useEffect(() => {
    if (gameState?.winnerTeam) {
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = gameState.winnerTeam === 'red' ? ['#ef4444', '#b91c1c'] : ['#3b82f6', '#1d4ed8'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [gameState?.winnerTeam]);

  if (!match || !gameState) return null;

  const size = match.boardSize === '5x5' ? 5 : 3;
  const blocks = gameState.blocks || [];

  const redBlocks = blocks.filter(b => b.owner === 'red').length;
  const blueBlocks = blocks.filter(b => b.owner === 'blue').length;
  const { red: redMP, blue: blueMP } = findMatchPoints(blocks, size);

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Subtle back button for projection mode — visible on hover */}
      <button
        onClick={() => navigate('/audience')}
        className="absolute top-4 left-4 z-30 p-2 rounded-full bg-white/5 hover:bg-white/20 text-white/30 hover:text-white transition-all duration-200"
        title="Back to match list"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className={cn(
        "absolute inset-0 transition-opacity duration-500 pointer-events-none opacity-20",
        buzzer === 'red' && "bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.5),transparent)]",
        buzzer === 'blue' && "bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.5),transparent)]"
      )} />

      <div className="flex justify-between items-start p-8 relative z-10">
        <div className="w-[300px]">
          <TeamScore
            team="Red"
            name={match.redTeamName}
            blocksOwned={redBlocks}
            activeBuzzer={buzzer === 'red'}
          />
        </div>

        <div className="flex flex-col items-center pt-4">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Blockbusters" className="h-24 object-contain opacity-80" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          {match.round && <div className="text-white/60 font-display tracking-[0.3em] uppercase mt-2">{match.round}</div>}
        </div>

        <div className="w-[300px]">
          <TeamScore
            team="Blue"
            name={match.blueTeamName}
            blocksOwned={blueBlocks}
            activeBuzzer={buzzer === 'blue'}
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center pb-12 relative z-10 scale-[1.15]">
        <HexBoard
          size={size}
          blocks={blocks}
          redMatchPoints={redMP}
          blueMatchPoints={blueMP}
          interactive={false}
        />
      </div>

      {gameState.winnerTeam && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-1000">
          <div className={cn(
            "text-[12vw] font-display font-black uppercase text-transparent bg-clip-text leading-none drop-shadow-[0_0_50px_currentColor]",
            gameState.winnerTeam === 'red' ? "bg-gradient-to-b from-red-400 to-red-600 text-red-500" : "bg-gradient-to-b from-blue-400 to-blue-600 text-blue-500"
          )}>
            {gameState.winnerTeam === 'red' ? match.redTeamName : match.blueTeamName} WINS!
          </div>
        </div>
      )}
    </div>
  );
}
