import React from 'react';
import { useRoute } from 'wouter';
import { useGetMatch, useGetMatchState, useAwardBlock, useGetQuestions } from '@workspace/api-client-react';
import { useGameSync } from '@/hooks/use-game-sync';
import { HexBoard } from '@/components/HexBoard';
import { Card, Button } from '@/components/ui';
import { Settings, RefreshCw, XCircle } from 'lucide-react';

export default function ModeratorView() {
  const [, params] = useRoute("/moderator/:id");
  const matchId = params?.id ? parseInt(params.id) : null;

  const { data: match } = useGetMatch(matchId as number, { query: { enabled: !!matchId } });
  const { data: gameState } = useGetMatchState(matchId as number, { query: { enabled: !!matchId } });
  const awardBlockMut = useAwardBlock();
  const { emitResetBuzzer } = useGameSync(matchId);

  // Moderator sees all questions
  const { data: questions } = useGetQuestions();

  if (!match || !gameState) return <div className="min-h-screen text-white p-10">Loading...</div>;

  const size = match.boardSize === '5x5' ? 5 : 3;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white/5 border-b border-white/10 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Settings className="text-emerald-500 w-6 h-6" />
          <h1 className="text-xl font-display font-bold text-white">Moderator Override</h1>
        </div>
        <div className="text-white/50 text-sm">Match #{match.matchNumber}</div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6">
        {/* Left: Board Status */}
        <div className="flex-1 flex flex-col bg-black/40 rounded-3xl border border-white/5 overflow-hidden">
           <div className="p-4 border-b border-white/5 text-center font-bold text-white/50 uppercase tracking-widest text-sm">
             Live Board State
           </div>
           <div className="flex-1 flex items-center justify-center p-8 transform scale-90 origin-top">
             <HexBoard size={size} blocks={gameState.blocks} interactive={false} />
           </div>
        </div>

        {/* Right: Controls & Override */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          <Card className="p-6 border-emerald-500/30">
            <h2 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Global Controls
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" onClick={emitResetBuzzer}>Force Reset Buzzer</Button>
              <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                Cancel Current Question
              </Button>
            </div>
          </Card>

          <Card className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Manual Block Award</h2>
            <p className="text-sm text-white/50 mb-4">Override host and manually assign a block.</p>
            
            <div className="space-y-4">
              {gameState.blocks.filter(b => !b.owner).map(block => (
                <div key={block.index} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                  <div className="font-bold text-white">Block {block.index + 1}</div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="red" 
                      className="h-8 text-xs"
                      onClick={() => awardBlockMut.mutate({ id: match.id, data: { blockIndex: block.index, team: 'Red' }})}
                    >
                      Red
                    </Button>
                    <Button 
                      size="sm" 
                      variant="blue"
                      className="h-8 text-xs"
                      onClick={() => awardBlockMut.mutate({ id: match.id, data: { blockIndex: block.index, team: 'Blue' }})}
                    >
                      Blue
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
