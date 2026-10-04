import { useEffect, useState } from "react";
import {
  childrenOf,
  getFile,
  normalizePath,
  type FileNode,
} from "../core/filesystem";
import { useDesktop } from "../core/context";
import { Icon } from "../components/Icon";
import { projects } from "../data/portfolio";
import { isApp } from "../core/registry";
import { useDocuments, trashDocument } from "../core/localFiles";
import {
  createSessionFolder,
  createSessionTextFile,
  removeSessionEntry,
  useSessionEntries,
} from "../core/sessionFiles";
import { Popover } from "../components/Popovers";
function uniqueName(parent: string, requested: string) {
  const used = new Set(
    childrenOf(parent).map((entry) => entry.name.toLowerCase()),
  );
  const match = requested.match(/^(.*?)(\.[^.]+)?$/);
  const stem = match?.[1] || requested;
  const ext = match?.[2] || "";
  let name = requested;
  let count = 2;
  while (used.has(name.toLowerCase())) name = `${stem} (${count++})${ext}`;
  return name;
}
export default function Files({ initialPath = "/" }: { initialPath?: string }) {
  const { open, notify } = useDesktop();
  useDocuments();
  const sessionEntries = useSessionEntries();
  const [history, setHistory] = useState([
    getFile(initialPath)?.type === "folder" ? initialPath : "/",
  ]);
  const [cursor, setCursor] = useState(0);
  const [query, setQuery] = useState("");
  const [list, setList] = useState(false);
  const [context, setContext] = useState<{
    file: FileNode | null;
    x: number;
    y: number;
  } | null>(null);
  const [createMode, setCreateMode] = useState<"folder" | "file" | null>(null);
  const [draftName, setDraftName] = useState("");
  const path = history[cursor];
  function go(p: string) {
    if (getFile(p)?.type !== "folder") return;
    setHistory((h) => [...h.slice(0, cursor + 1), p]);
    setCursor((c) => c + 1);
    setQuery("");
  }
  useEffect(() => {
    if (getFile(initialPath)?.type === "folder") {
      setHistory([initialPath]);
      setCursor(0);
    }
  }, [initialPath]);
  const items = childrenOf(path).filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()),
  );
  function launch(f: FileNode) {
    if (f.type === "folder") go(f.path);
    else if (f.type === "session" && f.target) open("editor", f.target);
    else if (f.type === "app" && f.target && isApp(f.target)) open(f.target);
    else if (f.type === "local") open("editor", f.target);
    else if (f.type === "project") open("project", f.target);
    else if (f.type === "image") open("image", f.target);
    else if (f.type === "link")
      window.open(f.target, "_blank", "noopener,noreferrer");
    else if (f.name === "Resume.md") open("resume");
    else if (f.name === "Skills.md") open("skills");
    else if (f.name === "Contact.txt") open("contact");
    else if (f.name === "About.md") open("about");
    else open("document", f.path);
  }
  function startCreate(mode: "folder" | "file") {
    setContext(null);
    setDraftName(mode === "folder" ? "New Folder" : "Untitled.txt");
    setCreateMode(mode);
  }
  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const requested = draftName.trim();
    if (!requested) return;
    if (createMode === "folder") {
      const entry = createSessionFolder(path, uniqueName(path, requested));
      if (entry) notify(`${entry.name} created for this session`);
    } else {
      const fileName = /\.[^./\\]+$/.test(requested)
        ? requested
        : `${requested}.txt`;
      const entry = createSessionTextFile(path, uniqueName(path, fileName));
      if (entry?.target) {
        open("editor", entry.target);
        notify(`${entry.name} created for this session`);
      }
    }
    setCreateMode(null);
  }
  return (
    <div className="explorer-app">
      <div className="app-toolbar files-toolbar">
        <div className="nav-buttons">
          <button
            className="icon-button"
            aria-label="Back"
            disabled={cursor === 0}
            onClick={() => {
              setCursor((c) => c - 1);
              setQuery("");
            }}
          >
            <Icon name="left" />
          </button>
          <button
            className="icon-button"
            aria-label="Forward"
            disabled={cursor === history.length - 1}
            onClick={() => {
              setCursor((c) => c + 1);
              setQuery("");
            }}
          >
            <Icon name="right" />
          </button>
          <button
            className="icon-button"
            aria-label="Parent folder"
            disabled={path === "/"}
            onClick={() => go(normalizePath("..", path))}
          >
            <Icon name="up" size={16} />
          </button>
        </div>
        <div className="breadcrumbs">
          <button onClick={() => go("/")}>
            <Icon name="home" size={15} />
            Home
          </button>
          {path
            .split("/")
            .filter(Boolean)
            .map((seg, i, parts) => (
              <span key={seg}>
                <Icon name="right" size={12} />
                <button
                  onClick={() => go("/" + parts.slice(0, i + 1).join("/"))}
                >
                  {seg}
                </button>
              </span>
            ))}
        </div>
        <button
          className="icon-button"
          aria-label="File actions"
          onClick={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            setContext({
              file: null,
              x: Math.min(Math.max(8, box.left), innerWidth - 248),
              y: box.bottom + 5,
            });
          }}
        >
          <Icon name="plus" size={17} />
        </button>
        <button
          className="icon-button"
          aria-label={list ? "Switch to grid view" : "Switch to list view"}
          onClick={() => setList(!list)}
        >
          <Icon name={list ? "grid" : "menu"} size={16} />
        </button>
      </div>
      <div className="explorer-body">
        <aside className="explorer-sidebar">
          <span className="eyebrow">PLACES</span>
          {[
            "Home",
            "Projects",
            "Documents",
            "Downloads",
            "Pictures",
            "Games",
            "Links",
          ].map((name) => (
            <button
              key={name}
              className={`side-link ${(name === "Home" ? path === "/" : path === "/" + name) ? "selected" : ""}`}
              onClick={() => go(name === "Home" ? "/" : "/" + name)}
            >
              <Icon
                name={
                  name === "Home"
                    ? "home"
                    : name === "Pictures"
                      ? "image"
                      : name === "Links"
                        ? "link"
                        : name === "Documents"
                          ? "file"
                          : "folder"
                }
                size={17}
              />
              {name}
            </button>
          ))}
          <div className="sidebar-divider" />
          <button className="side-link" onClick={() => open("trash")}>
            <Icon name="trash" size={17} />
            Trash
          </button>
          <span className="eyebrow">WORKSPACE</span>
          <div className="virtual-drive">
            <Icon name="monitor" size={25} />
            <div>
              Personal Home<small>Portfolio & local files</small>
            </div>
          </div>
        </aside>
        <div
          className="files-main scroll-area"
          onContextMenu={(e) => {
            if ((e.target as HTMLElement).closest("input,button,.file-entry"))
              return;
            e.preventDefault();
            setContext({ file: null, x: e.clientX, y: e.clientY });
          }}
        >
          {path === "/Documents" && (
            <button
              className="button"
              style={{ marginBottom: 12 }}
              onClick={() => open("editor")}
            >
              <Icon name="plus" size={14} />
              New document
            </button>
          )}
          <label className="search-field">
            <Icon name="search" size={16} />
            <input
              aria-label="Search this folder"
              placeholder="Search this folder…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className={`file-grid ${list ? "file-list" : ""}`}>
            {items.map((f) => {
              const p =
                f.type === "project"
                  ? projects.find((p) => p.id === f.target)
                  : null;
              return (
                <div className="file-entry" key={f.path}>
                  <button
                    className="file-item"
                    key={f.path}
                    onClick={() => launch(f)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContext({
                        file: f,
                        x: Math.min(e.clientX, innerWidth - 245),
                        y: Math.min(e.clientY, innerHeight - 350),
                      });
                    }}
                    title={p?.name || f.name}
                  >
                    {f.type === "image" ? (
                      <img
                        className="file-thumbnail"
                        src={f.target}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className={`file-icon ${f.type === "folder" ? "amber" : f.type === "project" ? "mint" : "blue"}`}
                      >
                        <Icon
                          name={
                            f.type === "folder"
                              ? "folder"
                              : f.type === "app"
                                ? "gamepad"
                                : f.type === "link"
                                  ? "link"
                                  : f.type === "project"
                                    ? "code"
                                    : "file"
                          }
                          size={35}
                        />
                      </span>
                    )}
                    <span>{p?.name || f.name}</span>
                    <small>
                      {f.type === "folder"
                        ? `${childrenOf(f.path).length} items`
                        : f.type === "session"
                          ? "temporary"
                          : f.type}
                    </small>
                  </button>
                  {f.type === "local" && (
                    <button
                      className="local-delete"
                      aria-label={`Move ${f.name} to Trash`}
                      onClick={() => {
                        if (trashDocument(f.target!))
                          notify(`${f.name} moved to Trash`);
                      }}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {!items.length && (
            <div className="empty-state">
              <Icon name="search" />
              <p>No matching files in this folder.</p>
            </div>
          )}
        </div>
      </div>
      <footer className="app-status">
        <span>{items.length} items</span>
        <span>~{path === "/" ? "" : path} · Virtual portfolio filesystem</span>
      </footer>
      {context && (
        <Popover
          label="File actions"
          className="context-menu"
          close={() => setContext(null)}
          style={{ left: Math.max(8, context.x), top: Math.max(8, context.y) }}
        >
          <span className="context-title">
            {context.file?.name ||
              (path === "/" ? "Home" : path.split("/").at(-1))}
          </span>
          {context.file && (
            <button
              onClick={() => {
                launch(context.file!);
                setContext(null);
              }}
            >
              <Icon name="external" />
              Open
            </button>
          )}
          <button onClick={() => startCreate("folder")}>
            <Icon name="folder" />
            New Folder
          </button>
          <button onClick={() => startCreate("file")}>
            <Icon name="file" />
            New Text File
          </button>
          {context.file?.type === "folder" && (
            <button
              onClick={() => {
                open("terminal", context.file!.path);
                setContext(null);
              }}
            >
              <Icon name="terminal" />
              Open in Terminal
            </button>
          )}
          {!context.file && (
            <button
              onClick={() => {
                open("terminal", path);
                setContext(null);
              }}
            >
              <Icon name="terminal" />
              Open in Terminal
            </button>
          )}
          {context.file?.type === "local" && (
            <button
              onClick={() => {
                if (trashDocument(context.file!.target!))
                  notify(`${context.file!.name} moved to Trash`);
                setContext(null);
              }}
            >
              <Icon name="trash" />
              Move to Trash
            </button>
          )}
          {context.file && (
            <button
              onClick={() => {
                notify(
                  context.file!.type === "folder"
                    ? `${context.file!.name}: ${childrenOf(context.file!.path).length} items`
                    : `${context.file!.name} · ${context.file!.type}${context.file!.content ? ` · ${context.file!.content.length} characters` : ""}`,
                );
                setContext(null);
              }}
            >
              <Icon name="info" />
              Properties
            </button>
          )}
          {context.file &&
            sessionEntries.some(
              (entry) => entry.path === context.file?.path,
            ) && (
              <button
                onClick={() => {
                  removeSessionEntry(context.file!.path);
                  setContext(null);
                  notify(`${context.file!.name} removed for this session`);
                }}
              >
                <Icon name="trash" />
                Delete
              </button>
            )}
        </Popover>
      )}
      {createMode && (
        <Popover
          label={createMode === "folder" ? "Create folder" : "Create text file"}
          className="context-create"
          close={() => setCreateMode(null)}
          style={{
            left: Math.max(16, (innerWidth - 360) / 2),
            top: Math.max(16, (innerHeight - 220) / 2),
          }}
        >
          <span className="context-title">
            New {createMode === "folder" ? "Folder" : "Text File"}
          </span>
          <form onSubmit={submitCreate}>
            <label>
              <span>Name</span>
              <input
                aria-label={
                  createMode === "folder" ? "Folder name" : "File name"
                }
                name="fileName"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                autoComplete="off"
              />
            </label>
            <div className="button-row">
              <button
                type="button"
                className="text-button"
                onClick={() => setCreateMode(null)}
              >
                Cancel
              </button>
              <button type="submit" className="button">
                Create
              </button>
            </div>
          </form>
        </Popover>
      )}
    </div>
  );
}
export function DocumentViewer({ path }: { path?: string }) {
  const file = getFile(path || "");
  return (
    <div className="text-viewer scroll-area">
      <pre>{file?.content || "This document could not be found."}</pre>
    </div>
  );
}
export function ImageViewer({ src }: { src?: string }) {
  const [zoom, setZoom] = useState(0);
  return (
    <div className="image-viewer">
      <div className="app-toolbar">
        <span className="muted small">{src?.split("/").pop()}</span>
        <div className="button-row">
          <button
            className="icon-button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(25, (z || 100) - 25))}
          >
            <Icon name="zoomOut" />
          </button>
          <button className="text-button" onClick={() => setZoom(0)}>
            {zoom ? `${zoom}%` : "Fit"}
          </button>
          <button
            className="icon-button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(300, (z || 100) + 25))}
          >
            <Icon name="zoomIn" />
          </button>
          <a
            className="icon-button"
            href={src}
            target="_blank"
            rel="noreferrer"
            aria-label="Open original image"
          >
            <Icon name="external" size={16} />
          </a>
        </div>
      </div>
      <div className={`image-canvas ${zoom ? "zoomed" : ""}`}>
        <img
          src={src}
          alt={src?.split("/").pop()?.replace(/[-_]/g, " ") || "Project image"}
          style={
            zoom
              ? { width: `${zoom}%`, maxWidth: "none", maxHeight: "none" }
              : {}
          }
        />
      </div>
    </div>
  );
}
