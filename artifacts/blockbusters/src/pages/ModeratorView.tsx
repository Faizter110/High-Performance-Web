import React from 'react';
import { useRoute, useLocation } from 'wouter';
import { useGetMatch, useGetMatchState } from '@workspace/api-client-react';
import { useGameSync } from '@/hooks/use-game-sync';
import { HexBoard } from '@/components/HexBoard';
import { Card, Button } from '@/components/ui';
import { Settings, RefreshCw, ArrowLeft } from 'lucide-react';

export default function ModeratorView() {
  const [, params] = useRoute("/moderator/:id");
  const [, navigate] = useLocation();
  const matchId = params?.id ? parseInt(params.id) : null;

  const { data: match } = useGetMatch(matchId as number, { query: { enabled: !!matchId } });
  const { data: gameState } = useGetMatchState(matchId as number, { query: { enabled: !!matchId } });
  const { emitResetBuzzer, emitAwardBlock } = useGameSync(matchId);

  if (!match || !gameState) return <div className="min-h-screen text-white p-10">Loading...</div>;

  const size = match.boardSize === '5x5' ? 5 : 3;
  const currentBlockIndex = gameState.currentBlockIndex ?? null;

  const handleForceAward = (blockIndex: number, team: 'red' | 'blue') => {
    emitAwardBlock(blockIndex, team, null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white/5 border-b border-white/10 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/moderator')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Back to match list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Settings className="text-emerald-500 w-6 h-6" />
          <h1 className="text-xl font-display font-bold text-white">Moderator Override</h1>
        </div>
        <div className="text-white/50 text-sm">Match #{match.matchNumber}</div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6">
        {/* Left: Board State */}
        <div className="flex-1 flex flex-col bg-black/40 rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 text-center font-bold text-white/50 uppercase tracking-widest text-sm">
            Live Board State
          </div>
          <div className="flex-1 flex items-center justify-center p-8 transform scale-90 origin-top">
            <HexBoard size={size} blocks={gameState.blocks} interactive={false} />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          <Card className="p-6 border-emerald-500/30">
            <h2 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Global Controls
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" onClick={emitResetBuzzer}>Force Reset Buzzer</Button>
            </div>
          </Card>

          {currentBlockIndex !== null && (
            <Card className="p-6 border-yellow-500/30">
              <h2 className="text-lg font-bold text-yellow-400 mb-4">Active Block: #{currentBlockIndex + 1}</h2>
              <p className="text-sm text-white/50 mb-4">Award this block to a team:</p>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="red" onClick={() => handleForceAward(currentBlockIndex, 'red')}>
                  {match.redTeamName}
                </Button>
                <Button variant="blue" onClick={() => handleForceAward(currentBlockIndex, 'blue')}>
                  {match.blueTeamName}
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Manual Block Award</h2>
            <p className="text-sm text-white/50 mb-4">Override host and manually assign any open block.</p>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {gameState.blocks.filter(b => !b.owner).map(block => (
                <div key={block.index} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                  <div className="font-bold text-white">Block {block.index + 1}</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="red"
                      className="h-8 text-xs"
                      onClick={() => handleForceAward(block.index, 'red')}
                    >
                      Red
                    </Button>
                    <Button
                      size="sm"
                      variant="blue"
                      className="h-8 text-xs"
                      onClick={() => handleForceAward(block.index, 'blue')}
                    >
                      Blue
                    </Button>
                  </div>
                </div>
              ))}
              {gameState.blocks.filter(b => !b.owner).length === 0 && (
                <p className="text-white/40 text-sm text-center py-4">All blocks have been awarded.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
