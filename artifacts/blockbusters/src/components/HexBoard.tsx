import React, { useState } from 'react';
import { BlockState } from '@workspace/api-client-react';

// ─── Hex geometry (pointy-top hexagons) ───────────────────────────────────────
const R = 42;
const DX = Math.sqrt(3) * R;
const DY = 1.5 * R;
const PAD = R * 0.6;

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

function getCenter(row: number, col: number): { x: number; y: number } {
  const isOddRow = row % 2 !== 0;
  return {
    x: col * DX + (isOddRow ? DX / 2 : 0),
    y: row * DY,
  };
}

type CellRole = 'red-border' | 'blue-border' | 'inner' | 'empty';

function cellRole(row: number, col: number, totalSize: number): CellRole {
  const last = totalSize - 1;
  const isCorner = (row === 0 || row === last) && (col === 0 || col === last);
  if (isCorner) return 'empty';
  if (row === 0 || row === last) return 'blue-border';
  if (col === 0 || col === last) return 'red-border';
  return 'inner';
}

function toBlockIndex(row: number, col: number, innerSize: number): number {
  return (row - 1) * innerSize + (col - 1);
}

function calcViewBox(totalCols: number, totalRows: number) {
  const vbX = -DX / 2 - PAD;
  const vbY = -R - PAD;
  const vbW = (totalCols - 1) * DX + DX / 2 + DX + PAD * 2;
  const vbH = (totalRows - 1) * DY + 2 * R + PAD * 2;
  return `${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`;
}

interface HexBoardProps {
  size: number;
  blocks: BlockState[];
  onBlockClick?: (block: BlockState) => void;
  redMatchPoints?: number[];
  blueMatchPoints?: number[];
  interactive?: boolean;
}

export function HexBoard({
  size,
  blocks,
  onBlockClick,
  redMatchPoints = [],
  blueMatchPoints = [],
  interactive = false,
}: HexBoardProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const totalSize = size + 2;
  const viewBox = calcViewBox(totalSize, totalSize);

  type Cell = {
    row: number; col: number;
    cx: number; cy: number;
    role: CellRole;
    block?: BlockState;
    blockIdx?: number;
  };

  const cells: Cell[] = [];
  for (let r = 0; r < totalSize; r++) {
    for (let c = 0; c < totalSize; c++) {
      const role = cellRole(r, c, totalSize);
      if (role === 'empty') continue;
      const { x: cx, y: cy } = getCenter(r, c);
      if (role === 'inner') {
        const blockIdx = toBlockIndex(r, c, size);
        const block =
          blocks.find((b) => b.index === blockIdx) ??
          ({ index: blockIdx, isMatchPoint: false } as BlockState);
        cells.push({ row: r, col: c, cx, cy, role, block, blockIdx });
      } else {
        cells.push({ row: r, col: c, cx, cy, role });
      }
    }
  }

  return (
    <svg
      viewBox={viewBox}
      className="w-full h-full"
      style={{ maxHeight: '78vh', overflow: 'visible' }}
    >
      <defs>
        <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-blue" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {cells.map(({ row, col, cx, cy, role, block, blockIdx }) => {
        const isOwnerRed  = block?.owner === 'red';
        const isOwnerBlue = block?.owner === 'blue';
        const isHovered   = hovered === blockIdx && interactive && !block?.owner;
        const isRedMP     = blockIdx !== undefined && redMatchPoints.includes(blockIdx);
        const isBlueMP    = blockIdx !== undefined && blueMatchPoints.includes(blockIdx);
        const isMP        = isRedMP || isBlueMP;

        let fill: string;
        let stroke: string;
        let strokeWidth: number;

        if (role === 'red-border') {
          fill        = '#C0392B';
          stroke      = '#E74C3C';
          strokeWidth = 1.5;
        } else if (role === 'blue-border') {
          fill        = '#1E6FD9';
          stroke      = '#2980B9';
          strokeWidth = 1.5;
        } else {
          if (isOwnerRed) {
            fill        = '#C0392B';
            stroke      = '#E74C3C';
            strokeWidth = 2;
          } else if (isOwnerBlue) {
            fill        = '#1E6FD9';
            stroke      = '#3498DB';
            strokeWidth = 2;
          } else if (isHovered) {
            fill        = '#374151';
            stroke      = '#6B7280';
            strokeWidth = 2;
          } else {
            fill        = '#1F2A3A';
            stroke      = '#3A4A5A';
            strokeWidth = 1.5;
          }
        }

        const filter =
          role === 'inner' && isOwnerRed
            ? 'url(#glow-red)'
            : role === 'inner' && isOwnerBlue
            ? 'url(#glow-blue)'
            : undefined;

        const isClickable = role === 'inner' && interactive && !block?.owner;
        const displayNum  = blockIdx !== undefined ? blockIdx + 1 : undefined;

        return (
          <g
            key={`${row}-${col}`}
            onClick={() => isClickable && block && onBlockClick?.(block)}
            onMouseEnter={() => role === 'inner' && setHovered(blockIdx ?? null)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: isClickable ? 'pointer' : 'default' }}
          >
            <polygon
              points={hexPoints(cx, cy, R - 1.5)}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              filter={filter}
              style={{ transition: 'fill 0.4s ease, filter 0.4s ease' }}
            />

            {(role === 'red-border' || role === 'blue-border') && (
              <polygon
                points={hexPoints(cx, cy - 2, R * 0.65)}
                fill="rgba(255,255,255,0.08)"
                stroke="none"
                pointerEvents="none"
              />
            )}

            {role === 'inner' && isMP && !block?.owner && (
              <polygon
                points={hexPoints(cx, cy, R * 0.88)}
                fill="none"
                stroke={isRedMP && isBlueMP ? '#FACC15' : isRedMP ? '#FCA5A5' : '#93C5FD'}
                strokeWidth={2.5}
                strokeDasharray="5,4"
                opacity={0.85}
                pointerEvents="none"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`0 ${cx} ${cy}`}
                  to={`360 ${cx} ${cy}`}
                  dur="8s"
                  repeatCount="indefinite"
                />
              </polygon>
            )}

            {role === 'inner' && block && (
              <text
                x={cx}
                y={cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={block.owner ? '#FFFFFF' : 'rgba(255,255,255,0.45)'}
                fontSize={R * 0.52}
                fontWeight="bold"
                fontFamily="'Inter', 'Helvetica Neue', sans-serif"
                letterSpacing="0"
                pointerEvents="none"
                style={{ transition: 'fill 0.4s ease' }}
              >
                {block.owner ? (block.owner === 'red' ? 'R' : 'B') : displayNum}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
