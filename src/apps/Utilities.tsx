import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { AppIcon } from "../components/Popovers";
import { registry } from "../core/registry";
import { useDesktop } from "../core/context";
import {
  useDocuments,
  getDocuments,
  saveDocument,
  trashDocument,
  restoreDocument,
  removeDocument,
  downloadText,
} from "../core/localFiles";
import { readStorage, saveStorage, STORAGE_KEY } from "../core/persistence";
export function Editor({ id }: { id?: string }) {
  const { notify } = useDesktop();
  const saved = getDocuments().find((d) => d.id === id && !d.deleted);
  const draft = useRef(
    readStorage<{ name: string; content: string } | null>(
      STORAGE_KEY + ":draft",
      null,
    ),
  );
  if (
    draft.current &&
    (typeof draft.current.name !== "string" ||
      typeof draft.current.content !== "string")
  )
    draft.current = null;
  const [name, setName] = useState(
    saved?.name ?? draft.current?.name ?? "Untitled.txt",
  );
  const [text, setText] = useState(
    saved?.content ?? draft.current?.content ?? "",
  );
  const [fileId, setFileId] = useState(saved?.id);
  const [dirty, setDirty] = useState(!saved && !!text);
  const [wrap, setWrap] = useState(true);
  const [status, setStatus] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (id) {
      const d = getDocuments().find((d) => d.id === id && !d.deleted);
      if (d) {
        if (dirty && fileId !== id && !saveDocument(name, text, fileId)) {
          setStatus(
            "Could not save the current draft. Download it before opening another document.",
          );
          return;
        }
        setName(d.name);
        setText(d.content);
        setFileId(d.id);
        setDirty(false);
      }
    }
  }, [id]);
  useEffect(() => {
    const persist = () =>
      saveStorage(STORAGE_KEY + ":draft", { name, content: text });
    const t = setTimeout(persist, 300);
    return () => {
      clearTimeout(t);
      persist();
    };
  }, [name, text]);
  function save() {
    const d = saveDocument(name, text, fileId);
    if (d) {
      setFileId(d.id);
      setName(d.name);
      setDirty(false);
      setStatus("Saved to Documents");
      notify(`${d.name} saved to Documents`);
    } else
      setStatus(
        "Storage is full or unavailable. Download a copy to keep your work.",
      );
  }
  return (
    <div
      className="editor-app"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          save();
        }
      }}
    >
      <div className="app-toolbar utility-toolbar">
        <button
          className="button"
          onClick={() => {
            if (dirty) {
              const d = saveDocument(name, text, fileId);
              if (!d) {
                notify(
                  "Save failed. Download your document before creating a new one.",
                );
                return;
              }
            }
            setText("");
            setName("Untitled.txt");
            setFileId(undefined);
            setDirty(false);
            setStatus("");
          }}
        >
          <Icon name="plus" size={14} />
          New
        </button>
        <button className="button" onClick={() => input.current?.click()}>
          Open…
        </button>
        <button className="button" onClick={save}>
          <Icon name="save" size={14} />
          Save
        </button>
        <button className="button" onClick={() => downloadText(name, text)}>
          <Icon name="download" size={14} />
          Download
        </button>
        <button
          className={wrap ? "button selected" : "button"}
          aria-pressed={wrap}
          onClick={() => setWrap(!wrap)}
        >
          Wrap
        </button>
        <input
          hidden
          ref={input}
          type="file"
          accept="text/*,.md,.json,.csv,.ts,.js,.css,.html"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 2_000_000) {
              notify("Please open a text file smaller than 2 MB.");
              return;
            }
            if (dirty && !saveDocument(name, text, fileId)) {
              notify("Save your current document first.");
              return;
            }
            setText(await f.text());
            setName(f.name);
            setFileId(undefined);
            setDirty(true);
          }}
        />
      </div>
      <div className="editor-filename">
        <Icon name="file" size={15} />
        <input
          aria-label="Document name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDirty(true);
          }}
        />
        {dirty && <span>Unsaved</span>}
        <span className="muted">Plain text</span>
      </div>
      <textarea
        className={wrap ? "" : "no-wrap"}
        aria-label="Document text"
        placeholder="Start writing…"
        spellCheck={false}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
          setStatus("");
        }}
      />
      <footer className="app-status">
        <span>
          {status ||
            `${text.split("\n").length} lines · ${text.length} characters`}
        </span>
        <span>UTF-8 · Local draft</span>
      </footer>
    </div>
  );
}
export function Trash() {
  const docs = useDocuments().filter((d) => d.deleted);
  const { notify, open } = useDesktop();
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <div className="trash-app">
      <div className="app-toolbar utility-toolbar">
        <Icon name="trash" />
        <strong>Trash</strong>
        <span className="flex" />
        <button
          className="button"
          disabled={!docs.length}
          onClick={() => setConfirm("all")}
        >
          Empty Trash
        </button>
      </div>
      {confirm && (
        <div className="inline-confirm">
          <span>
            Permanently delete{" "}
            {confirm === "all" ? "all trashed documents" : "this document"}?
          </span>
          <button
            className="button danger"
            onClick={() => {
              if (removeDocument(confirm === "all" ? undefined : confirm))
                notify("Trash cleared");
              else notify("Storage unavailable; nothing deleted.");
              setConfirm(null);
            }}
          >
            Delete permanently
          </button>
          <button className="button" onClick={() => setConfirm(null)}>
            Cancel
          </button>
        </div>
      )}
      <div className="scroll-area">
        {docs.map((d) => (
          <article className="local-file-row" key={d.id}>
            <Icon name="file" />
            <div>
              <strong>{d.name}</strong>
              <small>
                {d.content.length} characters ·{" "}
                {new Date(d.modified).toLocaleDateString()}
              </small>
            </div>
            <button
              className="button"
              onClick={() => {
                restoreDocument(d.id);
                notify(`${d.name} restored to Documents`);
              }}
            >
              Restore
            </button>
            <button
              className="icon-button"
              aria-label={`Delete ${d.name} permanently`}
              onClick={() => setConfirm(d.id)}
            >
              <Icon name="close" size={15} />
            </button>
          </article>
        ))}
        {!docs.length && (
          <div className="utility-empty">
            <Icon name="trash" size={46} />
            <h2>Nothing to take out.</h2>
            <p>
              Documents you delete from Files appear here.
              <br />
              You can restore them until you empty the trash.
            </p>
            <button
              className="button"
              onClick={() => open("files", "/Documents")}
            >
              Open Documents
            </button>
          </div>
        )}
      </div>
      <footer className="app-status">
        <span>{docs.length} items</span>
        <span>Local documents only</span>
      </footer>
    </div>
  );
}
export function Monitor() {
  const { windows, closeWindow, focusWindow } = useDesktop();
  const [tab, setTab] = useState("Applications");
  const docs = useDocuments();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 5000);
    return () => clearInterval(t);
  }, []);
  void tick;
  const count = windows.length;
  return (
    <div className="monitor-app">
      <div className="utility-tabs">
        {["Applications", "Resources"].map((t) => (
          <button
            className={tab === t ? "selected" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Applications" ? (
        <div className="scroll-area">
          <div className="monitor-heading">
            <span>APPLICATION</span>
            <span>STATE</span>
            <span>ACTIONS</span>
          </div>
          {windows.map((w) => (
            <div className="process-row" key={w.id}>
              <button onClick={() => focusWindow(w.id)}>
                <AppIcon app={w.app} />
                <span>
                  {registry[w.app].name}
                  <small>{w.arg?.split("/").pop() || w.id}</small>
                </span>
              </button>
              <span className="process-state">
                <i className={w.minimized ? "paused" : ""} />
                {w.minimized ? "Minimized" : "Open"}
              </span>
              <button className="button" onClick={() => closeWindow(w.id)}>
                End task
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="resources-pane">
          <div className="resource-tile">
            <Icon name="monitor" />
            <strong>{count}</strong>
            <span>Open application windows</span>
          </div>
          <div className="resource-tile">
            <Icon name="file" />
            <strong>{docs.filter((d) => !d.deleted).length}</strong>
            <span>Saved local documents</span>
          </div>
          <div className="resource-tile">
            <Icon name="globe" />
            <strong>{navigator.onLine ? "Online" : "Offline"}</strong>
            <span>Browser connection</span>
          </div>
          <div className="resource-tile">
            <Icon name="cpu" />
            <strong>{Math.round(performance.now() / 60000)} min</strong>
            <span>Page session uptime</span>
          </div>
          <p>
            These readings describe this workspace. The browser does not expose
            your computer’s process list, CPU usage, or disk capacity.
          </p>
        </div>
      )}
      <footer className="app-status">
        <span>{count} application windows</span>
        <span>Browser workspace</span>
      </footer>
    </div>
  );
}
export function Calculator() {
  const [value, setValue] = useState("0");
  const [previous, setPrevious] = useState<number | null>(null);
  const [op, setOp] = useState("");
  const [fresh, setFresh] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  function key(k: string) {
    if (k === "C") {
      setValue("0");
      setPrevious(null);
      setOp("");
      setFresh(true);
      return;
    }
    if (k === "⌫") {
      setValue((v) => (v.length > 1 ? v.slice(0, -1) : "0"));
      return;
    }
    if (k === "±") {
      setValue((v) => String(-Number(v)));
      return;
    }
    if (k === "%") {
      setValue((v) => String(Number(v) / 100));
      return;
    }
    if (/[0-9.]/.test(k) && k.length === 1) {
      setValue((v) =>
        fresh
          ? k === "."
            ? "0."
            : k
          : k === "." && v.includes(".")
            ? v
            : v === "0" && k !== "."
              ? k
              : (v + k).slice(0, 16),
      );
      setFresh(false);
      return;
    }
    const n = Number(value);
    if (!Number.isFinite(n)) {
      setValue("0");
      return;
    }
    if (previous !== null && op) {
      const result =
        op === "+"
          ? previous + n
          : op === "−"
            ? previous - n
            : op === "×"
              ? previous * n
              : n === 0
                ? NaN
                : previous / n;
      const str = Number.isFinite(result)
        ? String(Number(result.toPrecision(12)))
        : "Error";
      setHistory((h) => [`${previous} ${op} ${n} = ${str}`, ...h].slice(0, 6));
      setValue(str);
      setPrevious(k === "=" ? null : result);
    } else setPrevious(n);
    setOp(k === "=" ? "" : k);
    setFresh(true);
  }
  return (
    <div
      className="calculator-app"
      tabIndex={0}
      onKeyDown={(e) => {
        const map: Record<string, string> = {
          Enter: "=",
          Escape: "C",
          Backspace: "⌫",
          "*": "×",
          "/": "÷",
          "-": "−",
        };
        const k = map[e.key] || e.key;
        if (
          /^[0-9.+%]$/.test(k) ||
          ["=", "C", "⌫", "×", "÷", "−"].includes(k)
        ) {
          e.preventDefault();
          key(k);
        }
      }}
    >
      <div className="calculator-display">
        <small>
          {previous !== null && op ? `${previous} ${op}` : "Standard"}
        </small>
        <output aria-live="polite">{value}</output>
      </div>
      <div className="calculator-keys">
        {[
          "C",
          "±",
          "%",
          "÷",
          "7",
          "8",
          "9",
          "×",
          "4",
          "5",
          "6",
          "−",
          "1",
          "2",
          "3",
          "+",
          "⌫",
          "0",
          ".",
          "=",
        ].map((k) => (
          <button
            key={k}
            className={k === "=" ? "equals" : ""}
            onClick={() => key(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="calc-history" aria-label="Calculation history">
        {history.slice(0, 2).map((h, i) => (
          <span key={i}>{h}</span>
        ))}
      </div>
    </div>
  );
}
