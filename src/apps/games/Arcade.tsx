import { useEffect, useRef, useState } from "react";
import {
  addTile,
  slideTiles,
  tilesOver,
  createMines,
  revealMines,
  mineNeighbors,
  type MineCell,
  BLOCKS,
  rotateBlock,
  blockFits,
  lockBlock,
  type Piece,
} from "../../core/gameLogic";
import {
  GameToolbar,
  DirectionPad,
  useGameKeys,
  bestScore,
  beep,
} from "./shared";
import { Icon } from "../../components/Icon";
export default function Arcade({
  game,
  active,
}: {
  game: "2048" | "mines" | "snake" | "brickfall";
  active: boolean;
}) {
  return game === "2048" ? (
    <Tiles active={active} />
  ) : game === "mines" ? (
    <Mines active={active} />
  ) : game === "snake" ? (
    <Snake active={active} />
  ) : (
    <Brickfall active={active} />
  );
}
function Tiles({ active }: { active: boolean }) {
  const initial = () => addTile(addTile(Array(16).fill(0)));
  const [board, setBoard] = useState(initial);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => bestScore("2048"));
  const [undo, setUndo] = useState<{ board: number[]; score: number } | null>(
    null,
  );
  const [won, setWon] = useState(false);
  const touch = useRef({ x: 0, y: 0 });
  function move(key: string) {
    if (!key.startsWith("Arrow")) return false;
    const next = slideTiles(board, key);
    if (next.changed) {
      setUndo({ board, score });
      setBoard(addTile(next.board));
      setScore(score + next.score);
      setBest(bestScore("2048", score + next.score));
      if (next.score) beep(330 + Math.min(next.score, 600), 0.06);
    }
    return true;
  }
  const keys = useGameKeys(active, move);
  const over = tilesOver(board);
  return (
    <div className="arcade-app tiles-app" {...keys}>
      <GameToolbar
        title="2048"
        score={`Score ${score} · Best ${best}`}
        onNew={() => {
          setBoard(initial());
          setScore(0);
          setUndo(null);
          setWon(false);
        }}
      >
        <button
          className="button"
          disabled={!undo}
          onClick={() => {
            if (undo) {
              setBoard(undo.board);
              setScore(undo.score);
              setUndo(null);
            }
          }}
        >
          Undo
        </button>
      </GameToolbar>
      <div className="tiles-intro">
        <strong>Small moves. Big numbers.</strong>
        <p>Combine matching tiles to reach 2048.</p>
      </div>
      <div
        className="tiles-stage"
        onPointerDown={(e) => {
          touch.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          const dx = e.clientX - touch.current.x,
            dy = e.clientY - touch.current.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) > 20)
            move(
              Math.abs(dx) > Math.abs(dy)
                ? dx > 0
                  ? "ArrowRight"
                  : "ArrowLeft"
                : dy > 0
                  ? "ArrowDown"
                  : "ArrowUp",
            );
        }}
      >
        <div className="tiles-board">
          {board.map((n, i) => (
            <div
              key={i}
              className={`number-tile tile-${n}`}
              aria-label={n ? String(n) : "Empty tile"}
            >
              {n || ""}
            </div>
          ))}
        </div>
        {(over || (!won && board.includes(2048))) && (
          <div className="tile-message">
            <strong>{over ? "No moves left" : "2048. Nicely done."}</strong>
            {!over && (
              <button className="button" onClick={() => setWon(true)}>
                Keep playing
              </button>
            )}
          </div>
        )}
      </div>
      <DirectionPad onMove={move} />
      <footer className="game-footer">
        Arrow keys or swipe to move · One-step undo
      </footer>
    </div>
  );
}
function Mines({ active }: { active: boolean }) {
  const [size, setSize] = useState(9);
  const count = size === 9 ? 10 : 24;
  const blank = () =>
    Array.from({ length: size * size }, () => ({
      mine: false,
      open: false,
      flag: false,
      count: 0,
    }));
  const [cells, setCells] = useState<MineCell[]>(blank);
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState("ready");
  const [flagMode, setFlagMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const reset = () => {
    setCells(blank());
    setStarted(false);
    setStatus("ready");
    setSeconds(0);
  };
  useEffect(reset, [size]);
  useEffect(() => {
    if (!active || status !== "playing") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active, status]);
  function reveal(index: number) {
    if (status === "lost" || status === "won" || cells[index].flag) return;
    let next = started ? cells : createMines(size, count, index);
    if (!started) {
      next = next.map((c, i) => ({ ...c, flag: cells[i].flag }));
      setStarted(true);
      setStatus("playing");
    }
    if (next[index].open) {
      const ns = mineNeighbors(index, size);
      if (ns.filter((n) => next[n].flag).length === next[index].count) {
        for (const n of ns)
          if (!next[n].flag) next = revealMines(next, n, size);
      }
    } else next = revealMines(next, index, size);
    if (next.some((c) => c.mine && c.open)) {
      setStatus("lost");
      beep(100, 0.2);
      next = next.map((c) => (c.mine ? { ...c, open: true } : c));
    } else if (
      next.filter((c) => !c.mine && c.open).length ===
      size * size - count
    ) {
      setStatus("won");
      beep(800, 0.2);
      next = next.map((c) => (c.mine ? { ...c, flag: true } : c));
    }
    setCells(next);
  }
  function flag(index: number) {
    if (cells[index].open || ["lost", "won"].includes(status)) return;
    setCells((cs) =>
      cs.map((c, i) => (i === index ? { ...c, flag: !c.flag } : c)),
    );
  }
  return (
    <div className="arcade-app mines-app">
      <GameToolbar
        title="Mines"
        score={`${count - cells.filter((c) => c.flag).length} mines · ${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}
        onNew={reset}
      >
        <select
          aria-label="Mines difficulty"
          value={size}
          onChange={(e) => setSize(+e.target.value)}
        >
          <option value="9">Beginner</option>
          <option value="12">Intermediate</option>
        </select>
      </GameToolbar>
      <div className="mines-caption">
        <Icon
          name={
            status === "lost" ? "bomb" : status === "won" ? "check" : "search"
          }
          size={27}
        />
        <h2>
          {status === "lost"
            ? "That was a mine."
            : status === "won"
              ? "A clean sweep."
              : "A little careful thinking."}
        </h2>
        <p>
          {status === "ready"
            ? "Your first move is always safe."
            : status === "lost"
              ? "New game, fresh start."
              : "Right-click to flag. Click a number to clear its flagged neighbors."}
        </p>
      </div>
      <div
        className="mines-board"
        style={{ gridTemplateColumns: `repeat(${size},1fr)` }}
      >
        {cells.map((c, i) => (
          <button
            key={i}
            className={`${c.open ? "revealed" : ""} n-${c.count} ${c.open && c.mine ? "mine-hit" : ""}`}
            aria-label={`Row ${Math.floor(i / size) + 1}, column ${(i % size) + 1}: ${c.flag ? "flagged" : !c.open ? "covered" : c.mine ? "mine" : c.count || "empty"}`}
            onClick={() => (flagMode ? flag(i) : reveal(i))}
            onContextMenu={(e) => {
              e.preventDefault();
              flag(i);
            }}
          >
            {c.flag ? (
              "⚑"
            ) : c.open ? (
              c.mine ? (
                <Icon name="bomb" size={16} />
              ) : (
                c.count || ""
              )
            ) : (
              ""
            )}
          </button>
        ))}
      </div>
      <button
        className={`button flag-toggle ${flagMode ? "selected" : ""}`}
        aria-pressed={flagMode}
        onClick={() => setFlagMode(!flagMode)}
      >
        ⚑ Flag mode {flagMode ? "on" : "off"}
      </button>
      <footer className="game-footer">
        {status === "won"
          ? "All safe cells uncovered!"
          : "Touch: enable Flag mode to place flags"}
      </footer>
    </div>
  );
}
type Point = { x: number; y: number };
const snakeStart = [
  { x: 7, y: 8 },
  { x: 6, y: 8 },
  { x: 5, y: 8 },
];
function Snake({ active }: { active: boolean }) {
  const [snake, setSnake] = useState<Point[]>(snakeStart);
  const [food, setFood] = useState({ x: 12, y: 8 });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => bestScore("snake"));
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const dir = useRef({ x: 1, y: 0 }),
    nextDir = useRef({ x: 1, y: 0 });
  const state = useRef({ snake, food, score });
  state.current = { snake, food, score };
  function reset() {
    setSnake(snakeStart);
    setFood({ x: 12, y: 8 });
    setScore(0);
    setOver(false);
    setRunning(true);
    dir.current = { x: 1, y: 0 };
    nextDir.current = { x: 1, y: 0 };
  }
  function key(k: string) {
    if (k === " " || k.toLowerCase() === "p") {
      setRunning((r) => !r);
      return true;
    }
    const d: Record<string, Point> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };
    const p = d[k];
    if (!p) return false;
    if (p.x !== -dir.current.x || p.y !== -dir.current.y) nextDir.current = p;
    return true;
  }
  const keys = useGameKeys(active, key);
  useEffect(() => {
    if (!running || !active || over) return;
    const timer = setInterval(
      () => {
        const s = state.current;
        dir.current = nextDir.current;
        const head = {
          x: s.snake[0].x + dir.current.x,
          y: s.snake[0].y + dir.current.y,
        };
        const eats = head.x === s.food.x && head.y === s.food.y;
        const body = eats ? s.snake : s.snake.slice(0, -1);
        if (
          head.x < 0 ||
          head.x >= 20 ||
          head.y < 0 ||
          head.y >= 20 ||
          body.some((p) => p.x === head.x && p.y === head.y)
        ) {
          setOver(true);
          setRunning(false);
          beep(100, 0.2);
          return;
        }
        const next = [head, ...s.snake];
        if (!eats) next.pop();
        else {
          const value = s.score + 10;
          setScore(value);
          setBest(bestScore("snake", value));
          beep(700, 0.05);
          const spaces = Array.from({ length: 400 }, (_, i) => ({
            x: i % 20,
            y: Math.floor(i / 20),
          })).filter((p) => !next.some((n) => n.x === p.x && n.y === p.y));
          if (!spaces.length) {
            setOver(true);
            setRunning(false);
          } else setFood(spaces[Math.floor(Math.random() * spaces.length)]);
        }
        setSnake(next);
      },
      Math.max(65, 140 - score / 4),
    );
    return () => clearInterval(timer);
  }, [running, active, over, score]);
  const map = new Set(snake.map((p) => p.y * 20 + p.x));
  return (
    <div className="arcade-app snake-app" {...keys}>
      <GameToolbar
        title="Snake"
        score={`Score ${score} · Best ${best}`}
        paused={!running}
        onPause={() => setRunning((r) => !r)}
        onNew={reset}
      />
      <div className="snake-stage">
        <div className="snake-board">
          {Array.from({ length: 400 }, (_, i) => (
            <span
              key={i}
              className={
                i === snake[0].y * 20 + snake[0].x
                  ? "snake-head"
                  : map.has(i)
                    ? "snake-body"
                    : i === food.y * 20 + food.x
                      ? "snake-food"
                      : ""
              }
            />
          ))}
        </div>
        {(!running || !active || over) && (
          <div className="game-pause">
            <Icon name="snake" size={35} />
            <h2>
              {over
                ? "Game over"
                : !running && !score
                  ? "A familiar obsession."
                  : "Paused"}
            </h2>
            <p>Eat. Grow. Don’t run into yourself.</p>
            <button
              className="button primary"
              onClick={() => (over ? reset() : setRunning(true))}
            >
              {over ? "Play again" : "Let’s play"}
            </button>
          </div>
        )}
      </div>
      <DirectionPad onMove={key} />
      <footer className="game-footer">
        Arrow keys to steer · Space to pause
      </footer>
    </div>
  );
}
type BlocksState = {
  board: number[][];
  piece: Piece;
  next: number;
  score: number;
  lines: number;
  over: boolean;
};
const randomBlock = () => Math.floor(Math.random() * 7);
const piece = (n: number): Piece => ({
  shape: BLOCKS[n],
  x: 3,
  y: 0,
  color: n + 1,
});
const newBlocks = (): BlocksState => ({
  board: Array.from({ length: 20 }, () => Array(10).fill(0)),
  piece: piece(randomBlock()),
  next: randomBlock(),
  score: 0,
  lines: 0,
  over: false,
});
function drop(s: BlocksState): BlocksState {
  const p = { ...s.piece, y: s.piece.y + 1 };
  if (blockFits(s.board, p)) return { ...s, piece: p };
  const result = lockBlock(s.board, s.piece),
    nextPiece = piece(s.next);
  return {
    ...s,
    board: result.board,
    piece: nextPiece,
    next: randomBlock(),
    score:
      s.score +
      [0, 100, 300, 500, 800][result.lines] * (1 + Math.floor(s.lines / 10)),
    lines: s.lines + result.lines,
    over: !blockFits(result.board, nextPiece),
  };
}
function Brickfall({ active }: { active: boolean }) {
  const [s, setS] = useState(newBlocks);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState(() => bestScore("brickfall"));
  useEffect(() => {
    setBest(bestScore("brickfall", s.score));
  }, [s.score]);
  useEffect(() => {
    if (!active || !running || s.over) return;
    const t = setInterval(
      () => setS(drop),
      Math.max(100, 650 - Math.floor(s.lines / 10) * 60),
    );
    return () => clearInterval(t);
  }, [active, running, s.over, s.lines]);
  function key(k: string) {
    if (k.toLowerCase() === "p") {
      setRunning((r) => !r);
      return true;
    }
    if (!["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(k))
      return false;
    if (!running || s.over) return true;
    if (k === "ArrowDown") setS(drop);
    else if (k === " ") {
      setS((v) => {
        let p = v.piece,
          steps = 0;
        while (blockFits(v.board, { ...p, y: p.y + 1 })) {
          p = { ...p, y: p.y + 1 };
          steps++;
        }
        return drop({ ...v, piece: p, score: v.score + steps * 2 });
      });
      beep(250, 0.04);
    } else
      setS((v) => {
        let p = { ...v.piece };
        if (k === "ArrowUp") {
          p.shape = rotateBlock(p.shape);
          const kicks = [0, -1, 1, -2, 2];
          for (const x of kicks) {
            const candidate = { ...p, x: p.x + x };
            if (blockFits(v.board, candidate))
              return { ...v, piece: candidate };
          }
          return v;
        }
        p.x += k === "ArrowLeft" ? -1 : 1;
        return blockFits(v.board, p) ? { ...v, piece: p } : v;
      });
    return true;
  }
  const keys = useGameKeys(active, key);
  const visible = s.board.map((r) => [...r]);
  let ghost = { ...s.piece };
  while (blockFits(s.board, { ...ghost, y: ghost.y + 1 }))
    ghost = { ...ghost, y: ghost.y + 1 };
  ghost.shape.forEach((row, y) =>
    row.forEach((v, x) => {
      if (
        v &&
        ghost.y + y >= 0 &&
        ghost.y + y < 20 &&
        !visible[ghost.y + y][ghost.x + x]
      )
        visible[ghost.y + y][ghost.x + x] = -1;
    }),
  );
  s.piece.shape.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v && s.piece.y + y >= 0 && s.piece.y + y < 20)
        visible[s.piece.y + y][s.piece.x + x] = s.piece.color;
    }),
  );
  return (
    <div className="arcade-app brickfall-app" {...keys}>
      <GameToolbar
        title="Brickfall"
        score={`Score ${s.score} · Best ${best}`}
        onNew={() => {
          setS(newBlocks());
          setRunning(true);
        }}
        paused={!running}
        onPause={() => setRunning((r) => !r)}
      />
      <div className="brickfall-stage">
        <div className="block-board">
          {visible.flatMap((r, y) =>
            r.map((v, x) => (
              <span key={y * 10 + x} className={`block block-${v}`} />
            )),
          )}
        </div>
        <aside className="block-stats">
          <span>NEXT</span>
          <div
            className="next-block"
            style={{
              gridTemplateColumns: `repeat(${BLOCKS[s.next][0].length},16px)`,
            }}
          >
            {BLOCKS[s.next].flatMap((r, y) =>
              r.map((v, x) => (
                <i key={y * 4 + x} className={v ? `block-${s.next + 1}` : ""} />
              )),
            )}
          </div>
          <span>LINES</span>
          <strong>{s.lines}</strong>
          <span>LEVEL</span>
          <strong>{1 + Math.floor(s.lines / 10)}</strong>
        </aside>
        {(!running || !active || s.over) && (
          <div className="game-pause">
            <Icon name="blocks" size={32} />
            <h2>{s.over ? "Stack complete." : "Find your rhythm."}</h2>
            <p>Fill a row. Clear a line. Keep it going.</p>
            <button
              className="button primary"
              onClick={() => {
                if (s.over) setS(newBlocks());
                setRunning(true);
              }}
            >
              {s.over ? "Play again" : "Start / resume"}
            </button>
          </div>
        )}
      </div>
      <div className="block-controls">
        <DirectionPad onMove={key} />
        <button className="button" onClick={() => key(" ")}>
          Drop ↓
        </button>
      </div>
      <footer className="game-footer">
        ← → Move · ↑ Rotate · ↓ Soft drop · Space Drop · P Pause
      </footer>
    </div>
  );
}
