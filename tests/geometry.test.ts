import test from "node:test";
import assert from "node:assert/strict";
import {
  fitRect,
  modeRect,
  resizedRect,
  workArea,
} from "../src/core/geometry.ts";
test("saved windows fit smaller viewports and keep all controls reachable", () => {
  const area = workArea(800, 600);
  const r = fitRect({ x: 1400, y: 900, w: 1100, h: 900 }, area);
  assert.equal(r.x, 8);
  assert.equal(r.y, 44);
  assert.equal(r.w, 784);
  assert.equal(r.h, 474);
});
test("snapping splits the work area with a gap without modifying restore geometry", () => {
  const area = workArea(1440, 900);
  const original = { x: 300, y: 120, w: 800, h: 560 };
  const copy = { ...original };
  const left = modeRect("left", original, area);
  const right = modeRect("right", original, area);
  assert.equal(left.w, right.w);
  assert.equal(right.x - left.x - left.w, 6);
  assert.deepEqual(original, copy);
  assert.deepEqual(modeRect("normal", original, area), original);
});
test("west and north resize anchor the opposing edges and enforce minimum size", () => {
  const a = workArea(1440, 900);
  const r = { x: 300, y: 150, w: 800, h: 500 };
  const shrunk = resizedRect(r, 900, 900, "nw", a);
  assert.equal(shrunk.w, 380);
  assert.equal(shrunk.h, 260);
  assert.equal(shrunk.x + shrunk.w, r.x + r.w);
  assert.equal(shrunk.y + shrunk.h, r.y + r.h);
});
test("resizing cannot move a titlebar out of the work area", () => {
  const a = workArea(1000, 750);
  const r = { x: 200, y: 100, w: 700, h: 450 };
  const enlarged = resizedRect(r, -900, -900, "nw", a);
  assert.equal(enlarged.x, a.x);
  assert.equal(enlarged.y, a.y);
  assert.equal(enlarged.x + enlarged.w, 900);
});
