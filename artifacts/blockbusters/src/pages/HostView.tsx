import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useGetMatch, useGetMatchState, useAwardBlock, BlockState, useGetQuestion } from '@workspace/api-client-react';
import { useGameSync } from '@/hooks/use-game-sync';
import { HexBoard } from '@/components/HexBoard';
import { TeamScore } from '@/components/TeamScore';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui';
import { findMatchPoints } from '@/lib/hex-utils';
import { Bell, Trophy, ShieldAlert, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function HostView() {
  const [, params] = useRoute("/host/:id");
  const matchId = params?.id ? parseInt(params.id) : null;
  const queryClient = useQueryClient();

  const { data: match } = useGetMatch(matchId as number, { query: { enabled: !!matchId } });
  const { data: gameState } = useGetMatchState(matchId as number, { query: { enabled: !!matchId } });
  const awardBlockMut = useAwardBlock();
  
  const { buzzer, emitResetBuzzer } = useGameSync(matchId);

  const [selectedBlock, setSelectedBlock] = useState<BlockState | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // For host, normally they click block -> opens random question from pool.
  // In a full implementation, the backend would assign a question.
  // We'll mock fetching a random question for demo, or assume the block has a questionId.
  const { data: question } = useGetQuestion(selectedBlock?.questionId || 1, { query: { enabled: !!selectedBlock } });

  if (!match || !gameState) return <div className="min-h-screen flex items-center justify-center text-white">Loading game...</div>;

  const size = match.boardSize === '5x5' ? 5 : 3;
  const blocks = gameState.blocks || [];
  
  const redBlocks = blocks.filter(b => b.owner === 'Red').length;
  const blueBlocks = blocks.filter(b => b.owner === 'Blue').length;

  const { red: redMP, blue: blueMP } = findMatchPoints(blocks, size);

  const handleBlockClick = (block: BlockState) => {
    setSelectedBlock(block);
    setShowAnswer(false);
  };

  const handleAward = (team: 'Red' | 'Blue') => {
    if (!selectedBlock || !matchId) return;
    awardBlockMut.mutate({
      id: matchId,
      data: { blockIndex: selectedBlock.index, team }
    }, {
      onSuccess: () => {
        setSelectedBlock(null);
        emitResetBuzzer(); // Clear buzzer on award
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="glass-panel py-4 px-6 flex justify-between items-center z-20 relative">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
            Host View
          </div>
          <div className="text-white/60 font-medium">Match #{match.matchNumber}</div>
        </div>
        <div className="text-xl font-display font-bold text-white tracking-widest uppercase">
          {match.round || 'Finals'}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Left Panel: Red Team & Buzzer */}
        <div className="w-full md:w-[250px] p-6 flex flex-col gap-6 relative z-10">
          <TeamScore 
            team="Red" 
            name={match.redTeamName} 
            blocksOwned={redBlocks} 
            activeBuzzer={buzzer === 'Red'}
            isWinner={gameState.winnerTeam === 'Red'}
          />
          
          {buzzer === 'Red' && (
            <div className="animate-pulse bg-yellow-500 text-black p-4 rounded-xl text-center font-bold text-xl uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.6)]">
              <Bell className="w-8 h-8 mx-auto mb-2" />
              Buzzed In!
            </div>
          )}
        </div>

        {/* Center: Board */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <HexBoard 
            size={size} 
            blocks={blocks} 
            onBlockClick={handleBlockClick}
            redMatchPoints={redMP}
            blueMatchPoints={blueMP}
            interactive={true}
          />
        </div>

        {/* Right Panel: Blue Team & Controls */}
        <div className="w-full md:w-[250px] p-6 flex flex-col gap-6 relative z-10">
          <TeamScore 
            team="Blue" 
            name={match.blueTeamName} 
            blocksOwned={blueBlocks} 
            activeBuzzer={buzzer === 'Blue'}
            isWinner={gameState.winnerTeam === 'Blue'}
          />

          {buzzer === 'Blue' && (
            <div className="animate-pulse bg-yellow-500 text-black p-4 rounded-xl text-center font-bold text-xl uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.6)]">
              <Bell className="w-8 h-8 mx-auto mb-2" />
              Buzzed In!
            </div>
          )}

          {buzzer && (
            <Button variant="outline" className="w-full mt-auto" onClick={emitResetBuzzer}>
              Reset Buzzer
            </Button>
          )}
        </div>
      </div>

      {/* Question Modal */}
      <Modal 
        isOpen={!!selectedBlock} 
        onClose={() => setSelectedBlock(null)}
        title={`Block ${selectedBlock?.index !== undefined ? selectedBlock.index + 1 : ''}`}
      >
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-center text-sm text-white/50 font-semibold uppercase tracking-wider">
            <span>{question?.category || 'General'}</span>
            <span>{question?.difficulty || 'Medium'}</span>
          </div>

          <div className="text-3xl font-display text-white text-center leading-tight">
            {question?.text || "What is the capital of France?"}
          </div>

          <div className="flex justify-center mt-4">
            {!showAnswer ? (
              <Button variant="glass" onClick={() => setShowAnswer(true)}>
                Reveal Answer
              </Button>
            ) : (
              <div className="bg-white/10 p-6 rounded-2xl border border-white/20 w-full text-center">
                <div className="text-sm text-white/50 uppercase tracking-widest mb-2 font-bold">Answer</div>
                <div className="text-2xl text-green-400 font-bold">{question?.answer || "Paris"}</div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-6 mt-4">
            <h3 className="text-white/50 text-center uppercase tracking-widest text-sm font-bold mb-4">Award Block To</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="red" size="lg" onClick={() => handleAward('Red')} disabled={awardBlockMut.isPending}>
                {match.redTeamName}
              </Button>
              <Button variant="blue" size="lg" onClick={() => handleAward('Blue')} disabled={awardBlockMut.isPending}>
                {match.blueTeamName}
              </Button>
            </div>
            <Button variant="ghost" className="w-full mt-4" onClick={() => setSelectedBlock(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Victory Overlay */}
      {gameState.winnerTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="text-center animate-in zoom-in duration-500">
            <Trophy className={cn(
              "w-32 h-32 mx-auto mb-8 drop-shadow-[0_0_40px_currentColor]",
              gameState.winnerTeam === 'Red' ? 'text-red-500' : 'text-blue-500'
            )} />
            <h1 className="text-6xl md:text-8xl font-display font-black text-white uppercase tracking-tighter drop-shadow-2xl">
              {gameState.winnerTeam === 'Red' ? match.redTeamName : match.blueTeamName} WINS!
            </h1>
            <Button variant="outline" className="mt-12 text-white" onClick={() => window.location.href='/admin'}>
              Return to Admin
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
