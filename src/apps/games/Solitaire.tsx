import { useState } from "react";
import { GameToolbar, beep } from "./shared";
type Card = { s: number; r: number; up: boolean };
type State = {
  stock: Card[];
  waste: Card[];
  found: Card[][];
  tabs: Card[][];
  moves: number;
};
type Selection = {
  pile: "waste" | "tabs" | "found";
  index: number;
  at: number;
};
const suits = ["♠", "♥", "♦", "♣"],
  ranks = [
    "",
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];
const red = (c: Card) => c.s === 1 || c.s === 2;
const label = (c: Card) => ranks[c.r] + suits[c.s];
function deal(): State {
  const deck = Array.from({ length: 52 }, (_, i) => ({
    s: Math.floor(i / 13),
    r: (i % 13) + 1,
    up: false,
  }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const tabs = Array.from({ length: 7 }, (_, i) =>
    Array.from({ length: i + 1 }, () => deck.pop()!),
  );
  tabs.forEach((t) => (t.at(-1)!.up = true));
  return { stock: deck, waste: [], tabs, found: [[], [], [], []], moves: 0 };
}
function selectedCards(s: State, sel: Selection) {
  return sel.pile === "waste"
    ? s.waste.slice(-1)
    : s[sel.pile][sel.index].slice(sel.at);
}
function transfer(
  s: State,
  sel: Selection,
  target: "tabs" | "found",
  idx: number,
): State | null {
  if (sel.pile === target && sel.index === idx) return null;
  const cards = selectedCards(s, sel);
  if (!cards.length || cards.some((c) => !c.up)) return null;
  const c = cards[0],
    end = s[target][idx].at(-1);
  if (target === "found") {
    if (cards.length !== 1 || c.s !== idx || c.r !== (end?.r || 0) + 1)
      return null;
  } else if (end ? red(end) === red(c) || end.r !== c.r + 1 : c.r !== 13)
    return null;
  const n: State = JSON.parse(JSON.stringify(s));
  if (sel.pile === "waste") n.waste.pop();
  else {
    n[sel.pile][sel.index].splice(sel.at);
    if (sel.pile === "tabs" && n.tabs[sel.index].length)
      n.tabs[sel.index].at(-1)!.up = true;
  }
  n[target][idx].push(...cards);
  n.moves++;
  return n;
}
export default function Solitaire() {
  const [s, setS] = useState(deal);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [history, setHistory] = useState<State[]>([]);
  const [draw, setDraw] = useState(1);
  const [hint, setHint] = useState(
    "Select a card, then its destination. Double-click to send it to a foundation.",
  );
  const won = s.found.every((f) => f.length === 13);
  function commit(n: State) {
    setHistory((h) => [...h, s].slice(-150));
    setS(n);
    setSelected(null);
    beep(370, 0.025);
  }
  function move(sel: Selection, target: "tabs" | "found", idx: number) {
    const n = transfer(s, sel, target, idx);
    if (n) {
      commit(n);
      setHint(
        "Build down in alternating colors. Foundations build up by suit.",
      );
      return true;
    }
    return false;
  }
  function choose(sel: Selection) {
    if (selected && sel.pile !== "waste" && move(selected, sel.pile, sel.index))
      return;
    setSelected(sel);
  }
  function auto(sel: Selection) {
    const cards = selectedCards(s, sel);
    if (cards.length === 1) move(sel, "found", cards[0].s);
  }
  function drawCard() {
    const n: State = JSON.parse(JSON.stringify(s));
    if (n.stock.length) {
      for (let i = 0; i < draw && n.stock.length; i++)
        n.waste.push({ ...n.stock.pop()!, up: true });
    } else {
      n.stock = n.waste.reverse().map((c) => ({ ...c, up: false }));
      n.waste = [];
    }
    n.moves++;
    commit(n);
  }
  function showHint() {
    const sources: Selection[] = [];
    if (s.waste.length)
      sources.push({ pile: "waste", index: 0, at: s.waste.length - 1 });
    s.tabs.forEach((t, i) =>
      t.forEach((c, at) => {
        if (c.up) sources.push({ pile: "tabs", index: i, at });
      }),
    );
    for (const src of sources) {
      for (const target of ["found", "tabs"] as const)
        for (let i = 0; i < (target === "found" ? 4 : 7); i++) {
          if (transfer(s, src, target, i)) {
            setSelected(src);
            setHint(
              `Move ${label(selectedCards(s, src)[0])} to ${target === "found" ? suits[i] + " foundation" : s.tabs[i].length ? label(s.tabs[i].at(-1)!) : "empty column " + (i + 1)}.`,
            );
            return;
          }
        }
    }
    setHint(
      s.stock.length || s.waste.length
        ? "Draw from the stock to find another move."
        : "No available move. Undo a move or deal a new game.",
    );
  }
  function card(c: Card, sel: Selection, style?: React.CSSProperties) {
    const chosen =
      selected?.pile === sel.pile &&
      selected.index === sel.index &&
      selected.at === sel.at;
    return (
      <button
        key={`${c.s}-${c.r}`}
        style={style}
        className={`playing-card ${red(c) ? "red" : "black"} ${!c.up ? "face-down" : ""} ${chosen ? "chosen" : ""}`}
        aria-label={c.up ? label(c) : "Face-down card"}
        disabled={!c.up}
        onClick={() => choose(sel)}
        onDoubleClick={() => auto(sel)}
      >
        <span>
          {ranks[c.r]}
          <br />
          {suits[c.s]}
        </span>
        <b>{suits[c.s]}</b>
        <i>
          {ranks[c.r]}
          {suits[c.s]}
        </i>
      </button>
    );
  }
  return (
    <div className="solitaire-app">
      <GameToolbar
        title="Solitaire"
        score={`${s.moves} moves · ${s.found.reduce((n, f) => n + f.length, 0)}/52`}
        onNew={() => {
          setS(deal());
          setHistory([]);
          setSelected(null);
        }}
      >
        <select
          aria-label="Solitaire draw count"
          value={draw}
          onChange={(e) => setDraw(+e.target.value)}
        >
          <option value={1}>Draw 1</option>
          <option value={3}>Draw 3</option>
        </select>
        <button
          className="button"
          disabled={!history.length}
          onClick={() => {
            setS(history.at(-1)!);
            setHistory((h) => h.slice(0, -1));
            setSelected(null);
          }}
        >
          Undo
        </button>
        <button className="button" onClick={showHint}>
          Hint
        </button>
      </GameToolbar>
      <div className="solitaire-table">
        <div className="sol-top">
          <button
            className={`card-slot stock ${s.stock.length ? "has-stock" : ""}`}
            aria-label={
              s.stock.length
                ? `Draw card (${s.stock.length} remaining)`
                : "Recycle stock"
            }
            onClick={drawCard}
          >
            {s.stock.length ? <span>◇</span> : "↻"}
          </button>
          <div className="card-slot waste">
            {s.waste.length
              ? card(s.waste.at(-1)!, {
                  pile: "waste",
                  index: 0,
                  at: s.waste.length - 1,
                })
              : ""}
          </div>
          <div />
          {s.found.map((f, i) => (
            <div className="card-slot foundation" key={i}>
              <button
                className="foundation-target"
                aria-label={`${suits[i]} foundation`}
                onClick={() => {
                  if (selected) move(selected, "found", i);
                }}
              >
                {suits[i]}
              </button>
              {f.length > 0 &&
                card(f.at(-1)!, { pile: "found", index: i, at: f.length - 1 })}
            </div>
          ))}
        </div>
        <div className="sol-columns">
          {s.tabs.map((t, i) => (
            <div
              className="sol-column"
              key={i}
              style={{
                minHeight: `calc(var(--card-height) + ${Math.max(0, t.length - 1)} * var(--card-step))`,
              }}
            >
              <button
                className="card-slot column-target"
                aria-label={`Empty column ${i + 1}`}
                onClick={() => {
                  if (selected) move(selected, "tabs", i);
                }}
              >
                K
              </button>
              {t.map((c, at) =>
                card(
                  c,
                  { pile: "tabs", index: i, at },
                  { top: `calc(${at} * var(--card-step))`, zIndex: at + 1 },
                ),
              )}
            </div>
          ))}
        </div>
        {won && (
          <div className="solitaire-win">
            <h2>A clean table.</h2>
            <p>You solved it in {s.moves} moves.</p>
            <button
              className="button primary"
              onClick={() => {
                setS(deal());
                setHistory([]);
              }}
            >
              Deal again
            </button>
          </div>
        )}
      </div>
      <footer className="game-footer solitaire-hint">{hint}</footer>
    </div>
  );
}
