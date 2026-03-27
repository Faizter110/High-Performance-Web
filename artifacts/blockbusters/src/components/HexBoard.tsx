import React, { useState } from 'react';
import { BlockState } from '@workspace/api-client-react';

// ─── Hex geometry (pointy-top hexagons) ───────────────────────────────────────
const R = 42;                         // circumradius
const DX = Math.sqrt(3) * R;          // horizontal spacing between centers
const DY = 1.5 * R;                   // vertical spacing between row centers
const PAD = R * 0.6;                  // padding around the full grid

/**
 * Returns the SVG polygon points string for a pointy-top hex
 * centred at (cx, cy) with circumradius r.
 */
function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    // pointy-top: first vertex at the top (angle = -90°)
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Centre coordinates for a hex at (row, col) in the total grid */
function getCenter(row: number, col: number): { x: number; y: number } {
  const isOddRow = row % 2 !== 0;
  return {
    x: col * DX + (isOddRow ? DX / 2 : 0),
    y: row * DY,
  };
}

// ─── Grid cell classification ─────────────────────────────────────────────────
type CellRole = 'red-border' | 'blue-border' | 'inner' | 'empty';

/**
 * The board is rendered as a (size + 2) × (size + 2) grid.
 *   size=5 → 7×7  |  size=3 → 5×5
 *
 * Layout:
 *   - Corners (top-left, top-right, bottom-left, bottom-right) → empty
 *   - Top & bottom rows (excluding corners)                     → BLUE border
 *   - Left & right columns (excluding corners)                  → RED border
 *   - All remaining cells                                        → inner (playable)
 */
function cellRole(row: number, col: number, totalSize: number): CellRole {
  const last = totalSize - 1;
  const isCorner =
    (row === 0 || row === last) && (col === 0 || col === last);
  if (isCorner) return 'empty';
  if (row === 0 || row === last) return 'blue-border';
  if (col === 0 || col === last) return 'red-border';
  return 'inner';
}

/** Maps a grid (row, col) to the game block index (0-based) */
function toBlockIndex(row: number, col: number, innerSize: number): number {
  return (row - 1) * innerSize + (col - 1);
}

// ─── SVG dimensions ───────────────────────────────────────────────────────────
function calcViewBox(totalCols: number, totalRows: number) {
  // leftmost hex tip:  even-row col-0 center − DX/2
  const vbX = -DX / 2 - PAD;
  // topmost hex tip:   row-0 center − R
  const vbY = -R - PAD;
  // rightmost hex tip: odd-row last-col center + DX/2
  const vbW = (totalCols - 1) * DX + DX / 2 + DX + PAD * 2;
  // bottommost hex tip: last-row center + R
  const vbH = (totalRows - 1) * DY + 2 * R + PAD * 2;
  return `${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface HexBoardProps {
  size: number;                        // inner grid: 3 or 5
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
  const totalSize = size + 2;          // 5→7, 3→5
  const viewBox = calcViewBox(totalSize, totalSize);

  // Build the list of all visible cells
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
        {/* Glow filter for owned blocks */}
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
        const isOwnerRed  = block?.owner === 'Red';
        const isOwnerBlue = block?.owner === 'Blue';
        const isHovered   = hovered === blockIdx && interactive && !block?.owner;
        const isRedMP     = blockIdx !== undefined && redMatchPoints.includes(blockIdx);
        const isBlueMP    = blockIdx !== undefined && blueMatchPoints.includes(blockIdx);
        const isMP        = isRedMP || isBlueMP;

        // ── fill colour ──────────────────────────────────────────────────────
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
          // inner / playable
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
            {/* Main hex body */}
            <polygon
              points={hexPoints(cx, cy, R - 1.5)}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              filter={filter}
              style={{
                transition: 'fill 0.4s ease, filter 0.4s ease',
              }}
            />

            {/* Inner hex body highlight (3D effect) */}
            {(role === 'red-border' || role === 'blue-border') && (
              <polygon
                points={hexPoints(cx, cy - 2, R * 0.65)}
                fill="rgba(255,255,255,0.08)"
                stroke="none"
                pointerEvents="none"
              />
            )}

            {/* Match-point pulsing border */}
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

            {/* Label */}
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
                {block.owner ? (block.owner === 'Red' ? 'R' : 'B') : displayNum}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
