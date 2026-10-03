import { useEffect, useRef, useState } from "react";
import {
  Chess as ChessRules,
  type Square,
  type Move,
  type PieceSymbol,
} from "chess.js";
import { GameToolbar, beep } from "./shared";
const symbols: Record<string, string> = {
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};
const names: Record<string, string> = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};
const weights: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};
function evaluate(g: ChessRules) {
  if (g.isCheckmate()) return g.turn() === "w" ? -100000 : 100000;
  if (g.isDraw()) return 0;
  return g
    .board()
    .flat()
    .reduce((score, p) => {
      if (!p) return score;
      const file = p.square.charCodeAt(0) - 97,
        rank = Number(p.square[1]) - 1;
      const center = 3.5 - Math.abs(3.5 - file) + (3.5 - Math.abs(3.5 - rank));
      const bonus =
        p.type === "p" ? (p.color === "w" ? rank : 7 - rank) * 7 : center * 6;
      return score + (p.color === "w" ? 1 : -1) * (weights[p.type] + bonus);
    }, 0);
}
function search(
  g: ChessRules,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (!depth || g.isGameOver()) return evaluate(g);
  const max = g.turn() === "w";
  let best = max ? -Infinity : Infinity;
  const moves = g
    .moves({ verbose: true })
    .sort(
      (a, b) =>
        (b.captured ? weights[b.captured] : 0) -
        (a.captured ? weights[a.captured] : 0),
    );
  for (const move of moves) {
    g.move(move);
    const value = search(g, depth - 1, alpha, beta);
    g.undo();
    best = max ? Math.max(best, value) : Math.min(best, value);
    if (max) alpha = Math.max(alpha, best);
    else beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}
function computerMove(g: ChessRules): Move | undefined {
  const moves = g.moves({ verbose: true });
  let best = Infinity;
  let selected: Move | undefined;
  for (const m of moves) {
    g.move(m);
    const value = search(g, 1, -Infinity, Infinity) + Math.random() * 3;
    g.undo();
    if (value < best) {
      best = value;
      selected = m;
    }
  }
  return selected;
}
export default function Chess({ active }: { active: boolean }) {
  const game = useRef(new ChessRules());
  const [fen, setFen] = useState(game.current.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [mode, setMode] = useState("computer");
  const [promotion, setPromotion] = useState<PieceSymbol>("q");
  const [flipped, setFlipped] = useState(false);
  const [thinking, setThinking] = useState(false);
  const g = game.current;
  const moves = selected ? g.moves({ square: selected, verbose: true }) : [];
  const history = g.history();
  function update() {
    setFen(g.fen());
    setSelected(null);
    beep(440, 0.03);
  }
  useEffect(() => {
    if (!active || mode !== "computer" || g.turn() !== "b" || g.isGameOver()) {
      setThinking(false);
      return;
    }
    setThinking(true);
    const t = setTimeout(() => {
      const move = computerMove(g);
      if (move) g.move(move);
      setThinking(false);
      update();
    }, 350);
    return () => clearTimeout(t);
  }, [fen, mode, active]);
  function click(square: Square) {
    if (g.isGameOver() || (mode === "computer" && g.turn() === "b")) return;
    if (selected && moves.some((m) => m.to === square)) {
      try {
        g.move({ from: selected, to: square, promotion });
        update();
        return;
      } catch {
        /* select a different piece */
      }
    }
    const p = g.get(square);
    setSelected(p?.color === g.turn() ? square : null);
  }
  const squares = Array.from(
    { length: 64 },
    (_, i) =>
      `${String.fromCharCode(97 + (i % 8))}${8 - Math.floor(i / 8)}` as Square,
  );
  if (flipped) squares.reverse();
  const status = g.isCheckmate()
    ? `${g.turn() === "w" ? "Black" : "White"} wins by checkmate`
    : g.isDraw()
      ? "Draw"
      : thinking
        ? "Computer is thinking…"
        : `${g.turn() === "w" ? "White" : "Black"} to move${g.isCheck() ? " · Check" : ""}`;
  return (
    <div className="chess-app">
      <GameToolbar
        title="Chess"
        score={status}
        onNew={() => {
          g.reset();
          update();
        }}
      >
        <select
          aria-label="Chess opponent"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="computer">Computer</option>
          <option value="friend">Local two-player</option>
        </select>
        <button
          className="button"
          disabled={!history.length || thinking}
          onClick={() => {
            g.undo();
            if (mode === "computer" && g.turn() === "b") g.undo();
            update();
          }}
        >
          Undo
        </button>
      </GameToolbar>
      <div className="chess-scroll">
        <div className="chess-board" role="group" aria-label="Chess board">
          {squares.map((sq, i) => {
            const p = g.get(sq),
              legal = moves.some((m) => m.to === sq);
            return (
              <button
                key={sq}
                className={`chess-square ${(Math.floor(i / 8) + (i % 8)) % 2 ? "dark" : "light"} ${selected === sq ? "selected" : ""} ${legal ? "legal" : ""}`}
                aria-label={`${sq}${p ? `: ${p.color === "w" ? "white" : "black"} ${names[p.type]}` : ": empty"}${legal ? ", legal move" : ""}`}
                onClick={() => click(sq)}
              >
                <span
                  className={p?.color === "w" ? "white-piece" : "black-piece"}
                >
                  {p ? symbols[p.type] : ""}
                </span>
                {i % 8 === 0 && <small className="rank-label">{sq[1]}</small>}
                {i >= 56 && <small className="file-label">{sq[0]}</small>}
              </button>
            );
          })}
        </div>
        <div className="chess-options">
          <button className="button" onClick={() => setFlipped((f) => !f)}>
            Flip board
          </button>
          <label>
            Promote to{" "}
            <select
              aria-label="Pawn promotion"
              value={promotion}
              onChange={(e) => setPromotion(e.target.value as PieceSymbol)}
            >
              <option value="q">Queen</option>
              <option value="r">Rook</option>
              <option value="b">Bishop</option>
              <option value="n">Knight</option>
            </select>
          </label>
        </div>
        <div className="chess-moves" aria-label="Move history">
          {!history.length ? (
            <span>Select a piece to see its legal moves.</span>
          ) : (
            Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => (
              <span key={i}>
                <b>{i + 1}.</b> {history[i * 2]} {history[i * 2 + 1] || ""}
              </span>
            ))
          )}
        </div>
      </div>
      <footer className="game-footer">
        {status} · Castling, en passant & promotion supported
      </footer>
    </div>
  );
}
