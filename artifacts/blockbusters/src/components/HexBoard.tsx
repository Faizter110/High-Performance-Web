import React from 'react';
import { cn } from '@/lib/utils';
import { BlockState } from '@workspace/api-client-react';

interface HexBoardProps {
  size: number; // 3 or 5
  blocks: BlockState[];
  onBlockClick?: (block: BlockState) => void;
  redMatchPoints?: number[];
  blueMatchPoints?: number[];
  interactive?: boolean;
}

export function HexBoard({ size, blocks, onBlockClick, redMatchPoints = [], blueMatchPoints = [], interactive = false }: HexBoardProps) {
  // Generate rows
  const rows = [];
  for (let r = 0; r < size; r++) {
    const rowBlocks = [];
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      const block = blocks.find(b => b.index === idx) || { index: idx, isMatchPoint: false };
      rowBlocks.push(block);
    }
    rows.push(rowBlocks);
  }

  // Calculate hexagon dimensions based on screen width/size to make it responsive
  const hexWidth = size === 5 ? "w-[18vw] max-w-[120px] sm:w-[12vw]" : "w-[25vw] max-w-[160px] sm:w-[15vw]";

  return (
    <div className="hex-grid-container p-8">
      {rows.map((row, rIdx) => (
        <div 
          key={rIdx} 
          className={cn(
            "hex-row",
            rIdx % 2 === 0 ? "even-row" : "odd-row",
            rIdx > 0 && (size === 5 ? "-mt-[4.5%]" : "-mt-[6%]") // Adjust overlap
          )}
          style={{
            marginLeft: rIdx % 2 !== 0 ? '5%' : '0' // Manual offset for odd rows
          }}
        >
          {row.map((block) => {
            const isRedMP = redMatchPoints.includes(block.index);
            const isBlueMP = blueMatchPoints.includes(block.index);
            
            return (
              <div 
                key={block.index} 
                className={cn(
                  "relative group transition-transform duration-300",
                  hexWidth,
                  interactive && !block.owner ? "cursor-pointer hover:scale-105 hover:z-10" : "cursor-default",
                  block.owner ? "z-0" : "z-1"
                )}
                onClick={() => interactive && onBlockClick?.(block)}
              >
                <div className="hex-wrapper">
                  <div className={cn(
                    "hex-inner clip-hex flex flex-col items-center justify-center text-center transition-all duration-500",
                    !block.owner && "bg-neutral-hex border-[3px] border-white/10 text-white/50",
                    block.owner === 'Red' && "bg-red-team text-white shadow-[0_0_30px_rgba(220,38,38,0.6)] z-10",
                    block.owner === 'Blue' && "bg-blue-team text-white shadow-[0_0_30px_rgba(37,99,235,0.6)] z-10"
                  )}>
                    
                    {/* Inner content */}
                    <div className="flex flex-col items-center justify-center w-full h-full p-2">
                       {block.owner ? (
                         <span className="font-display text-2xl sm:text-4xl font-black drop-shadow-md">
                           {block.owner === 'Red' ? 'R' : 'B'}
                         </span>
                       ) : (
                         <span className="font-display text-lg sm:text-2xl font-bold opacity-30">
                           {block.index + 1}
                         </span>
                       )}
                    </div>
                    
                    {/* Match point indicator overlay */}
                    {(!block.owner && (isRedMP || isBlueMP)) && (
                      <div className="absolute inset-0 border-4 border-dashed rounded-full scale-90 animate-[spin_10s_linear_infinite] pointer-events-none"
                           style={{ 
                             borderColor: isRedMP && isBlueMP ? '#eab308' : (isRedMP ? '#f87171' : '#60a5fa'),
                             opacity: 0.7 
                           }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
