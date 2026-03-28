import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useGetMatch, useGetMatchState, BlockState } from '@workspace/api-client-react';
import { useGameSync } from '@/hooks/use-game-sync';
import { HexBoard } from '@/components/HexBoard';
import { TeamScore } from '@/components/TeamScore';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui';
import { findMatchPoints } from '@/lib/hex-utils';
import { cn } from '@/lib/utils';
import { Bell, Trophy, ArrowLeft } from 'lucide-react';

export default function HostView() {
  const [, params] = useRoute("/host/:id");
  const [, navigate] = useLocation();
  const matchId = params?.id ? parseInt(params.id) : null;

  const { data: match } = useGetMatch(matchId as number, { query: { enabled: !!matchId } });
  const { data: gameState } = useGetMatchState(matchId as number, { query: { enabled: !!matchId } });

  const { buzzer, emitResetBuzzer, emitOpenBlock, emitAwardBlock } = useGameSync(matchId);

  const [showAnswer, setShowAnswer] = useState(false);

  if (!match || !gameState) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading game...</div>;
  }

  const size = match.boardSize === '5x5' ? 5 : 3;
  const blocks = gameState.blocks || [];

  const redBlocks = blocks.filter(b => b.owner === 'red').length;
  const blueBlocks = blocks.filter(b => b.owner === 'blue').length;

  const { red: redMP, blue: blueMP } = findMatchPoints(blocks, size);

  // Modal is driven by server state: open when a block is currently selected
  const currentBlockIndex = gameState.currentBlockIndex ?? null;
  const currentQuestion = gameState.currentQuestion ?? null;
  const isModalOpen = currentBlockIndex !== null;

  const handleBlockClick = (block: BlockState) => {
    if (!matchId || block.owner) return;
    setShowAnswer(false);
    emitOpenBlock(block.index);
  };

  const handleAward = (team: 'red' | 'blue') => {
    if (currentBlockIndex === null || !matchId) return;
    emitAwardBlock(currentBlockIndex, team, currentQuestion?.id ?? null);
    setShowAnswer(false);
  };

  const handleCloseModal = () => {
    // Reset buzzer to effectively close without awarding
    emitResetBuzzer();
    setShowAnswer(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="glass-panel py-4 px-6 flex justify-between items-center z-20 relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/host')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Back to match list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
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

        {/* Left Panel: Red Team */}
        <div className="w-full md:w-[250px] p-6 flex flex-col gap-6 relative z-10">
          <TeamScore
            team="Red"
            name={match.redTeamName}
            blocksOwned={redBlocks}
            activeBuzzer={buzzer === 'red'}
            isWinner={gameState.winnerTeam === 'red'}
          />

          {buzzer === 'red' && (
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

        {/* Right Panel: Blue Team */}
        <div className="w-full md:w-[250px] p-6 flex flex-col gap-6 relative z-10">
          <TeamScore
            team="Blue"
            name={match.blueTeamName}
            blocksOwned={blueBlocks}
            activeBuzzer={buzzer === 'blue'}
            isWinner={gameState.winnerTeam === 'blue'}
          />

          {buzzer === 'blue' && (
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

      {/* Question Modal — driven by server state */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentBlockIndex !== null ? `Block ${currentBlockIndex + 1}` : ''}
      >
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-center text-sm text-white/50 font-semibold uppercase tracking-wider">
            <span>{currentQuestion?.category || '—'}</span>
            <span>{currentQuestion?.difficulty || '—'}</span>
          </div>

          <div className="text-3xl font-display text-white text-center leading-tight min-h-[4rem] flex items-center justify-center">
            {currentQuestion ? currentQuestion.text : (
              <span className="text-white/40 text-xl animate-pulse">Loading question…</span>
            )}
          </div>

          <div className="flex justify-center mt-4">
            {!showAnswer ? (
              <Button variant="glass" onClick={() => setShowAnswer(true)} disabled={!currentQuestion}>
                Reveal Answer
              </Button>
            ) : (
              <div className="bg-white/10 p-6 rounded-2xl border border-white/20 w-full text-center">
                <div className="text-sm text-white/50 uppercase tracking-widest mb-2 font-bold">Answer</div>
                <div className="text-2xl text-green-400 font-bold">{currentQuestion?.answer}</div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-6 mt-4">
            <h3 className="text-white/50 text-center uppercase tracking-widest text-sm font-bold mb-4">Award Block To</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="red" size="lg" onClick={() => handleAward('red')}>
                {match.redTeamName}
              </Button>
              <Button variant="blue" size="lg" onClick={() => handleAward('blue')}>
                {match.blueTeamName}
              </Button>
            </div>
            <Button variant="ghost" className="w-full mt-4" onClick={handleCloseModal}>
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
              gameState.winnerTeam === 'red' ? 'text-red-500' : 'text-blue-500'
            )} />
            <h1 className="text-6xl md:text-8xl font-display font-black text-white uppercase tracking-tighter drop-shadow-2xl">
              {gameState.winnerTeam === 'red' ? match.redTeamName : match.blueTeamName} WINS!
            </h1>
            <Button variant="outline" className="mt-12 text-white" onClick={() => window.location.href = '/admin'}>
              Return to Admin
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
