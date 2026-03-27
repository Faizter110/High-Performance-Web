export type BlockOwner = "red" | "blue" | null;

export interface Block {
  index: number;
  owner: BlockOwner;
  isMatchPoint: boolean;
  questionId?: number | null;
}

function getNeighbors(index: number, size: number): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const neighbors: number[] = [];

  const dirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1],
    [1, -1], [1, 1],
  ];

  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
      neighbors.push(nr * size + nc);
    }
  }
  return neighbors;
}

export function bfsDistance(
  blocks: Block[],
  team: "red" | "blue",
  size: number
): number {
  const blockMap = new Map(blocks.map((b) => [b.index, b]));

  const starts: number[] = [];
  const goals = new Set<number>();

  if (team === "red") {
    for (let row = 0; row < size; row++) {
      starts.push(row * size + 0);
      goals.add(row * size + (size - 1));
    }
  } else {
    for (let col = 0; col < size; col++) {
      starts.push(0 * size + col);
      goals.add((size - 1) * size + col);
    }
  }

  const queue: Array<{ idx: number; dist: number }> = [];
  const visited = new Set<number>();

  for (const s of starts) {
    const b = blockMap.get(s);
    if (b?.owner === team || !b?.owner) {
      const cost = b?.owner === team ? 0 : 1;
      queue.push({ idx: s, dist: cost });
    }
  }

  queue.sort((a, b) => a.dist - b.dist);

  while (queue.length > 0) {
    const { idx, dist } = queue.shift()!;
    if (visited.has(idx)) continue;
    visited.add(idx);

    if (goals.has(idx)) return dist;

    for (const neighbor of getNeighbors(idx, size)) {
      if (visited.has(neighbor)) continue;
      const nb = blockMap.get(neighbor);
      if (nb?.owner && nb.owner !== team) continue;
      const cost = nb?.owner === team ? 0 : 1;
      queue.push({ idx: neighbor, dist: dist + cost });
    }
  }

  return Infinity;
}

export function isMatchPoint(
  blocks: Block[],
  blockIndex: number,
  team: "red" | "blue",
  size: number
): boolean {
  const testBlocks = blocks.map((b) =>
    b.index === blockIndex ? { ...b, owner: team } : b
  );

  const distBefore = bfsDistance(blocks, team, size);
  const distAfter = bfsDistance(testBlocks, team, size);

  return distAfter === 0 && distBefore > 0;
}

export function checkWinner(
  blocks: Block[],
  size: number
): "red" | "blue" | null {
  if (bfsDistance(blocks, "red", size) === 0) return "red";
  if (bfsDistance(blocks, "blue", size) === 0) return "blue";
  return null;
}

export function computeMatchPoints(blocks: Block[], size: number): Block[] {
  return blocks.map((b) => ({
    ...b,
    isMatchPoint:
      !b.owner &&
      (isMatchPoint(blocks, b.index, "red", size) ||
        isMatchPoint(blocks, b.index, "blue", size)),
  }));
}

export function initBlocks(size: number): Block[] {
  const total = size * size;
  const blocks: Block[] = [];
  for (let i = 0; i < total; i++) {
    blocks.push({ index: i, owner: null, isMatchPoint: false, questionId: null });
  }
  return computeMatchPoints(blocks, size);
}
