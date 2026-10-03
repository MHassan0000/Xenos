import { useEffect, useRef, useState } from "react";
import { runCommand, completeCommand } from "../core/terminal";
import { useDesktop } from "../core/context";
type Line = { input?: string; output: string; cwd?: string };
export default function Terminal() {
  const { open } = useDesktop();
  const [lines, setLines] = useState<Line[]>([
    {
      output:
        "HASSAN / PERSONAL SHELL\n\nA little curiosity goes a long way.\nType help to explore, or try open projects.\n",
    },
  ]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("/");
  const history = useRef<string[]>([]);
  const index = useRef(0);
  const draft = useRef("");
  const bottom = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [lines]);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = runCommand(input, cwd);
    if (input.trim()) {
      history.current.push(input);
      index.current = history.current.length;
    }
    setLines((prev) =>
      result.clear
        ? []
        : [...prev, { input, output: result.output, cwd }].slice(-250),
    );
    if (result.cwd) setCwd(result.cwd);
    if (result.open) open(result.open.app, result.open.arg);
    setInput("");
    draft.current = "";
  }
  return (
    <div
      className="terminal-app"
      onClick={(e) => {
        if (
          !(e.target as HTMLElement).closest("a,button") &&
          !window.getSelection()?.toString()
        )
          field.current?.focus();
      }}
    >
      <div className="terminal-tab">
        <span className="terminal-dot" />
        hassan@desktop: {cwd === "/" ? "~" : `~${cwd}`}
        <span>portfolio shell</span>
      </div>
      <div className="terminal-scroll">
        {lines.map((line, i) => (
          <div key={i} className="terminal-entry">
            {line.input !== undefined && (
              <div className="terminal-prompt">
                <span>
                  hassan<span className="muted">@</span>workspace
                </span>
                <span className="terminal-path">
                  {line.cwd === "/" ? "~" : `~${line.cwd}`}
                </span>
                <span className="muted">❯</span>
                <span className="terminal-command">{line.input}</span>
              </div>
            )}
            <pre>{line.output}</pre>
          </div>
        ))}
        <form className="terminal-input-row" onSubmit={submit}>
          <label htmlFor="terminal-input">
            <span>
              hassan<span className="muted">@</span>workspace
            </span>
            <span className="terminal-path">
              {cwd === "/" ? "~" : `~${cwd}`}
            </span>
            <span className="muted">❯</span>
          </label>
          <input
            id="terminal-input"
            ref={field}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Terminal command"
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                if (index.current === history.current.length)
                  draft.current = input;
                index.current = Math.max(0, index.current - 1);
                setInput(history.current[index.current] || "");
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                index.current = Math.min(
                  history.current.length,
                  index.current + 1,
                );
                setInput(history.current[index.current] ?? draft.current);
              }
              if (e.key === "Tab") {
                e.preventDefault();
                const matches = completeCommand(input, cwd);
                if (matches.length === 1) setInput(matches[0]);
                else if (matches.length)
                  setLines((l) => [...l, { output: matches.join("   ") }]);
              }
              if (e.ctrlKey && e.key === "l") {
                e.preventDefault();
                setLines([]);
              }
            }}
          />
        </form>
        <div ref={bottom} />
      </div>
      <footer className="app-status">
        <span>Virtual filesystem · Local session</span>
        <span>↑ ↓ History · Tab Complete</span>
      </footer>
    </div>
  );
}
