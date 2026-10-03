import test from "node:test";
import assert from "node:assert/strict";
import {
  slideTiles,
  tilesOver,
  createMines,
  revealMines,
  blockFits,
  lockBlock,
  rotateBlock,
} from "../src/core/gameLogic.ts";
test("2048 merges each tile once and scores the resulting pairs", () => {
  const r = slideTiles(
    [2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "ArrowLeft",
  );
  assert.deepEqual(r.board.slice(0, 4), [4, 4, 0, 0]);
  assert.equal(r.score, 8);
  assert.equal(
    slideTiles([4, 4, 8, 0, ...Array(12).fill(0)], "ArrowRight").board[3],
    8,
  );
});
test("2048 detects a full board with no legal moves", () => {
  assert.equal(
    tilesOver([2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2]),
    true,
  );
  assert.equal(tilesOver(Array(16).fill(2)), false);
});
test("Mines protects the first move and adjacent cells, with exact mine count", () => {
  const cells = createMines(9, 10, 40);
  assert.equal(cells.filter((c) => c.mine).length, 10);
  for (const i of [30, 31, 32, 39, 40, 41, 48, 49, 50])
    assert.equal(cells[i].mine, false);
  const open = revealMines(cells, 40, 9);
  assert.ok(open.filter((c) => c.open).length >= 9);
  assert.equal(
    open.some((c) => c.open && c.mine),
    false,
  );
});
test("Mines flood fill preserves flags", () => {
  const cells = createMines(9, 10, 40);
  cells[41].flag = true;
  assert.equal(revealMines(cells, 40, 9)[41].open, false);
});
test("Falling blocks enforce edges and clear completed rows", () => {
  const board = Array.from({ length: 20 }, () => Array(10).fill(0));
  const p = { shape: [[1, 1]], x: 9, y: 19, color: 1 };
  assert.equal(blockFits(board, p), false);
  board[19] = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0];
  const r = lockBlock(board, { ...p, x: 8 });
  assert.equal(r.lines, 1);
  assert.equal(r.board.length, 20);
  assert.deepEqual(r.board[0], Array(10).fill(0));
  assert.deepEqual(
    rotateBlock([
      [1, 0],
      [1, 1],
    ]),
    [
      [1, 1],
      [1, 0],
    ],
  );
});
