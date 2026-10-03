export function slideTiles(board: number[], direction: string) {
  const next = Array(16).fill(0) as number[];
  let score = 0;
  for (let line = 0; line < 4; line++) {
    const indices = Array.from({ length: 4 }, (_, i) =>
      direction === "ArrowLeft"
        ? line * 4 + i
        : direction === "ArrowRight"
          ? line * 4 + 3 - i
          : direction === "ArrowUp"
            ? i * 4 + line
            : (3 - i) * 4 + line,
    );
    const values = indices.map((i) => board[i]).filter(Boolean);
    const merged: number[] = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i] === values[i + 1]) {
        const n = values[i] * 2;
        merged.push(n);
        score += n;
        i++;
      } else merged.push(values[i]);
    }
    indices.forEach((idx, i) => (next[idx] = merged[i] || 0));
  }
  return { board: next, score, changed: next.some((n, i) => n !== board[i]) };
}
export function addTile(board: number[]) {
  const next = [...board],
    empty = next.flatMap((n, i) => (n ? [] : [i]));
  if (empty.length)
    next[empty[Math.floor(Math.random() * empty.length)]] =
      Math.random() < 0.9 ? 2 : 4;
  return next;
}
export const tilesOver = (board: number[]) =>
  ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].every(
    (d) => !slideTiles(board, d).changed,
  );
export type MineCell = {
  mine: boolean;
  open: boolean;
  flag: boolean;
  count: number;
};
export function mineNeighbors(index: number, size: number) {
  const x = index % size,
    y = Math.floor(index / size),
    out: number[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx,
        ny = y + dy;
      if ((dx || dy) && nx >= 0 && nx < size && ny >= 0 && ny < size)
        out.push(ny * size + nx);
    }
  return out;
}
export function createMines(
  size: number,
  count: number,
  safe: number,
): MineCell[] {
  const cells = Array.from({ length: size * size }, () => ({
    mine: false,
    open: false,
    flag: false,
    count: 0,
  }));
  const excluded = new Set([safe, ...mineNeighbors(safe, size)]);
  const candidates = cells.map((_, i) => i).filter((i) => !excluded.has(i));
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  candidates.slice(0, count).forEach((i) => (cells[i].mine = true));
  cells.forEach(
    (c, i) =>
      (c.count = mineNeighbors(i, size).filter((n) => cells[n].mine).length),
  );
  return cells;
}
export function revealMines(cells: MineCell[], index: number, size: number) {
  const next = cells.map((c) => ({ ...c })),
    stack = [index],
    seen = new Set<number>();
  while (stack.length) {
    const i = stack.pop()!;
    if (seen.has(i) || next[i].flag) continue;
    seen.add(i);
    next[i].open = true;
    if (!next[i].mine && !next[i].count)
      stack.push(...mineNeighbors(i, size).filter((n) => !next[n].mine));
  }
  return next;
}
export const BLOCKS = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
];
export type Piece = { shape: number[][]; x: number; y: number; color: number };
export const rotateBlock = (shape: number[][]) =>
  shape[0].map((_, i) => shape.map((row) => row[i]).reverse());
export function blockFits(board: number[][], p: Piece) {
  return p.shape.every((row, y) =>
    row.every(
      (v, x) =>
        !v ||
        (p.x + x >= 0 &&
          p.x + x < 10 &&
          p.y + y < 20 &&
          (p.y + y < 0 || !board[p.y + y][p.x + x])),
    ),
  );
}
export function lockBlock(board: number[][], p: Piece) {
  const next = board.map((r) => [...r]);
  p.shape.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v && p.y + y >= 0 && p.y + y < 20) next[p.y + y][p.x + x] = p.color;
    }),
  );
  const left = next.filter((row) => row.some((n) => !n)),
    lines = 20 - left.length;
  return {
    board: [...Array.from({ length: lines }, () => Array(10).fill(0)), ...left],
    lines,
  };
}
