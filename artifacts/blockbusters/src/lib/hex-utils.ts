import { BlockState } from "@workspace/api-client-react";

// Standard Hex Grid Math (Odd-Q / Odd-Row based depending on orientation)
// For Blockbusters, typical is columns connected for Red, rows for Blue.
// We use a simple flat array representing a grid of size x size.
// To interlock, odd rows are shifted.

export function getNeighbors(index: number, size: number): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const neighbors: number[] = [];

  const isEvenRow = row % 2 === 0;

  // Directions depending on row parity (assuming pointy topped hexes, offset rows)
  const dirsEven = [
    [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
  ];
  const dirsOdd = [
    [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
  ];

  const dirs = isEvenRow ? dirsEven : dirsOdd;

  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
      neighbors.push(nr * size + nc);
    }
  }

  return neighbors;
}

// Simple BFS to check if a team has won
export function checkWin(blocks: BlockState[], size: number, team: 'Red' | 'Blue'): boolean {
  if (blocks.length === 0) return false;
  
  const teamBlocks = blocks.filter(b => b.owner === team).map(b => b.index);
  if (teamBlocks.length === 0) return false;

  const queue: number[] = [];
  const visited = new Set<number>();

  // Initialize queue with starting nodes
  if (team === 'Red') {
    // Red wins left to right (Col 0 to Col size-1)
    teamBlocks.forEach(idx => {
      if (idx % size === 0) {
        queue.push(idx);
        visited.add(idx);
      }
    });
  } else {
    // Blue wins top to bottom (Row 0 to Row size-1)
    teamBlocks.forEach(idx => {
      if (Math.floor(idx / size) === 0) {
        queue.push(idx);
        visited.add(idx);
      }
    });
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const row = Math.floor(curr / size);
    const col = curr % size;

    // Check win condition
    if (team === 'Red' && col === size - 1) return true;
    if (team === 'Blue' && row === size - 1) return true;

    const neighbors = getNeighbors(curr, size);
    for (const n of neighbors) {
      if (!visited.has(n) && teamBlocks.includes(n)) {
        visited.add(n);
        queue.push(n);
      }
    }
  }

  return false;
}

export function findMatchPoints(blocks: BlockState[], size: number): { red: number[], blue: number[] } {
  const redMatchPoints: number[] = [];
  const blueMatchPoints: number[] = [];

  const neutralBlocks = blocks.filter(b => !b.owner).map(b => b.index);

  for (const idx of neutralBlocks) {
    // Simulate Red taking it
    const simRed = [...blocks];
    const redBlock = simRed.find(b => b.index === idx);
    if (redBlock) redBlock.owner = 'Red';
    if (checkWin(simRed, size, 'Red')) redMatchPoints.push(idx);

    // Simulate Blue taking it
    const simBlue = [...blocks];
    const blueBlock = simBlue.find(b => b.index === idx);
    if (blueBlock) blueBlock.owner = 'Blue';
    if (checkWin(simBlue, size, 'Blue')) blueMatchPoints.push(idx);
  }

  return { red: redMatchPoints, blue: blueMatchPoints };
}
